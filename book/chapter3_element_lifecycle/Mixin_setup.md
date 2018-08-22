# Setup: Immediate

> TLDR: `SetupMixin` triggers `setupCallback()` *immediately before* `connectedCallback()`.
> The `.isSetup` property is added to the element, and set to true once the element is set up.

When an element is created and immediately added to the DOM, 
the element must be setup:
1. *after* the `constructor()` has completed,
2. *after* attributes from HTML template has been set on an element, and
3. *before* the `connectedCallback()` has been executed.

This gives us two alternatives for triggering a `setupCallback()`:
1. queued *after* the constructor has run *and* the HTML template attributes has been set, or
2. triggered *immediately before* the `connectedCallback()` is executed.

We try both alternatives.

## Anti-pattern: Trigger `setupCallback()` immediately from the `constructor()`

First, a `setupCallback()` could be queued from the `constructor()` in the micro-task que:

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

As this example shows, `setupCallback()` is now correctly executed *after* the attributes has been set,
but now also *after* the element has been connected to the DOM, which is too late.

No other task ques or events can trigger `setupCallback()`
 * *after* HTML attributes has been set and 
 * *before* `connectedCallback()` has been executed.

Triggering `setupCallback()` immediately from the `constructor()` therefore fails.

## Pattern: trigger `setupCallback()` immediately *before* the very first `connectedCallback()`

However, `connectedCallback()` is always triggered *after* HTML attributes have been set.
And, to ensure that a method will run immediately *before* the execution of other logic 
in `connectedCallback()`, we simply have to place a call to this method at the *very* beginning 
of the `connectedCallback()`. 

```javascript
connectedCallback() {
  if (!this.isSetup){     //this.isSetup is assumed to be undefined the first time 
    this.setupCallback(); //so that the setupCallback() is only called once, the first time
    this.isSetup = true;  //set this.isSetup to true, 
  }
  //super.connectedCallback();
  //do your other stuff here
}
```

### Example: FirstConnected

```html
<script>
class FirstConnected extends HTMLElement {
  
  connectedCallback(){
    if (!this.isSetup){                                              //[1] 
      this.setupCallback();                                          //[2]
      this.isSetup = true;                                           //[3] 
    }
    console.log("running connectedCallback");
  }
  
  setupCallback(){
    console.log("running setupCallback");
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("first-connected", FirstConnected);
//running setupCallback
//html-attribute? yes
//running connectedCallback
</script>

<first-connected html-attribute="yes"></first-connected>
```
1. The first time `connectedCallback()` runs, `this.isSetup` is `undefined`, and so the `if`-loop runs.
2. `setupCallback()` is invoked on `this` element.
3. By setting `this.isSetup` to true, the `if`-loop will not run again, and 
the element is marked as having been setup.

## Mixin: SetupMixin
This solution can also be minified and implemented as a single [punchline](../chapter2_HowToMakeMixins/PatternX_punchline.md).
```javascript
connectedCallback() {
  this.isSetup || (this.isSetup = true, this.setupCallback());
  //super.connectedCallback();
  //do your other stuff here
}
```
Using this minified solution can also be implemented as a mixin.
In this mixin, we can also add a getter and setter for `isSetup` to protect it from being tampered with.

```javascript
const isSet = Symbol("isSet");

function SetupMixin(Base){
  return class SetupMixin extends Base {
    constructor(){
      super();
      this[isSet] = false;
    }
    get isSetup(){
      return this[isSet];
    }
    set isSetup(bool){
      if (this[isSet] || bool !== true)
        throw new Error("SetupMixin: .isSetup property should only be changed once and only to true.");
      this[isSet] = true;
    }
    connectedCallback(){
      this.isSetup || (this.setupCallback(), this.isSetup = true);
      super.connectedCallback && super.connectedCallback();         //[*]
    }
  }
}
```
 * Calls to `super.connectedCallback();` must be placed after the `isSetup` check.
   Although mixins that rely on the element calling `super.connectedCallback();` should be
   isolated from any dependencies from the elements being set up (and thus probably would remain unaffected),
   placing the invocation of `setupCallback()` at the very beginning of `connectedCallback()`
   clearly depict the sequence of the two lifecycle callbacks.

### Example: FirstConnected using SetupMixin
```html
<script>
const isSet = Symbol("isSet");

function SetupMixin(Base){
  return class SetupMixin extends Base {

    constructor(){
      super();
      this[isSet] = false;
    }

    get isSetup(){
      return this[isSet];
    }

    set isSetup(bool){
      if (this[isSet] || bool !== true)
        throw new Error("SetupMixin: .isSetup property should only be changed by the SetupMixin and to true.");
      this[isSet] = true;
    }

    connectedCallback(){
      this.isSetup || (this.setupCallback(), this.isSetup = true);
      super.connectedCallback && super.connectedCallback();
    }
  }
}

class MyElement extends SetupMixin(HTMLElement) {
  
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
## Problem: `.cloneNode(deep)`

But, what happens if we clone such an element? 
Will the cloned element contain the properties, shadowDOM, event listeners etc. 
if these properties are set up in `setupCallback()` instead of in the `constructor()`?

The short answer is no, as the example below illustrates 
(this example uses the punchline for brevity):
```html
<script>
class MyElement extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "constructor<br>";
  }
  
  setupCallback(){                                                            
    this.shadowRoot.innerHTML += "setup: " + this.getAttribute("html-attribute") + "<br>";
  }
  
  connectedCallback(){
    this.isSetup || (this.setupCallback(), this.isSetup = true);
    this.shadowRoot.innerHTML += "connected <br>";
  }
}
customElements.define("my-element", MyElement);
</script>

<my-element html-attribute="yes"></my-element>
<hr>
<script>
  const clone = document.querySelector("my-element").cloneNode(true);
  document.appendChild(clone);
  console.log(clone.getAttribute("html-attribute"));
</script>
```
As this example illustrates, `.cloneNode()` of custom elements simply runs the `constructor()` again.
However, the `HTMLElement.cloneNode()` can be overridden in the mixin. 
This yields the following structure:

```html
<script>
class MyElement extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "constructor<br>";
  }
  
  setupCallback(){                                                            
    this.shadowRoot.innerHTML += "setup: " + this.getAttribute("html-attribute") + "<br>";
  }
  
  cloneNode(deep){
    const clone = super.cloneNode(deep);
    this.isSetup && (clone.setupCallback(), clone.isSetup = true);
    return clone;
  }
  
  connectedCallback(){
    this.isSetup || (this.setupCallback(), this.isSetup = true);
    this.shadowRoot.innerHTML += "connected <br>";
  }
}
customElements.define("my-element", MyElement);
</script>

<my-element html-attribute="yes"></my-element>
<hr>
<script>
  const clone = document.querySelector("my-element").cloneNode(true);
  document.appendChild(clone);
  console.log(clone.getAttribute("html-attribute"));
</script>
```
This modified example returns a clone that isSetup if the custom element 
extending SetupMixin also isSetup.
And adding the overriding element to SetupMixin looks like this:

```javascript
const isSet = Symbol("isSet");

function SetupMixin(Base){
  return class SetupMixin extends Base {
    constructor(){
      super();
      this[isSet] = false;
    }
    get isSetup(){
      return this[isSet];
    }
    set isSetup(bool){
      if (this[isSet] || bool !== true)
        throw new Error("SetupMixin: .isSetup property should only be changed once and only to true.");
      this[isSet] = true;
    }
    cloneNode(deep){
      const clone = super.cloneNode(deep);
      this.isSetup && (clone.setupCallback(), clone.isSetup = true);
      return clone;
    }
    connectedCallback(){
      this.isSetup || (this.setupCallback(), this.isSetup = true);
      super.connectedCallback && super.connectedCallback();         //[*]
    }
  }
}
//todo untested
```

## Reference
 * todo make unit tests
 * MDN cloneNode and spec that says that custom elements trigger their JS .cloneNode(deep) when cloned. 
 * todo find documentation on Polymer .ready() and 
   similar second constructors / setup steps in other frameworks