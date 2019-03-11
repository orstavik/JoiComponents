# Pattern: StyleCoordinatingAttribute

1. ClassyCssCoordination
2. CssCoordinatingAttribute
3. ShadowCoordinatingAttribute
4. Method: CallbackBecomesClass
5. NaiveStyleCallback
6. Problem: Observe CSSOM changes and getComputedStyle
7. Problems that require TreeOrder iteration on mutable DOM
8. Pattern: StyleCallback using TreeOrder iteration on mutable DOM and observing CSSOM changes

The StyleCoordinatingAttribute pattern exposes a set of codependent **HTML attributes** and 
**CSS variables** on a web component.

The developer of the web component provides it with a set of HTML attribute names and CSS variable 
names that gives the user of the web component an interface with which to both control and set
style properties on the component.

The role of the HTML attribute is to enable:
1. the developer of the web component to *internally* control and coordinate 
   how CSS variables are used inside the shadowDOM (and even alter the shadowDOM itself), and
2. the user for the web component to *externally* select simpler style settings that
   rely on the coordination of CSS properties to be managed internally.
   
The role of the CSS variables is to enable the developers and users to pass style values
*into* the shadowDOM *from* the lightDOM in an way that both is:
1. **efficient** since it does not require the processing of JS functions, but completely relies
   on the browsers native processing of the CSSOM, and
2. **ergonomic** for CSS developers in that it enables them to set (at least) some low level 
   values of a web component style values from CSS. 

## Coordinating CSS rules only

The simplest and most efficient way to use HTML attributes to control style is to have
**CSS rules inside the shadowDOM be activated/deactivated by an HTML attribute on the `host` element**.

The benefit of using the StyleCoordinatingAttribute pattern in this way is that it can be
processed natively when the browsers makes the CSSOM.
When you need high performance in your app, this form of internal coordination of CSS in web components
is recommended.

## Demo: `<blue-blue>` with `day`/`night` attributes

To demonstrate how the StyleCoordinatingAttribute pattern can be used to coordinate CSS rules only,
we will add to the `<blue-blue>` element the ability to both:
1. control the colors via CSS variables and 
2. set a day/night mode via an HTML attribute. 

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
1. The first CSS rule sets the element in `day` mode. 
   The `day` mode is also the default mode of the web component when no `day`/`night` mode is set.
   The background color is `--light-color` (`lightblue` by default).
   The text color is `--dark-color` (`darkblue` by default).
2. The second CSS rule sets the element in `night` mode, ie. dark background and light text. 
   By setting the `day`/`night` attribute on the host element, the web component user can control the
   inner coordination of several CSS properties (here: the `--light-color` and `--dark-color`).
3. Five different elements are set up orchestrating the `day`/`night` StyleCoordinatingAttribute 
   and the two `--light-color` and `--dark-color` CSS variables to achieve different effects. 

### HTML attributes vs. CSS classes

It is true. In the example above you could have just as easily have controlled the CSS variables using
CSS classes instead of HTML attributes. Implementing the example above using CSS classes looks like 
this:

```html
<script>
  class BlueBlue extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
           <style>
        :host(.day) div, div {                             /*[1]*/
           background-color: var(--light-color, lightblue);              
           color: var(--dark-color, darkblue);          
         }
        :host(.night) div {                                /*[2]*/
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

<blue-blue class="green day">green day</blue-blue>            <!--[3]-->
<blue-blue class="green night">green night</blue-blue>
<blue-blue class="night">blue night</blue-blue>
<blue-blue>blue day</blue-blue>
<blue-blue class="greenAndBlue">darkblue text on lightgreen background</blue-blue>
```

In many ways, HTML attributes and CSS classes are interchangeable in this example.
Both CSS classes and HTML attributes can be applied to an element from HTML and JS, 
but not CSS. Both CSS classes and HTML attributes can be queried equally: 
`:host([attributeName])` and `:host(.cssClassName)`.
And, since the pattern is used to control style, using CSS classes instead of HTML attributes definitively
has an appeal.

But. I still chose to HTML attributes over CSS classes.
The reason is that HTML attributes provide one ability that CSS classes do not: 
When an HTML attribute is set on the host element of a web component, that event *can* be set up to 
trigger an `attributeChangedCallback(...)` from within the web component itself.
Changing a CSS class or CSS property value of an element has no such direct ability to trigger a JS 
callback in the web component. And this ability we need when this same StyleCoordinatingAttribute 
pattern is used in a bit more complex way to control the appearance of a web component: coordinating
shadowDOM.

## Coordinating shadowDOM structure

Sometimes, the best way to create a visual effect is to make or later DOM elements. 
Seen from outside a web component, modifying such properties of a web component can seem as
appearance oriented other changing other that more easily/better can be internally controlled by
activating/deactivating CSS rules.

In order to alter the DOM elements inside the shadowDOM of a web component, we need to 
run a JS function, and when an attribute is set on the host element, we can observe such changes
by specifying the names of the attributes we wish to observe in `static getObservedAttributes` and 
reacting to these changes in the `attributeChangedCallback(...)` methods.

## Demo: `<blue-blue>` with infinite borders

In this demo we will add a stylistic feature that is hard to implement without altering the DOM:
allowing the user to dynamically specify how many `frames` that should encapsulate the `<blue-blue>` 
text.

Note: the implementation below is not efficient as it will (inefficiently) create and destroy 
HTML elements in response to dynamic changes. In production, it should probably be implemented using 
libraries such as HyperHTML or lit-html. However, this implementation is conceptually very simple
and thus better suited to understand the concept of using the StyleCoordinatingAttribute pattern.

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
         span {                             
           border: 2px solid var(--light-color, lightblue);              
         }
         span.dark {                             
           border: 2px solid var(--dark-color, darkblue);              
         }
       </style>
       <div id="core">
         <slot></slot>
       </div>`;                                                      
    }
    
    static get observedAttributes(){
      return ["frames"];
    }
    
    attributeChangedCallback(name, oldValue, newValue){
      if (name === "frames"){
        const count = parseInt(newValue);
        let top;
        let first;
        for(let i = 0; i < count; i++){
          let span = document.createElement("span");
          if (i%2) span.classList.add("dark");
          if (!first)
            first = span;
          else 
            span.appendChild(top);          
          top = span;
        }
        if (top){
          first.appendChild(this.shadowRoot.querySelector("#core"));
          this.shadowRoot.appendChild(top);
        } else {
          this.shadowRoot.appendChild(this.shadowRoot.querySelector("#core"));
        }
      }
    }
  }

  customElements.define("blue-blue", BlueBlue);
</script>

<style>
  .green {                                           
    --light-color: lightgreen;
    --dark-color: darkgreen;
  }
</style>

<blue-blue id="one" class="green" frames="5">5 green borders</blue-blue>            <!--[3]-->
<blue-blue id="two" frames="15">15 default blue borders</blue-blue>

<script>
setTimeout(function(){
  document.querySelector("blue-blue#one").setAttribute("frames", 2);
  document.querySelector("blue-blue#two").setAttribute("frames", 0);
}, 3000);
</script>
```

## Benefits and limitations of altering shadowDOM

Strictly speaking, a web component does not have to expose any CSS variables when it uses an HTML 
attribute as trigger to alter its shadowDOM. The StyleCoordinatingAttribute pattern can and do 
therefore often occur without a group of associated CSS variables. 

However, as they mature in development, web components that rely on HTML attributes to alter 
their appearance via altering their shadowDOM can often be converted into web components that 
alter their appearance via (de)activating CSS rules instead. 
The StyleCoordinatingAttribute pattern can therefore be viewed as a development method as 
much as an architecture:
 
1. First, develop the web component using HTML attributes and `attributeChangedCallback(...)` to alter the shadowDOM.
   This is both conceptually simple, fast to implement and fairly safe.

2. Second, when the interface, form and function of the web component has matured and changes less often, 
   then update the shadowDOM to alter its appearance via (de)activating CSS rules instead.
   This technique that is trickier to implement, but faster and more efficient in production.

## Naive styleCallback()

On the one hand, using HTML attributes to regulate CSS variables and structural style is 'natural'.
It is direct, natively supported by the browsers, and requires no added functionality.
Thus, if it is enough to use one of the previous patterns, use them. Stay native. 
HTML attributes + CSS variables = LOVE!

But. On the other hand. Using HTML attributes to regulate CSS styles does make one a bit quesy.
Do I really need HTML attributes? Why can't I do everything in CSS? Using CSS classes to regulate
CSS variables was a good option, but very limited. 
Is there really no other pure CSS solution to fulfill more complex coordination of CSS properties? 

Also, there is a third hand. What if we want to coordinate the CSS
styles based on the current *values* of one or more CSS properties? What if I want the text color to 
be hard and cold black when the font-size is small, but soothing grey when the font-size is big?
What if I want to turn the border on or off depending on the specified width of the element?
It would be so quick and easy to accomplish imperatively in JS, but 
I can't for the life of me imagine what black, declarative CSS magic should be used to achieve 
the same effect?
What if... What if I wanted to react to the values of my web components current style?

Well, then you want a `styleCallback()`. In this chapter we investigate the use-cases for a
`styleCallback()` using a naive implemention of it.

## Naive styleCallback() implementation

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
