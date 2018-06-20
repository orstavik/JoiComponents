# Mixin: FirstConnected
The purpose of `FirstConnectedMixin` is to add a callback hook the first time, 
and only first time, an element is connected to the DOM.
`FirstConnectedMixin` is inspired by the `PolymerElement.ready()` callback.

But, why do we need a `.firstConnectedCallback()`? 
Doesn't the `constructor()` and `.connectedCallback()` give us what we need?

## Problem 1: No attributes in `constructor()`

Browsers can create new HTMLElement instances in three ways. 
1. Using a class constructor: `var el = new MyHTMLElement();`.
2. Using `document.createElement`: `var el = document.createElement("my-element");`.
3. From parsed HTML text, either from the html document or via `.innerHTML`: `<my-element></my-element>`.

When you make a new custom element definition,
you want your custom element to be constructable by all three.
But. When you create an element via 2. `document.createElement`, 
you are not allowed to add attributes. See the example:   
   
```javascript
class AttributeConstructor extends HTMLElement {
  constructor(){
    super();                                                                      
    this.setAttribute("no-no", "NoNoNo");                                         //[1]
  }
}
customElements.define("att-con", AttributeConstructor);
const works = new AttributeConstructor();                                         //[2]
const worksToo = document.createElement("div");
worksToo.innerHTML = "<att-con></att-con>";                                       //[3]
const fails = document.createElement("att-con");                                  //[4]
```

1. An attribute in added to the element in the `constructor()`.
2. This works fine when the element is instantiated via the `constructor()`/`new` in JS.
3. This works fine when the element is instantiated via HTML template, here via `.innerHTML`.
4. But, this fails throws an Error when the element is instantiated via `document.createElement`
(in Chrome: "DOMException: Failed to construct 'CustomElement': The result must not have attributes").

Therefore, if your custom element needs to add or organize its attributes at creation-time, 
and you only have the `constructor()` and `.connectedCallback()` to choose from,
you must organize your elements every time the element is connected to the DOM.
But, an element can be connected and reconnected multiple times during its lifecycle.
And these times are likely to be performance sensitive, 
as elements can often be attached to the DOM as part of a bigger branch. 
Hence, it is less than ideal to do more work than strictly necessary at `connectedCallback()`.
So, If you only need to set up your attributes once, 
you would like to have a callback hook that is triggered sometime *after* the 
`constructor()` but *before* the `connectedCallback()`: `firstConnectedCallback()`.

## Problem 2: template elements created at start up

With various use of template based patterns, libraries, frameworks, and `HTMLTemplateElement`,
web apps can create several *alternative* DOM branches that it intends to switch between at run-time.
For example, an app can create ten different pages as DOM branches in memory at startup, and
then later switch between these pages by connecting and disconnecting them to the DOM one by one.

Such an architecture can yield great performance while the app is in use and
a simple and clear structure in development. It is a good thing.
But, such an architecture also pushes a lot of work at startup time, thus slowing down the app at load time.
In our example, all the ten pages and all their DOM elements are then created at startup time.
Now, if the `constructor()` in all these DOM nodes are doing work,
then these `constructor()`s will slow down the app at startup.

In order to avoid this bottleneck, the 'meaty' set up work should be 
removed from the `constructor()` and instead be delayed until either the browser has 
spare time or when the element are first connected to the DOM.
Hence `firstConnectedCallback()`.

## `firstConnectedCallback()`

It is surprisingly simple to create a callback method that is:
* only called once 
* immediately before an element is connected to the DOM for the very first time.

In fact, it can be accomplished with just a single line of code placed at 
*the very beginning* in an element's `connectedCallback()`:
```javascript
this.hasBeenConnected || ((this.hasBeenConnected = true) && this.firstConnectedCallback());
```

## Example: AlloAllo
In this example, the element will:
* log the first message once at the very beginning of the first `connectedCallback()`, and 
* later the second question message both at the first and repeated `connectedCallback()`s.

```javascript
class AlloAllo extends HTMLElement {

  firstConnectedCallback(){                                                                     //[3]
    console.log("1. I will tell this only once.");
  }
  
  connectedCallback(){
    this.hasBeenConnected || ((this.hasBeenConnected = true) && this.firstConnectedCallback()); //[1]
    //if (super.connectedCallback) super.connectedCallback();                                   //[2]
    console.log("2. Do you remember what I told you?");
  }
}
customElements.define("allo-allo", AlloAllo);

const allo = document.createElement("allo-allo");
const body = document.querySelector("body");
setTimeout(()=> body.appendChild(allo), 0);
//1. I will tell this only once.
//2. Do you remember what I told you?
setTimeout(()=> body.removeChild(allo), 1000);                           
setTimeout(()=> body.appendChild(allo), 2000);
//2. Do you remember what I told you?
setTimeout(()=> body.removeChild(allo), 3000);
setTimeout(()=> body.appendChild(allo), 4000);
//2. Do you remember what I told you?
```                                                                   

1. `this.hasBeenConnected` is an undefined property on the element that is only defined and set when 
`firstConnectedCallback()` is first called.
2. To place the single line check and call to `firstConnectedCallback()` at the *absolute beginning* 
of `connectedCallback()`, the line must be placed *above* any call to `super.connectedCallback()`.
3. The first time `connectedCallback()` is called, `this.hasBeenConnected` is `undefined`.
`this.hasBeenConnected` is then immediately set to true, and `this.firstConnectedCallback()` is called.
Later, unless tampered with, `this.hasBeenConnected` is true and `this.firstConnectedCallback()` is not called for.

## Mixin: FirstConnectedMixin

The `firstConnectedCallback()` can also be set up as a mixin and used similarly.

```javascript
const first = Symbol("first");
const FirstConnectedMixin = function (Base) {
  return class FirstConnectedMixin extends Base {

    constructor() {
      super();
      this[first] = false;
    }

    connectedCallback() {
      this[first] || ((this[first] = true) && this.firstConnectedCallback());
      if (super.connectedCallback) super.connectedCallback();
    }
  }
};
```

### Example: AlloAlloMixin

We recycle our `AlloAllo` example from above, except this time using an external mixin. The result is the same.

```javascript
import {FirstConnectedMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/FirstConnectedMixin.js";

class AlloAlloMixin extends FirstConnectedMixin(HTMLElement) {

  firstConnectedCallback(){
    console.log("1. I will tell this only once.");
  }
  
  connectedCallback(){
    super.connectedCallback();
    console.log("2. Do you remember what I told you?");
  }
}
customElements.define("allo-allo-mixin", AlloAlloMixin);

const allo = document.createElement("allo-allo-mixin");
const body = document.querySelector("body");
setTimeout(()=> body.appendChild(allo), 0);
//1. I will tell this only once.
//2. Do you remember what I told you?
setTimeout(()=> body.removeChild(allo), 1000);                           
setTimeout(()=> body.appendChild(allo), 2000);
//2. Do you remember what I told you?
setTimeout(()=> body.removeChild(allo), 3000);
setTimeout(()=> body.appendChild(allo), 4000);
//2. Do you remember what I told you?
```                                                                   

Test it out on [codepen](https://codepen.io/orstavik/pen/pLmYEM).

## Opinionated advice
* the platform could include a boolean argument in the native connectedCallback that would be true 
if the connectedCallback had never been run before on this particular element. 
Such a change would not break existing code, should be efficient, would simplify app code, and 
unify various frameworks. Just a thought..

## Reference
 * find documentation on Polymer .ready()