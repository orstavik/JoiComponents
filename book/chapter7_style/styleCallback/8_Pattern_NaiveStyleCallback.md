# Pattern: Naive `styleCallback()`

5. NaiveStyleCallback
6. Problem: Observe CSSOM changes and getComputedStyle
7. Problems that require TreeOrder iteration on mutable DOM
8. Pattern: StyleCallback using TreeOrder iteration on mutable DOM and observing CSSOM changes




## Naive styleCallback()

A naive `styleCallback(cssProperty, newValue, oldValue)` is a lifecycle callback on the web component
that is called once every `requestAnimationFrame` whenever the value of a given CSS property changes 
on the host element.
The `styleCallback(...)` is implemented using the StaticSetting pattern, and 
the web component specifies which CSS properties it wants to observe using a
```
static get observedAttributes(){
  return ["font-size", "--custom-color-prop"];
}
```

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
