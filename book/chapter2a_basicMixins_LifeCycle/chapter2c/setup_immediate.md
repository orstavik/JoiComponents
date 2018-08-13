# Setup: Immediate

> TLDR: trigger `setupCallback()` *immediately before* the `connectedCallback()` is executed.
> Add `this.isSetup || (this.setupCallback(), this.isSetup = true);`
> at the *very* beginning of `connectedCallback()`.

When an element is created and immediately added to the DOM, 
the element must be setup:
1. *after* the `constructor()` has completed,
2. *after* attributes from HTML template has been set on an element, and
3. *before* the `connectedCallback()` has been executed.

This gives us two alternatives for triggering a `setupCallback()`:
1. queued *after* the constructor has run *and* the HTML template attributes has been set, or
2. triggered *immediately before* the `connectedCallback()` is executed.

Alternative 1 fails, while 2 works. But why is that?

## Anti-pattern: Trigger `setupCallback()` immediately from the `constructor()`

First, we try some examples of triggering `setupCallback()` from the `constructor()` 
using the micro-task que:

```html
<script>
class MyElement extends HTMLElement {
  
  constructor(){
    super();
    Promise.resolve().then(()=> this.setupCallback());
  }
  
  setupCallback(){
    console.log("is already connected? " + this.isConnected);
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//is already connected? false
//html-attribute? null
//"Uncaught DOMException: Failed to construct 'CustomElement': The result must not have attributes"
</script>

<my-element html-attribute="yes"></my-element>
```

As this example shows, the micro-task que is triggered *before* HTML attributes has been set.
This both fails to detect the `html-attribute` in the template, *and* throws the
`"Uncaught DOMException: Failed to construct 'CustomElement': The result must not have attributes"`. 

Second, we try to trigger `setupCallback()` from the `constructor()` using `requestAnimationFrame`:
```html
<script>
class MyElement extends HTMLElement {
  
  constructor(){
    super();
    requestAnimationFrame(()=> this.setupCallback());      //same example, only this line changed
  }
  
  setupCallback(){
    console.log("is already connected? " + this.isConnected);
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//is already connected? true
//html-attribute? yes
</script>

<my-element html-attribute="yes"></my-element>
```

As this example shows, the setupCallback is now correctly executed *after* the attributes has been set,
but now also *after* the element has been connected to the DOM, which is too late.

These two ques are our best bet.
There are no other task ques or events or callbacks (except `connectedCallback()`)
that can trigger `setupCallback()` *after* HTML attributes has been set and *before* 
`connectedCallback()` has been executed (without delaying `connectedCallback()`).
Triggering `setupCallback()` immediately from the `constructor()` therefore fails.

## Pattern: `setupCallback()` immediately before the very first `connectedCallback()`

However, `connectedCallback()` is always triggered *after* HTML attributes have been set.
And, to ensure that a method will run immediately *before* the execution of other logic 
in `connectedCallback()`, we simply have to place a call to this method at the *very* beginning 
of the `connectedCallback()`. Here is an example:

```html
<script>
class MyElement extends HTMLElement {
  
  connectedCallback(){
    this.isSetup || (this.setupCallback(), this.isSetup = true);     //[1]
    //super.connectedCallback();                                     //[2]
    console.log("running connectedCallback");
  }
  
  setupCallback(){
    console.log("running setupCallback");
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//running setupCallback
//html-attribute? yes
//running connectedCallback
</script>

<my-element html-attribute="yes"></my-element>
```
1. This single line runs `setupCallback()` 
*only the first time* and *before* `connectedCallback()` executes.
It also sets the property `.isSetup` to true on the element.
2. Even calls to `super.connectedCallback();` must be placed after this one line wonder.
Although mixins that rely on the element calling `super.connectedCallback();` should be
isolated from any dependencies from the elements `setupCallback()` 
(and thus probably would remain unaffected),
placing the single line wonder at the very beginning of `connectedCallback()`
clearly states the two lifecycle callbacks position against each other.

### Solution: SetupFirstConnected Mixin
The above solution can also be implemented as a mixin.

```html
<script>
const SetupFirstConnected = function(Base){
  return class SetupFirstConnected extends Base {
    connectedCallback(){
      this.isSetup || (this.setupCallback(), this.isSetup = true);
      super.connectedCallback && super.connectedCallback();
    }
  }
}

class MyElement extends SetupFirstConnected(HTMLElement) {
  
  connectedCallback(){
    super.connectedCallback();                                     
    console.log("running connectedCallback");
  }
  
  setupCallback(){
    console.log("running setupCallback");
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//running setupCallback
//html-attribute? yes
//running connectedCallback
</script>

<my-element html-attribute="yes"></my-element>
```

## Opinion
The native `connectedCallback()` could have a parameter (a boolean or int)
that described if or how many times the element had been connected to the DOM before.

## Reference
 * find documentation on Polymer .ready()