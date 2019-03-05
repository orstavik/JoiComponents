# Pattern: StyleCoordinatingAttribute

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
<blue-blue class="green" day>green night</blue-blue>
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

## Coordinating shadowDOM

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
    
    observedAttribute(name, oldValue, newValue){
      const count = parseInt(newValue);
      let top;
      let first;
      for(let i = 0; i < count; i++){
        let span = document.createElement("span");
        if (i%2) span.classList.add("dark");
        if (!first)
          first = span;
        else {
          span.appendChild(top);          
        }
        top = span;
      }
      if (top){
        first.appendChild(this.shadowRoot.querySelector("#core"));
        this.shadowRoot.appendChild(top);
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

<blue-blue class="green" frames="5">5 green borders</blue-blue>            <!--[3]-->
<blue-blue frames="15">15 default blue borders</blue-blue>
```

## Benefits and limitations of altering shadowDOM

Strictly speaking, a web component does not have to expose any CSS variables when it uses an HTML 
attribute as trigger to alter its shadowDOM. The StyleCoordinatingAttribute pattern can and do 
therefore often occur without a group of associated CSS variables. However, as they mature in development,
web components that rely on HTML attributes to alter their appearance via altering their shadowDOM 
can often be converted into web components that alter their appearance via (de)activating CSS rules 
instead. The StyleCoordinatingAttribute pattern can therefore be viewed as a development method as 
much as an architecture: 
1. First, develop the web component using HTML attributes and `attributeChangedCallback(...)` to alter the shadowDOM.
   This is both conceptually simple, fast to implement and fairly safe.
2. Second, when the interface, form and function of the web component has matured and changes less often, 
   then update the shadowDOM to alter its appearance via (de)activating CSS rules instead.
   This technique that is trickier to implement, but faster and more efficient in production.

Also, as we will come back to later, there are some restrictions on the operation performed in
the `attributeChangedCallback(...)`. The `attributeChangedCallback(...)` method should:
1. *only* rely on data from the DOM and JS domain, 
   *not* data from the CSSOM. At the time `attributeChangedCallback(...)` is called, the CSSOM is in 
   an unprocessed state, and reading up-to-date values from the CSSOM via `getComputedStyle(..)`
   will cause the browser to run heavy, time-consuming processes in the background.
2. *not cause* changes that can be observed from the lightDOM surrounding the `host` elements.
   Changes in the web component that can be observed from the lightDOM should in this scenario be 
   considered a side-effect. The `attributeChangedCallback(...)` method should therefore *not*:
   1. dispatch any events,
   2. add, remove or alter any other attributes on the host node, and
   3. alter the app state (as that in turn might trigger changes in the lightDOM).

## drafts below
   
## Coordinating style based on CSS values

There is one resource that is *not* yet available when the attributeChangedCallback runs: CSSOM. 
This is a bit unfortunate, as coordinating styles often could benefit from knowing the style value.
So, how to tackle this issue.

If we want to coordinate style based on CSS values, we do not want the process to run immediately 
(synchronously) as the `attributeChangedCallback(...)` is doing. Instead, we want the process to be 
delayed until "right after the CSSOM has finished processing". This is a bit tricky as 

To illustrate how this can be, 
For example, 
At the time when attributeChangedCallback runs, the CSSOM is
*not* updated, and if you need values from the CSSOM, then you need to trigger and wait for CSS 
processing to conclude before you continue. This takes time.

At the time of the 
What if you wanted to calculate something based on the values of your CSS variables?
This you don't want to do at arbitrary times. Thus, you want to delay such calls to the raf.
But, this leads to problems with callbacks coming in arbitrary tree order. And that is bad. 
So, that is when we need a styleCallback

## Why HTML attributes are better than CSS classes

In many ways, using HTML attributes or CSS classes to control the use of inner CSS attributes can also be used to coordinate the use of CSS variables. But there are a few subtle
differences that apply and that makes CSS classes preferable for this task.

First. HTML attributes can more readily be observed to trigger lightDOM callbacks that can alter the DOM.
When you only want to control the inner style of an element, such side-effects would likely be confusing.

Second. C

## Benefits and drawbacks of the CssClassCoordinator


Later, we will look at when the Css

Using only CSS variables, the user of the web component has to coordinate 

In principle, CSS variables gives us *full lightDOM access to all the CSS 
properties of all the elements in a webcomponent's shadowDOM*. But. There is still a problem.




This pattern uses CSS classes on the host element to coordinate the use of a set of CSS variables
exposed on the web component. The CssClassCoordinator pattern is still pure CSS and ShadowDom, thus
remaining as efficient as the browsers native processing of CSS is.
