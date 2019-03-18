# Pattern: StyleCoordinatorAttribute

## When style becomes structure

Some changes of a web component's appearance cannot be implemented in CSS alone;
sometimes, to alter the style of a web component requires mutating its shadowDOM.
This dilemma, when does (HTML) structure become (CSS) style, is not new. It has plagued HTML and CSS
developers for ages already. But, it gets new relevance and new solutions when the
inner style and structure of a web components should be controlled and directed from outside.

There are several situations where outer style becomes inner structure in web components.
First, there are multiple situations where the developer needs to extend the CSS toolbox. 

 * For example, before the arrival of CSS grid, controlling and adjusting layout using CSS was lacking:
   which layout trend without native support will become the next must-have?
   For most, layout begins as a structural concept that gradually morphs into a style concept
   as ones familiarity with CSS expands.
   
 * Another example is using CSS to style multiple DOM nodes that are assigned to the same 
   `<slot>` element: what, there is no `:nth-slotted(nr)` selector?
   As `:slotted` is an immature feature in CSS, operations that normally would have been considered
   stylistic, must be turned into imperative operations and/or structural mutations.
   
 * A third example is dynamic color arithmetic: why can't CSS color values be specified as 
   palettes and graded and transformed using custom color functions?
   Style is often just as much a function as a value. Dynamic CSS class assignments is 
   a good examples of that. Css `calc(..)` another. Making reuseable, custom web components often 
   trigger the need to make reuseable, custom CSS operations.

## Imperative programming as a steppingstone towards declarative programming 

There are two facts about styling web components:
1. Some style alterations can be hard to implement declaratively, solely in CSS, 
   while simple and intuitive to make as imperative mutations of the shadowDOM. 
2. In the initial stages of development, both a) the appearance and b) the style interface 
   of a web component is most often fluid, quickly iterated upon and frequently discarded. 

During the initial development of a web component, it is therefore often the wrong choice to invest 
heavily in pursuing a tricky, time consuming declarative solution in CSS. Doing the "right thing"
to early might lead the developer to invest all his time and effort into the first look-and-feel 
of his web component, and thus prevent him from testing out many different ideas in quick succession
and thus chisel out a good solution. Doing the "right thing" too early can get you needlessly 
attached to "an early, not-so-good idea".

Thus, during initial development, altering the shadowDOM might be a preferred *approach*, while
a declarative CSS solution still remain the preferred *end solution*.

> When good declarative CSS solutions are hard to come by during exploratory, tentative development,
use the StyleCoordinatorPattern pattern to alter the shadowDOM and custom style calculation.
Then, when your web component has matured and you have settled on a look-and-feel that you are confident
in, do the work of morphing your imperative and structural solution into a declarative one (if you can). 

> However, as they mature in development, web components that rely on HTML attributes to alter 
  their appearance via altering their shadowDOM can often be converted into web components that 
  alter their appearance via (de)activating CSS rules instead. 
  The StyleCoordinatingAttribute pattern can therefore be viewed as a development method as 
  much as an architecture:
>  1. First, develop the web component using HTML attributes and `attributeChangedCallback(...)` to alter the shadowDOM.
     This is both conceptually simple, fast to implement and fairly safe.
>  2. Second, when the interface, form and function of the web component has matured and changes less often, 
     then update the shadowDOM to alter its appearance via (de)activating CSS rules instead.
     This technique that is trickier to implement, but faster and more efficient in production.

   
## `attributeChangedCallback(..)`: turning style into structure and calculations

HTML attributes has a clear benefit when we wish to turn style into structure in web components.
Web components can observe HTML attributes on the host element using `static get observedAttributes()`: 
when the observed attribute changes, that will trigger an `attributeChangedCallback(...)`.

This means that a CssCoordinatorAttribute has the potential to:
1. not only control the application of CSS rules, but also 
2. trigger an imperative function steps which in turn can 
3. perform shadowDOM mutations or
4. perform custom CSS calculations.

The **StyleCoordinatorAttribute** is HTML attributes that are used by the web component to perform
shadowDOM mutations and/or custom CSS calculations.
 
## Demo: `<blue-blue>` with multiple borders

In this demo we will alter the appearance in a way that is impossible to implement in pure CSS:
add an infinite series of `frames` around the `<blue-blue>` text.
To achieve this effect, the style feature of frames is added as an HTML attribute that triggers
an `attributeChangedCallback(..)` that in turn mutates the DOM as needed.

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
Note: this example is inefficient because it creates and destroys HTML elements in response to dynamic 
changes. To be more efficient, the shadowDOM should be implemented using HyperHTML or lit-html. 
The example is only intended to explain the StyleCoordinatorAttribute as simply as possible.

## Demo: `<blue-blue>` with custom `color` operations

In this example we want to add custom calculation of `<blue-blue>`s color by turning the two 
`--light-color` and `--dark-color` CSS variables into an HTML attribute.

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
    }
    
    static get observedAttributes(){
      return ["color"];
    }
    
    attributeChangedCallback(name, oldValue, newValue){
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
</style>

<blue-blue id="one" color="green">green</blue-blue>            <!--[3]-->
<blue-blue id="two">still blue</blue-blue>

<script>
setTimeout(function(){
  document.querySelector("blue-blue#one").setAttribute("color", "red");
  document.querySelector("blue-blue#two").removeAttribute("color");
}, 3000);
</script>
```

In the example above, we could have attributed the styles directly as `color` and `background-color` 
style properties to the `<div>` element. But, going way via CSS variable is beneficial 
when more elements wants to apply the same CSS property and when several different Css- or 
StyleCoordinatorAttributes are used in the same element. 

Strictly speaking, a web component does not have to expose any CSS variables when it uses an HTML 
attribute as trigger to alter its shadowDOM. The StyleCoordinatingAttribute pattern can and do 
therefore often occur without a group of associated CSS variables. 

## Drawbacks of StyleCoordinatorAttribute

On the one hand, using HTML attributes to regulate CSS variables and structural style is 'natural'.
It is direct, natively supported by the browsers, and requires no added functionality.
Thus, if it is enough to use one either StyleCoordinatorAttribute, CssCoordinatorAttribute or 
CssCoordinatorClass, use it. Stay native. HTML attributes + CSS variables = LOVE!

But. On the other hand. Using HTML attributes to regulate CSS styles does make one a bit quesy.
Do I really want to define *color* as an HTML attributes?! Is there really no way to do this with CSS??
What if *color* was defined and used elsewhere in the CSS, thus making it impossible for me to
*choose* to make color an HTML attribute? What if I have to use the current CSSOM *values*?

Well, then you need to make your web component observe its own style, and trigger a callback when 
one or more of its CSS properties change. Then you need the `styleCallback()`.

(In later chapters we will look at how this can be done using `getComputedStyle(..)` to get 
the up-to-date value of the `--color` property (every frame!)).

## References

 * 
