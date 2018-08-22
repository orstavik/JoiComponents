# Setup: In advance

> TLDR: Create elements with the SetupMixin, and 
> add them to a template or directly in the DOM using `visibility: hidden` when the browser is idle.
> Later, when you need them, clone them into the DOM or change the `visibility` property.

The problem and pattern described in this chapter is not isolated to custom elements,
but applies to all DOM node types. 
It is added in this chapter however to describe means to both prepare and delay
custom elements, to complete the picture.

## Problem: construct, setup and connect new elements to the DOM during a critical period

There are some "critical periods" during the running of an app. For example:
 * A user interacts with the page, triggering events such as `touchmove`.
 * A server alerts the page of new updates and messages.

During such "critical periods" the user is very attuned and sensitive to the apps performance. 
Unfortunately, during such critical periods, the browser also has the most work:
`touchmove` events are fired at the app like from a machine gun, and/or
servers dump big blocks of raw data that the browser is just expected to process and present immediately.
And so, if processing of events or data are too heavy during critical periods,
the task will cause jank, ie. overburden the browser causing it to miss frames or halt 
when you least want it.

And, to both *construct, setup and connect* new elements to the DOM is a heavy task.
Creating new elements can be labor intensive in JS, 
but in addition the new elements cause the browser to calculate style, layout and paint 
when they get connected to the DOM.
So, the developer is faced with a dilemma:
What should I do when I need to add a new element to the DOM (a heavy task) 
during a critical period (when I want to avoid heavy tasks)?

## TODO Pattern: 

1. make a template,
1b. Add a function that triggers setupCallback() on the elements in the template.

Trigger only the `constructor()` of all the DOM elements.
2. clone the template,
to make a custom entity
(cloneNode will trigger setupCallback if the element being cloned isSetup).
3. add and hide template clone in the DOM,
   this will trigger setupCallback(), if needed, connectedCallback() and style and maybe layout calculation
4. Alternative to 3. Run a recursive function that triggers setupCallback() in advance on an element 
   and all its children. todo put this method into the mixin??

## Pattern: add new DOM elements in advance with `visibility: hidden` or `display: none`.

Sometimes, a "critical period" comes after an "idle period" for the browser.
To avoid *constructing, setting up and connecting* new elements to the DOM during a critical period,
the developer can instead *construct, set up, **hide**, and connect* the element in advance, 
during the idle period, and then when needed simply **show** the element.

So, in order to fully prepare an element in advance, you desire to:
0. construct the element,
1. trigger `setupCallback()`
2. and `connectedCallback()` by connecting the new elements to the DOM,
3. make the browser calculate CSS style and
4. layout of the element (*), but
5. avoid triggering paint as this might cause the screen to flicker. 

Layout will be calculated when the element is hidden using `visibility: hidden`.
Layout will *not* be calculated when the element is hidden using `display: none`.
The example below illustrates this pattern.

```javascript
import {SetupMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/SetupMixin.js";

class MyEl3 extends SetupMixin(HTMLElement) {
  constructor(){
    super();
    console.log("start");
  }
  setupCallback(){
    this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML = "I am visible";
    console.log("setup");
  }
  connectedCallback(){
    super.connectedCallback();
    console.log("connected");
  }
}
customElements.define("my-el", MyEl3);
const el = document.createElement("my-el");
//start
el.style.visibility = "hidden"; //or, if you don't want to calculate layout: el.style.display = "none"; 
document.querySelector("body").appendChild(el); 
//setup
//connected
setTimeout(() => {
  el.style.visibility = "visible"; //or el.style.display = "unset"/"block"/"inline";
//"I am visible" appears on the screen after 3000ms 
}, 3000);
```

## Alternative: Prepare new elements by only triggering setupCallback() 

If you only need to prepare the `setupCallback()` you can do so directly 
without adding the element to the DOM.
The benefit of this approach is that it can avoid triggering `connectedCallback()`
and style and layout calculation, if this is something you wish to avoid.
The drawback of this approach is that triggering `setupCallback()` on a parent will not
automatically trigger `setupCallback()` on its lightDOM nor shadowDOM children.
If you need to do so, this must be done in addition.
Therefore, this should be considered an alternative approach, not your main option.

```javascript
import {SetupMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/SetupMixin.js";

class MyEl2 extends SetupMixin(HTMLElement) {
  constructor(){
    super();
    console.log("start");
  }
  connectedCallback(){
    super.connectedCallback();
    console.log("connected");
  }
  setupCallback(){
    this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML = "I am visible";
    console.log("setup");
  }
}
customElements.define("my-el", MyEl2);
const el = document.createElement("my-el");
//start
el.setupCallback();
//setup
el.isSetup = true;
setTimeout(() => {
  document.querySelector("body").appendChild(el);
  //connected
  //"I am visible" appears on the screen after 3000ms 
}, 3000);
```

## `requestIdleCallback()`
Use `requestIdleCallback()` or some other method to find a suitable time to prep elements.
Prepping elements for later consumption will not do you much good if the element is prepped
during another critical period.

```javascript
class MyEl3 extends HTMLElement {
  constructor(){
    super();
    console.log("start");
  }
  connectedCallback(){
    this.isSetup || (this.setupCallback(), this.isSetup = true);
    console.log("connected");
  }
  setupCallback(){
    this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML = "I am visible";
    console.log("setup");
  }
}
customElements.define("my-el", MyEl3);

//step 1: que an inAdvance element
let el;
let inAdvance = requestIdleCallback(() => {
  el = document.createElement("my-el");
  el.style.visibility = "hidden";
  document.querySelector("body").appendChild(el);
});

//step 2: use the inAdvance element, or if not yet ready, cancel the inAdvance action and just make one when you need it
setTimeout(() => {
  if (el) {
    el.style.visibility = "visible";
  } else {
    cancelIdleCallback(inAdvance);
    el = document.createElement("my-el");
    document.querySelector("body").appendChild(el);
  }
//"I am visible" appears on the screen after 3000ms 
}, 3000);
```
## Discussion

Which event, que or callback you use to setup your elements inAdvance depend on your app.
But the basic principles for timing remains the same: 
1. find a trigger or que that lets you know when the browser has idle resources, or 
at least some mechanism to identify that your browser is not in a critical period, 
cf. `requestIdleCallback()`.
2. identify whether or not you need to prepare css and layout calculation.
If it does not matter if your elements are already connected to the DOM, then 
wait to connect them to the DOM until you use the elements.
If it is enough to pre-calculate style, use `display: none`.
If you need to pre-calculate as much as possible, use `opacity: 0`.
3. when you use your element:
   1. If the element has been prepared, attach it to the DOM or un-hide it.
   2. If the element is not already prepared, 
   make a new one instead and **remember to cancel the queued inAdvance setup**!

These principles are general and apply to custom and native HTML elements alike.
By setting up elements *in advance*, an app can increase its performance 
at a later critical moment tasks relating to UI interaction is taxing the browser's resources hard.

## Reference
 * MDN requestIdleCallback()
 * find references on existing solutions for preparing elements while placing outside of the viewport.
 * try to find documentation that it is smart to place the "preparation area" in the same document, 
 so as to avoid document adoptation.

