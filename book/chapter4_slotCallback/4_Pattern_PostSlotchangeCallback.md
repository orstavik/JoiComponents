# Pattern: PostSlotchange

The timing of `slotchange` is tricky. `slotchange` is an event, but it is *not* dispatched from the
event loop like other "normal" events like `click` and `offline`. No, `slotchange` events are 
dispatched [`MutationObserver` time](https://dom.spec.whatwg.org/#mutation-observers).
This means that whenever you perform an operation such as `.appendChild(..)` or `.innerHTML` in
JS that would trigger a `slotchange` event, then this event is added to the micro-task que.

## Example: How async is `slotchange`?

Lets look at a very small example:
```html
<template>
  <style>
    div { border: 4px solid green; }
  </style>
  <div>
    <slot></slot>
  </div>
</template>

<script>
  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      console.log("1. SYNC constructor");
      Promise.resolve().then(() => console.log("3. ASYNC constructor before shadowDOM"));
      Promise.resolve().then(() => Promise.resolve().then(() => console.log("6. 2xASYNC constructor before shadowDOM")));
      const templ = document.querySelector("template").content.cloneNode(true);
      this.shadowRoot.appendChild(templ);
      Promise.resolve().then(() => console.log("5. ASYNC constructor after shadowDOM"));
      this.shadowRoot.addEventListener("slotchange", () => console.log("4. **slotchange**"));
    }
  }

  customElements.define("green-frame", GreenFrame);

  document.addEventListener("DOMContentLoaded", function () {
    const div = document.querySelector("div");
    div.innerHTML = "<green-frame>¯\\_(ツ)_/¯</green-frame>";
    console.log("2. SYNC task after slotchange is queued");
  });
</script>
<div>fill me up!</div>
```
The log prints:

```
1. SYNC constructor
2. SYNC task after slotchange is queued
3. ASYNC constructor before shadowDOM
4. **slotchange**
5. ASYNC constructor after shadowDOM
6. 2xASYNC constructor before shadowDOM
```

 * As we can see from the log, the MutationObserver queues the dispatch of the `slotchange` event 
   in the micro-task que when `.appendChild(..)` adds the shadowDOM to the web component.

 * This means that all the sync tasks are processed *before* `slotchange` is dispatched.

 * Tasks queued in the micro-task que *before* an `.appendChild(..)` or similar triggers a 
   `slotchange` event will be processed before the `slotchange` event.
 
 * Tasks queued in the micro-task que *after* an `.appendChild(..)` or similar triggers a 
   `slotchange` event will be processed before the `slotchange` event.
 
 * This means that by using a 2xASYNC delay, ie. a nested `Promise.resolve().then(...)` call,
   a task can be added to the micro-task que *before* a `slotchange` event is queued, and 
   still be run *after* the `slotchange` event.

## Implementation: `NaivePostSlotchangeMixin`

When we are making mixins, this last 2xASYNC trick is useful. When we are making a mixin, 
this gives us the ability to:
1. trigger a function,
2. from the constructor,
3. *after* all the "custom element reactions" (1xASYNC)
4. *after* its initial `slotchange` event has been triggered (2xASYNC). 

```javascript
function PostSlotchangeMixin(base) {
  return class  PostSlotchangeMixin extends base {
    constructor(){
      super();
      const self = this;
      Promise.resolve().then(function(){
        Promise.resolve().then(function(){
          self.postSlotchangeCallback();
        });
      });
    }
  }
}
```

## Demo: NaivePostSlotchangeCallback

This demo illustrate two things about PostSlotchangeCallback:
1. It works when the browser has completed the main DOM (sync-mode), but
2. it doesn't work when the parser is still constructing the main DOM document (parse-mode).

```html
<script>
  function PostSlotchangeMixin(base) {
    return class  PostSlotchangeMixin extends base {
      constructor(){
        super();
        const self = this;
        Promise.resolve().then(function(){
          Promise.resolve().then(function(){
            self.postSlotchangeCallback();
          });
        });
      }
    }
  }

  class GreenFrame extends PostSlotchangeMixin(HTMLElement) {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
    <style>
      div { border: 4px solid green;}
    </style>
    <div><slot></slot></div>`;
      this.shadowRoot.addEventListener("slotchange", () => console.log("GreenFrame slotchange"));
    }
    postSlotchangeCallback(){
      console.log("GreenFrame POST Slotchange");
    }
  }

  class BlueFrame extends PostSlotchangeMixin(HTMLElement) {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
    <style>
      div { border: 4px dotted blue;}
    </style>
    <div><green-frame><slot></slot></green-frame></div>`;
      this.shadowRoot.addEventListener("slotchange", () => console.log("BlueFrame slotchange"));
    }
    postSlotchangeCallback(){
      console.log("BlueFrame POST Slotchange");
    }
  }

  customElements.define("green-frame", GreenFrame);
  customElements.define("blue-frame", BlueFrame);
</script>

<blue-frame>¯\_(ツ)_/¯</blue-frame>


<div>fill me up</div>
<script>
  console.log("-------------------");
  document.addEventListener("DOMContentLoaded", function(){
    const div = document.querySelector("div");
    div.innerHTML = "<blue-frame>¯\\_(ツ)_/¯</blue-frame>";
  })
</script>
```
But, there is a problem with this test. The logs look like this:
```
GreenFrame slotchange
BlueFrame POST Slotchange
GreenFrame POST Slotchange
GreenFrame slotchange
BlueFrame slotchange
--------------
GreenFrame slotchange
BlueFrame slotchange
GreenFrame slotchange
BlueFrame POST Slotchange
GreenFrame POST Slotchange
```

When the browser is in parser-mode, it will empty the micro-task que *before* it dispatches
`slotchange` events. How do we solve this dilemma?

## Implementation: `PostSlotchangeMixin`

When the parser is still parsing the DOM, it will delay triggering `slotchange` events until it
either pauses or finishes. As there is no way to be alerted about a parse-pause situation, the
only thing we can do is to wait for the parser to finish: the `DOMContentLoaded` event. 
This means that to:
1. get a callback that is triggered from the `constructor()` of a mixin that comes
2. *after* `slotchange` events in sync-mode and 
2. *after* `slotchange` events in parsing-mode, we do this:

```javascript
function callPostSlotchangeCallback(self){
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function(){
        self.postSlotchangeCallback();          
    })
  } else {
    Promise.resolve().then(function(){
      Promise.resolve().then(function(){
        self.postSlotchangeCallback();
      });
    });   
  }
}

function PostSlotchangeMixin(base) {
  return class PostSlotchangeMixin extends base {
    constructor(){
      super();
      callPostSlotchangeCallback(this);
    }
  }
}
```

## Demo: PostSlotchangeCallback

```html
<script>
  function callPostSlotchangeCallback(self){
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function(){
        self.postSlotchangeCallback();
      })
    } else {
      Promise.resolve().then(function(){
        Promise.resolve().then(function(){
          self.postSlotchangeCallback();
        });
      });
    }
  }

  function PostSlotchangeMixin(base) {
    return class PostSlotchangeMixin extends base {
      constructor(){
        super();
        callPostSlotchangeCallback(this);
      }
    }
  }

  class GreenFrame extends PostSlotchangeMixin(HTMLElement) {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
    <style>
      div { border: 4px solid green;}
    </style>
    <div><slot></slot></div>`;
      this.shadowRoot.addEventListener("slotchange", () => console.log("GreenFrame slotchange"));
    }
    postSlotchangeCallback(){
      console.log("GreenFrame POST Slotchange");
    }
  }

  class BlueFrame extends PostSlotchangeMixin(HTMLElement) {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
    <style>
      div { border: 4px dotted blue;}
    </style>
    <div><green-frame><slot></slot></green-frame></div>`;
      this.shadowRoot.addEventListener("slotchange", () => console.log("BlueFrame slotchange"));
    }
    postSlotchangeCallback(){
      console.log("BlueFrame POST Slotchange");
    }
  }

  customElements.define("green-frame", GreenFrame);
  customElements.define("blue-frame", BlueFrame);
</script>

<blue-frame>¯\_(ツ)_/¯</blue-frame>


<div>fill me up</div>
<script>
  setTimeout(function(){
    console.log("--------------");
    const div = document.querySelector("div");
    div.innerHTML = "<blue-frame>¯\\_(ツ)_/¯</blue-frame>";
  }, 1000);
</script>
```

And as the log below shows, this works:
```
GreenFrame slotchange
GreenFrame slotchange
BlueFrame slotchange
BlueFrame POST Slotchange
GreenFrame POST Slotchange
--------------
GreenFrame slotchange
BlueFrame slotchange
GreenFrame slotchange
BlueFrame POST Slotchange
GreenFrame POST Slotchange
```

## References

 * 