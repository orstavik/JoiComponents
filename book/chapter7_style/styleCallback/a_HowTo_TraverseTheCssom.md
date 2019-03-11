# Mixin: NaiveStyleCallback

The NaiveStyleCallback pattern can be implemented as a mixin.
In addition to the StaticSetting pattern, the NaiveStyleCallback mixin uses the 
TimedLifecycleCallbacks pattern to batch, observe the CSSOM and trigger the `styleCallback(...)` 
when needed.

The `NaiveStyleCallbackMixin` exports two global methods:
 * `startStyleCallback()` (which is started by default)
 * `stopStyleCallback()`
 
plus exposes two methods on the web components that extend it:
 ```
  ...
  static get observedStyles(){
    return ["font-size", "--custom-color-prop"];
  }
  
  styleCallback(name, oldValue, newValue){
     ...
  }
```

These methods observe changes of the style properties on the element for the `observedStyles` names
and then trigger the `styleCallback(name, oldValue, newValue)` whenever these properties change.

## Implementation 

```javascript
const batch = [];
let interval;

function addToBatch(el) {
  batch.push(el);
}

function removeFromBatch(el){
  batch.splice(batch.indexOf(el), 1);
}

function runBatchProcess(){
  const els = batch.clone();
  for (let el of els) {
    if (batch.indexOf(el) >= 0) 
      pollStyle(el);
  }
}

function pollStyle(el){
  const newStyles = getComputedStyle(el);
  for (let prop of Object.getKeys(el[oldStyles])) {
    let newValue = newStyles.getPropertyValue(prop);
    let oldValue = el[oldStyles][prop];
    if (newValue !== oldValue){
      el.styleCallback(prop, oldValue, newValue);
      el[oldStyles][prop] = newValue;          
    }
  }
}

export function startStyleCallback(){
  interval = requestAnimationFrame(runBatchProcess);
}

export function stopStyleCallback(){
  clearAnimationFrame(interval);
}

startStyleCallback();

const oldStyles = Symbol("oldStyles");

function NaiveStyleCallbackMixin(type){
  return class NaiveStyleCallbackMixin extends type {
    
    constructor(){
      super();
      this[oldStyles] = {};
      for (let style of this.constructor.observedStyles())
        this[oldStyles][style] = undefined;
    }
    
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }
    disconnectedCallback(){
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }
  };
}
```
## Demo: `<blue-blue>` with NaiveStyleCallbackMixin

```html
<script type="module">
  import {NaiveStyleCallbackMixin} from "NaiveStyleCallbackMixin.js";

  class BlueBlue extends NaiveStyleCallbackMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
       <style>
         div#core {                             
           background-color: var(--light-color, lightblue);              
           color: var(--dark-color, darkblue);          
         }
       </style>
       <div id="core">
         <slot></slot>
       </div>`;                                                      
    }
    
    static get observedStyles(){
      return ["color"];
    }
    
    styleCallback(name, oldValue, newValue){
      if (name === "color"){
        const div = this.shadowRoot.children[1];
        if (newValue) {
          div.style.setProperty("--light-color", "light" + newValue);
          div.style.setProperty("--dark-color", "dark" + newValue);
        } else {
          div.style.setProperty("--light-color", undefined);
          div.style.setProperty("--dark-color", undefined);
        }
      }
    }
  }

  customElements.define("blue-blue", BlueBlue);
</script>

<style>
#one {
  color: green;
}
</style>

<blue-blue id="one">green</blue-blue>            <!--[3]-->
<blue-blue id="two">still blue</blue-blue>        

<script>
setTimeout(function(){
  const two = document.querySelector("blue-blue#two");
  two.style.color = "red";
  two.innerText = "blue becomes red";
}, 3000);
</script>
```

## Naivité 1: infinite loops

There are several problems with the *naive* `styleCallback(...)`:

 * What if the `styleCallback(...)` alters a `:host()` rule in the shadowDOM that changes 
   the very CSS property it is observing? Could this loop infinitely animation frame after 
   animation frame?
   
 * What if the `styleCallback(...)` causes a side-effect that changes the very CSS property 
   it is observing? What if `styleCallback(...)` (in)directly altered an attribute on the host element that
   was observed from the outside and triggered a function that altered the CSS property?
   What if `styleCallback(...)` (in)directly caused an event to be dispatched which then
   triggered an outside function that altered the CSS property?
   Could this cause infinite loops?
   
 * What if:
   1. CSS property A on element A triggers its `styleCallback(...)` which
   2. alters CSS property B on element B that triggers its `styleCallback(...)` which 
   3. alters CSS property A on element A again that triggers its `styleCallback(...)` which
   4. created an infinite loop that spans the `styleCallback(...)` of several elements?

 * What if the `styleCallback(...)` triggers a side-effect that changes the CSS properties
   that is the premise of another `styleCallback(...)`? Could this cause an infinite loop?
   Should the other `styleCallback(...)` be triggered again during the same cycle/animation 
   frame as consequence of this, when this repeated cascading adjustments constitutes an finite, 
   closed loop?
   
 * What if the `styleCallback(...)` creates or adds several elements *inside or under itself* 
   that que their own `styleCallback(...)` as part of their setup/connection. Do we have to wait 
   until the next animation frame for this to be created, thus creating a flash of unstyled content?

All these problems above has to do with execution order and problems of recursion and imperative loops.
And these problems are not only practical, they are also conceptual. 

Already in the platform, we can have cross domain loops between HTML and JS. 
A JS function can alter the DOM, which in turn can trigger a `MutationObserver` or an 
`attributeChangedCallback(...)` or a `slotchange` event listener, which in turn can alter the same DOM
elements so as to cause an infinite loop. This is a know pitfall to web developers.

However, now, the `styleCallback(...)` suddenly tosses CSS into this mix. Now, the `styleCallback(...)`
can trigger JS, that alter the DOM, that alters the CSSOM and/or a `MutationObserver` , that triggers 
`styleCallback(...)`. And the `MutationObserver` that was triggered at the same time that the CSSOM triggered
a `styleCallback(...)`, that `MutationObserver` altered a CSS property on another element that trigger 
another `styleCallback(...)`. Wow, hold your horses!! A dynamic DOM+JS is one thing, but a dynamic CSSOM
that essentially throws CSS into this dynamic mix with HTML and JS as well, now that is a whole new 
bowl of sauced spaghetti.

## Naivité 2: The cost of `getComputedStyles(..)`

Another source of `styleCallback(...)` problems has to do with the cost of `getComputedStyles(..)`.
Computing the CSSOM is a real performance killer. That is why the browser only does so once per frame,
right before layout and paint. The cost of CSSOM calculation is not two digits in milliseconds, 
its two digits in percentage points of the available time per frame. 

Implementing `styleCallback(...)`, we plan to call `getComputedStyles(..)` several times per frame, 
one for each element that implements a `styleCallback(...)`. Potentially hundreds of elements! Wow... 
That sounds... HORRIBLE!!

But. There are some aspects of CSSOM calculation that ought to be considered too.
The browser already *does* **one** CSSOM calculation each frame anyway. 
Is there a way to:
 1. push this CSSOM calculation ahead in time so that the `styleCallback(...)` can (re)use it?
 2. reuse this single CSSOM calculation so that several `styleCallback(...)`s can (re)use the same
    data?

The short answers are: "yes, quite extensively" and "yes, quite extensively". 
These answers build on an assumption about *how* the browser caches its CSSOM calculation so it can
reuse these answers when `getComputedStyles(..)` asks for them and when the browser needs to paint 
the window.

The assumption is as follows(todo this needs verifictation). 

First. When the browser calculates the CSSOM, it marks all the elements in the DOM with a "clean" 
flag. As long as this "clean" flag is present on a DOM element, the browser can reuse the previously
calculated, cached CSSOM value for it. When no changes occur to the DOM that could affect the CSSOM,
the browser will not calculate CSSOM, but only reuse cached CSSOM.

Second. When the browser mutates the DOM, it alters the flag on the element and all the element whose
CSSOM value might affected by this change from "clean" to "dirty". The rules of which DOM changes 
causes which DOM element to change from "clean" to "dirty" is not necessarily straight forward, but a 
coarse overview can be given:

1. If the user alters the content of a `<style>` element, or adds or remove a `<link rel="style">` or
   directly alters the `document.styles...` or `ownerDocument.styles...`, then that document root and
   thus its entire content as "dirty".
   
2. If the user alters the `style` attribute or any other attribute on an element, that causes that 
   element and all other contained elements both in the lightDOM and shadowDOM of it to be marked "dirty".
   CSS selectors for all contained elements. Attributes and CSS classes can trigger CSS rules to be 
   activated within and CSS variables can be added via the style attribute.

3. If an element is added, removed or moved in the DOM, this will cause BOTH:
   1. the element that is moved,
   2. the sibling elements *from* where the element is removed, and
   3. the sibling elements *to* where the element is added 
   
   to all be marked "dirty".
   
   The reason the siblings are affected, but not the parent is that the `:nth-child()` and 
   `:nth-last-child()` on the parent element can affect the siblings style, but no CSS selector can
   alter the CSS properties on a parent based on its children.

This means that:

1. when a JS function early in the frame triggers the browser to calculate CSSOM via 
   `getComputedStyles(..)`, then if no DOM alterations are made to flip flags on the DOM element
   from "dirty" to "clean", then when the browser later needs to calculate the CSSOM values, it can
   reuse the result from the `getComputedStyles(..)`. Thus, yes, the CSSOM calculation can be pushed
   ahead in time so that the `styleCallback(..)` can reuse the single CSSOM calculation quite 
   extensively.
   
2. If the `styleCallback(..)` *do not* alter the DOM in such a way as to flip as few "clean" flag to 
   "dirty" flags as possible, then several `getComputedStyles(..)` can use the result from the same 
   CSSOM calculation. This means that by:
   1. controlling the order in which the `styleCallback(..)`s are triggered to comply with the 
      structure and intent of the CSSOM, ie. Tree-order or top-down, and
   2. limiting the scope of the reactions and DOM mutations that the `styleCallback(...)` can/should 
      be allowed to do so as to not trigger any more "clean" to "dirty" flag switches.

## Non-naive requirement #1: shadow state only

Both a) infinite loops, b) the rise of complexity due to branching CSSOM reactions, and 
c) to minimize the number of elements flipping from "clean" to "dirty" for CSSOM calculations,
can all be addressed with the same requirement:

 * functionality in the `styleCallback(..)` should *only* alter the internal state of the web component
   that *cannot* be observed from the lightDOM. 
   This essentially means that the `styleCallback(..)` *can*:
   1. change the element's entire shadowDOM, 
      except to alter any `:host()` rule that alters an `observedStyle` on the host element.
   2. change other internal state properties that cannot be observed from the lightDOM and above.
   
   This also means that the `styleCallback(..)` *cannot*:
   1. trigger any events that propagate on the host element or above in the lightDOM,
   2. alter, add or remove any HTML attributes on the host element because that might be observed 
      in the lightDOM,
   3. alter any global state such for example an apps single state, the `localStorage` or external
      network resources, nor
   4. call any async functions that would be delayed beyond the execution of the current 
      `styleCallback(..)`.

## Non-naive requirement #2: `styleCallback(..)` runs top-down

Both a) the first requirement of only altering shadow state, b) the need to flip as few "clean" to 
"dirty" flags as possible and c) to avoid having one `styleCallback(..)` alter the CSSOM values
of another `styleCallback(..)` function already triggered in the same frame, combine to make the 
second requirement:

 * the `styleCallback(..)` functions should be triggered top-down.
 
Whether the CSSOM is processed left-to-right (ltr) or right-to-left (rtl) has no principal and little practical 
consequence. CSS selectors work both ltr (`:nth-child()`) and rtl (`:nth-last-child()`).
However, processing the batch is well suited by choosing one direction, and tree order 
(top-down and left-to-right) is both simpler conceptually and practically.

## Non-naive requirement #3: check requirement #1 and #2

The `styleCallback(..)` should try to enforce and check the above requirements. 
There are many strategies that can verify that the above requirements are verified.
The simplest, good enough means to ensure that no `styleCallback(..)` alters the CSSOM in a way 
that will have potential damaging effects on other `styleCallback(..)` in the same cycle is
to directly check that the computed styles remain the same for all the executed `styleCallback(..)`
either: 
 * after all the `styleCallback(..)`s did run or
 * for each `styleCallback(..)`.
 
Checking for illegal CSSOM changes after *all* the batched `styleCallback(..)`s is more efficient than
checking for illegal CSSOM changes after *each* `styleCallback(..)` process. On the other hand.
Checking for illegal CSSOM changes after *each* `styleCallback(..)` process has the benefit of identifying
exactly which element and `styleCallback(..)` method caused the problem, thus giving the developer
a much better and more fine grained Error message. 

Furthermore, checking for illegal CSSOM changes is not likely be a run-time need. If the developer can
verify that the app triggers no illegal DOM mutations during development, it is likely that he can 
skip this test at run-time and rest assured that he followed the requirements. Checking for illegal
DOM mutations should therefore be an optional feature to be turned on or off, depending on the maturity
of the web components in the app.



The NaiveStyleCallbackMixin batches the `styleCallback(...)` for several elements, but 
does it structures their order only first in, first out. This can cause problems.

CSSOM 
Note: Due to restrictions in the [CSSStyleDeclaration](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration)
object, you can only observe:
1. established CSS properties such as `color` and `border` and
2. CSS variables such as `--custom-css-prop`.

In the browser, there is no native callback for changes to the CSSOM. This means that the 
`styleCallback(...)` itself must poll the CSSOM to check if the properties have changed.
This "polling the CSSOM to trigger a JS callback" is problematic, as will be described in the next 
chapter. However, in this first, naive implementation of `styleCallback(...)` we simply assume
that this polling and subsequent JS callback will not cause any conflicts, and just schedule a the
poll using `requestAnimationFrame(...)`.

## Demo: `<blue-blue>` with custom `color` CSS properties

In this example we want to add a custom calculation of `<blue-blue>`s color 
using the `color` CSS property and `styleCallback(...)`.

```html
<script>
  class BlueBlue extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
       <style>
         div#core {                             
           background-color: var(--light-color, lightblue);              
           color: var(--dark-color, darkblue);          
         }
       </style>
       <div id="core">
         <slot></slot>
       </div>`;                                                      
      this._rafID;
      this._previousStyleValues = {};
      for (let style of this.constructor.observedStyles())
        this._previousStyleValues[style] = undefined;
    }
    
    pollStyle(){
      const newStyles = getComputedStyle(this);
      for (let prop of Object.getKeys(this._oldStyleValues)) {
        let newValue = newStyles.getPropertyValue(prop);
        let oldValue = this._oldStyleValues[prop];
        if (newValue !== oldValue){
          this.styleCallback(prop, oldValue, newValue);
          this._oldStyleValues[prop] = newValue;          
        }
      }
    }
    
    connectedCallback(){
      this._rafID = requestAnimationFrame(this.pollStyle.bind(this));
    }
    
    disconnectedCallback(){
      cancelAnimationFrame(this._rafID);
    }
    
    static get observedStyles(){
      return ["color"];
    }
    
    styleCallback(name, oldValue, newValue){
      if (name === "color"){
        const div = this.shadowRoot.children[1];
        if (newValue) {
          div.style.setProperty("--light-color", "light" + newValue);
          div.style.setProperty("--dark-color", "dark" + newValue);
        } else {
          div.style.setProperty("--light-color", undefined);
          div.style.setProperty("--dark-color", undefined);
        }
      }
    }
  }

  customElements.define("blue-blue", BlueBlue);
</script>

<style>
#one {
  color: green;
}
</style>

<blue-blue id="one">green</blue-blue>            <!--[3]-->
<blue-blue id="two">still blue</blue-blue>

<script>
setTimeout(function(){
  const two = document.querySelector("blue-blue#two");
  two.style.color = "red";
  two.innerText = "blue becomes red";
}, 3000);
</script>
```
## 

The `styleCallback(...)` is a naive whenever changes of the elements CSSOM, ie. it observes whenever  ()is called once every `requestAnimationFrame` whenever the value of a given CSS property changes 
on the host element.
The `styleCallback(...)` is implemented using the StaticSetting pattern, and 
the web component specifies which CSS properties it wants to observe using a
```
static get observedStyleProperties(){
  return ["font-size", "--custom-color-prop"];
}
```

The `styleCallback(...)` can only observe already established CSS properties or CSS variables.


## Drawbacks of the `styleCallback(...)`

There are two major drawbacks of the `styleCallback(...)`:
 
1. In order for the `styleCallback(...)` to know if the up-to-date CSS property of a DOM element
   has changed, it needs to get the up-to-date CSS property of a DOM element. This means calling
   `getComputedStyle(...)`. As described elsewhere in this book, this takes a lot of time and needs 
   to be managed with care.
   
2. Conceptually, in modern browsers, both HTML, events and JS are treated as dynamic. 
   Callbacks, async timers, and reactive functions are spread around JS like candy;
   events "is nothing" without event listeners; and
   the DOM (HTML) can be observed with MutationObserver and lifecycle callbacks.
   We consider them all as 
   
   But changes in CSS or the CSSOM can neither be directly observed, listened to, trigger 
   callbacks, nor dispatch change events. 
   You can imperatively query CSSOM values using `getComputedStyle(...)`, but 
   you cannot react efficiently to such changes via callbacks, events, nor observers.
   Conceptually, the browser treats CSS as static, still; 
   querying the CSSOM using `getComputedStyle(...)` is highly problematic and frowned upon.
   
   `styleCallback(...)` turns these established concepts on their head: 
   It creates a direct, reactive lifecycle callback for CSSOM changes. 
   It treats changes of CSS property values as they get assigned in the CSSOM as conceptually dynamic.
   CSS is no longer *always* processed *after* JS. No, now the order is
   JS -> CSS -> `styleCallback(...)`(JS).

## Benefits of the `styleCallback(...)`

There are *three* big benefits with the `styleCallback()`.

1. In the lightDOM, the developer can specify *complex* controllers of style as pure CSS properties.
   First of all, this means no HTML. Style is CSS, structure is HTML, no need to mix them.
   Second, as these controllers are CSS properties, they can turned of and on from within
   CSS itself. CSS properties are assignable from CSS rules, whereas CSS classes for example
   has to be assigned from HTML or JS.

2. Inside the webcomponent, a separate lifecycle callback called `styleCallback()` reacts to style. 
   This means no `attributeChangedCallback(...)` chaos, no 
   `if(attributename === "this"){...} else if(attributename === "that"){...}` overload.
   No fighting in the crowded back-seat of `attributeChangedCallback(...)` with the other HTML 
   attribute sibling use-cases.
   The JS code of the web component gets sorted into a `styleCallback(...)` for CSS changes
   and an `attributeChangedCallback(...)` for HTML/DOM changes, no need to mix them.

3. In order to identify *if* a CSS property has changed, the callback needs to get its up-to-date value.
   This is a big, big drawback as described above. But, once the cost of `getComputedStyle(...)` has 
   already been payed, having the up-to-date value establish a huge upside: 
   `styleCallback(...)` has access to the updated values of the host element(!).
   
   Having the value of a CSS(OM) property means that the reactive functionality can *use* that value.
   Given a single color, `styleCallback(...)` can calculate a full color palette or fifty shades of it.
   Given certain coordinates or dimensions, `styleCallback(...)` can itself implement an appropriate 
   layout that takes into consideration if the element is big or small and/or positioned bottom right or 
   middle left.
   

What if we wanted to do the 'natural' thing: coordinate styles based on CSS property values?


There are some restrictions on the operation performed in the `attributeChangedCallback(...)`. 
These restrictions regard two different problems.

1. The `attributeChangedCallback(...)` method should *only* rely on data from the DOM and JS domain, 
   *not* data from the CSSOM. 
   At the time `attributeChangedCallback(...)` is called, the CSSOM is in 
   an unprocessed state, and reading up-to-date values from the CSSOM via `getComputedStyle(..)`
   will cause the browser to run heavy, time-consuming processes in the background.
   
2. The `attributeChangedCallback(...)` method should *not cause* changes that can be observed from the lightDOM surrounding the `host` elements.
   Changes in the web component that can be observed from the lightDOM should in this scenario be 
   considered a side-effect. The `attributeChangedCallback(...)` method should therefore *not*:
   1. dispatch any events,
   2. add, remove or alter any other attributes on the host node, and
   3. alter the app state (as that in turn might trigger changes in the lightDOM).

## How `getComputedStyle(el)` gets tricky?

In order to get the currently associated style property values of an element, 
we need to call `getComputedStyle(..)`. However, `getComputedStyle(..)` is a bit tricky. 
To avoid calculating all the CSS rules and all the CSS properties of all the elements in the DOM 
every time the DOM changes (as that would take a lot of time(!) and make the
browser very slow), the browser (strives to) only calculate the CSSOM once per frame. 
This avoids the browser slowing down due to heavy CSSOM calculations.

The drawback of only calculating the CSSOM once per frame, 
is that it makes it problematic to *use* the values of CSS properties *during* the frame.
Put pointedly, you cannot call `getComputedStyle(..)` without first considering very carefully 
if this will cause your app to slow down.
And, when you call `getComputedStyle(..)` inside an `attributeChangedCallback(...)` in a web component
which can be reused in many different apps, these CSSOM calculation concerns become overwhelming.
In a web component, the rule of thumb is that you do not want to do any operation such as 
`getComputedStyle(..)` that could potentially completely destroy the performance of an entire app.
And this is a bit unfortunate, as the task of coordinating styles sometimes could really benefit from 
knowing a certain style property value.

## How to handle `getComputedStyle(...)` in a web component?

Thankfully, there is no rule of thumb you can't give the finger. 

1. Let's say we *do* need to call `getComputedStyle(..)` in an `attributeChangedCallback(...)`.

2. In such cases, we would like to split the functionality that calls and then uses the result 
   of `getComputedStyle(..)` as a separate task. We can call this the StyleDependingTask.
   (By task, we here mean a function/closure with bound arguments that we can call anonymously later).

3. The StyleDependingTask we delay with `requestAnimationFrame(...)`.
   `requestAnimationFrame(...)` is run after all the 'regular' JS tasks such as event listeners, 
   scripts being loaded, MutationObservers have been completed. This reduced the possibility of
   StyleDependingTask working on a CSSOM that later gets altered again.
   
4. The StyleDependingTask should have a clearly restricted focus:
   it should only alter the shadowDOM of an element, or equivallent, strictly internal state of the 
   web component.
   The StyleDependingTask should *not* trigger any observable changes in the lightDOM.
   Examples of such changes would be events dispatched into the lightDOM, attributes changed on the 
   host element and changes to the application state.
   
   The reason for these restrictions are quite complex. But, in short, if the delayed functionality 
   trigger changes observable in the lightDOM, then these changes might indeed be observed and trigger
   synchronous changes that in turn causes the DOM and/or CSS to change in such a way that would alter 
   the premise of the StyleDependingTask rendering it out-of-date before it has even started or, 
   even worse, altering the HTML attribute to trigger another `attributeChangedCallback(...)` that 
   in turn trigger another StyleDependingTask that causes infinite loops within or across 
   the current frame.
   
5. We need to observe the value of the style property we want to observe.

6. And if only a single web component scheduled StyleDependingTasks per frame, the restrictions above suffices.

## Demo: `<blue-blue>` with smart color management

In this demo, we want to give our element a single `--color` input and 
then let it calculate the light and dark color from that. We do so quite naively in order to
focus on the architecture.

```html
<script>
  class BlueBlue extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
           <style>
        :host([day]) div, div {                             /*[1]*/
           background-color: var(--light-color, lightblue);              
           color: var(--dark-color, darkblue);          
         }
        :host([night]) div {                                /*[2]*/
           background-color: var(--dark-color, darkblue);                
           color: var(--light-color, lightblue);                  
        }
       </style>
       <div>
         <slot></slot>
       </div>`;                                                      
    }
  }

  customElements.define("blue-blue", BlueBlue);
</script>

<style>
  .green {                                             
    --light-color: lightgreen;
    --dark-color: darkgreen;
  }
  .greenAndBlue {                                         
    --light-color: lightgreen;
  }
</style>

<blue-blue class="green" day>green day</blue-blue>            <!--[3]-->
<blue-blue class="green" night>green night</blue-blue>
<blue-blue night>blue night</blue-blue>
<blue-blue>blue day</blue-blue>
<blue-blue class="greenAndBlue">darkblue text on lightgreen background</blue-blue>
```

## styleCallback
   
6. However, if either:
   1. several StyleDependingTasks from different web components are queued in a frame or
   2. a StyleDependingTask itself causes another StyleDependingTask to be queued, then 
   3. more safeguards needs to be put in place.
   
   In such instances we need to use the RequestCssomFrame pattern.
   The RequestCssomFrame pattern:
   1. Ques and sorts tasks in TreeOrder associated with a particular DOM element (and a set of particular style properties),
   2. Execute the tasks that are added *during* the execution of another RequestCssomFrame task,
      if the task is associated with an element that is contained by the element associated with the 
      currently executing task.
   3. Ensures that no RequestCssomFrame tasks conflict with each other in a way that would alter
      the CSSOM data given to another RequestCssomFrame tasks within the same cycle.

   In short, by keeping the execution of CSSOM dependent tasks run TreeOrder, top-down and 
   ensuring that no CSSOM dependent tasks conflict with each other to alter the input parameters of 
   each other, an as-efficiently-as-possible algorithm for working with updated current style data can 
   be achieved.

## References

 * 


6. Problem: Observe CSSOM changes and getComputedStyle
7. Problems that require TreeOrder iteration on mutable DOM
8. Pattern: StyleCallback using TreeOrder iteration on mutable DOM and observing CSSOM changes



