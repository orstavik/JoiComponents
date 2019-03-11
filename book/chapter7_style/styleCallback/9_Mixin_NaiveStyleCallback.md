# Pattern: NaiveStyleCallback

The NaiveStyleCallback pattern adds a lifecycle callback to the web component:
`styleCallback(...)`.
The NaiveStyleCallback first observes when a `.style` property on the host element has changed
and then trigger `styleCallback(cssPropertyName, newValue, oldValue)` with the property name, 
new value and old value as arguments, very much like the `attributeChangedCallback(...)`.

## Why `styleCallback(...)`?

The role of `styleCallback(...)` is to:
1. observe the CSS properties (and their changes) on the host element in the lightDOM and then
2. trigger a JS function that can react to these changes.

Again, this clearly echoes how the `attributeChangedCallback(...)` observes and reacts to HTML
attribute changes. So, why do we need to do the same with CSS properties? Why not just specify property
as an HTML attribute instead?

First, from the viewpoint of the individual web component, there is *no* reason why we cannot use 
`attributeChangedCallback(...)` instead. If all you have to consider is the current web component, 
then the answer is likely to be *not* to use observe CSS properties and with a `styleCallback(...)`, 
but instead *cast* the style property in question as an HTML attribute.

However, the individual web component does not *decide* where an app should specify its style properties.
Most often, properties such as `color` and `border` are set in CSS, and there is little the web 
component can do to change that. If the web component needs to know its `color`, `border` or other 
properties, its not really an option for it to say that "you should have specified that as an HTML 
attribute instead".

Second, as described before, both HTML attributes and CSS classes has to be assigned an element either
statically from HTML template or dynamically from JS. CSS properties on the other hand can be assigned
to an element *from CSS rules*, both statically and dynamically. All the reasons to use CSS selectors
and CSS properties instead of HTML attributes to prescribe style to DOM elements in essence apply
to coordinating the inner style of web components. There is essentially *no* conceptual difference 
between applying an established CSS properties such as the generic `color` or the element specific 
`border-collapse` and a custom property your web component needs to observe and react to in order to
implement and calculate its inner style and structure.

Third, currently, HTML attributes are used to control most aspects of a web components inner state.
If you need to be able to control the web components state and behavior from both HTML and JS, 
then HTML attributes is more or less your only means (if we here disregard the more complex option of
slotting specialized elements). On the web component you would need to set one set of HTML attributes
to control its content structure, another set of HTML attributes to control its imperative behavior (JS)
and a third set of HTML attributes to coordinate its style. Splitting out control of an element's style
as custom CSS properties not only enables CSS rules and developers to control it, but also in a sense
relieves the HTML template and developer of this task.

## A naive implementation of `styleCallback(...)` 

Basically, the `styleCallback(...)` needs to observe some styles on the host element.
To get the current CSS properties of an element we have to use the `getComputedStyle(el)` method.
Then, we need to check if the relevant CSS property has changed on the element, and 
if so we need to trigger the `styleCallback(cssPropertyName, newValue, oldValue)` 
with the property name, new value and old value as arguments.

Each web component does not need to observe *all* its CSS properties.
Therefore, the NaiveStyleCallback pattern uses the StaticSetting pattern to specify 
which CSS properties it should observe. We call this method `observedStyles()`:
```
static get observedStyles(){
  return ["font-size", "--custom-color-prop"];
}
```
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



