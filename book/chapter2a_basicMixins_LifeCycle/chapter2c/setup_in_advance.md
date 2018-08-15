# Setup: In advance

> TLDR: Create elements with the immediate setupCallback punchline, 
> style them as `display:none`, and add them to the DOM when the browser is idle.
> Later, when you plan to use them, just change the `display` property.

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

## Pattern: add new DOM elements in advance with `display: none`.

Often, a "critical period" comes after an "idle period" for the browser.
To avoid *constructing, setting up and connecting* new elements to the DOM during a critical period,
the developer can instead *construct, set up, **hide**, and connect* the element in advance, 
during the idle period, and then when needed simply **show** the element.

So, in order to prepare elements in advance, you likely desire to:
0. construct the element,
1. trigger `setupCallback()`,
2. connected the new elements to the DOM,
3. calculate CSS style,
4. (maybe) calculate layout of the elements, but
5. avoid triggering paint as this might cause the screen to flicker. 
(todo, check the validity of this problem??)

This example illustrates the pattern:
```javascript
 class MyEl extends HTMLElement {
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
customElements.define("my-el", MyEl);
const el = document.createElement("my-el");
el.style.display = "none";
document.querySelector("body").appendChild(el); 
//start
//connected
//setup
setTimeout(() => {
  el.style.display = "inline"; 
//"I am visible" appears on the screen after 3000ms 
}, 3000);
```

## Alternative 1: only construct and setup elements in advance 

When elements are added to the DOM, even when they are styled `display: none`,
event listeners are added and active.
If you do not want or need to activate event listeners, 
you can simply create elements without attaching them:

```javascript
 class MyEl2 extends HTMLElement {
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
customElements.define("my-el", MyEl2);
const el = document.createElement("my-el");
el.setupCallback();
//start
//setup
setTimeout(() => {
  document.querySelector("body").appendChild(el);
  //connected
  //"I am visible" appears on the screen after 3000ms 
}, 3000);
```

## Alternative 2: construct, setup, connect and calculate layout of elements in advance 

When elements are added to the DOM with `display: none`,
their layout is not calculated.
If you need to calculate layout in advance, use `visibility: hidden` instead of `visibility: hidden`.

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
const el = document.createElement("my-el");
el.style.visibility = "hidden";
document.querySelector("body").appendChild(el); 
//start
//connected
//setup
setTimeout(() => {
  el.style.visibility = "visible"; 
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
1. you need to find a trigger or que that lets you know when the browser has idle resources, or 
at least some mechanism to identify that your browser is not in a critical period.
`requestIdleCallback()` is best suited for this.
2. you must identify whether or not you need to prepare css and layout calculation.
If it does not matter if your elements are already connected to the DOM, then 
wait to connect them to the DOM until you use the elements.
If it is enough to pre-calculate style, use `display: none`.
If you need to pre-calculate as much as possible, use `opacity: 0`.
3. when you use your element:
   1. If the element has been prepared, attach it to the DOM or un-hide it.
   2. If the element is not already prepared, 
   make a new one instead and **remember to cancel the queued inAdvance setup**!

These principles are general and apply to custom and native HTML elements alike.

## Reference
 * MDN requestIdleCallback()
 * find references on existing solutions for preparing elements while placing outside of the viewport.
 * try to find documentation that it is smart to place the "preparation area" in the same document, 
 so as to avoid document adoptation.

