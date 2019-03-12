# Mixin: StyleCallback

Basically, the StyleCallback pattern is the NaiveStyleCallback pattern using the 
TreeOrderedCssomTraversal pattern.
The StyleCallback pattern observes a select set of actual CSS properties on a select 
og elements in the DOM. Once per frame, scheduled using a `requestAnimationFrame(...)` task, 
the StyleCallback traverses all of these DOM elements, checks each element's observed CSS
properties and then calls `styleCallback(cssPropertyName, oldValue, newValue)` if that CSS
property value has changed.

The StyleCallback pattern follows the requirements specified in HowTo: TraverseTheCssom:

1. Implementations of the `styleCallback(...)` should only alter the shadowDOM and other inner 
   state in their web component. The `styleCallback(...)` should *not* cause any events to be 
   dispatched outside its shadowDOM, *not* alter, add or remove any HTML attributes on the host
   element, and *not* alter the global state or local/network sources.
   
2. If a first element's `styleCallback(...)` alters the shadowDOM in a way that adds or removes 
   a `styleCallback(...)` task for a second element that is contained within the first element in 
   the DOM, then this change will be reflected in the ongoing batch of `styleCallback(...)` processing.
   
3. If a currently processed element's `styleCallback(...)` alters the CSSOM in a way that it changes 
   the observed CSS properties of other elements that has already been processed in the current 
   `styleCallback(...)` processing cycle, including the currently processed element itself, then this 
   will throw a CyclicalStyleCallbackError. 
   Testing for CyclicalStyleCallbackError can be turned off in production to increase speed.
   
## Implementation: `StyleCallbackMixin`

```javascript
function CyclicalCssomMutationsError(current, currentProperty, altered, alteredProperty){
  throw new Error("Cyclical styleCallback Sequence Error:"+ 
                   "\n"+current.className + "." + "styleCallback('"+currentProperty+"', oldValue, newValue) " +
                    "\nhas triggered a change of an observed style of " + altered.className + ".style."+alteredProperty + 
                    "\n that could trigger the " + 
                   altered.className + "." + "styleCallback('"+alteredProperty + "', oldValue, newValue) "+
                     "\nto be called again, cyclically within the same frame.");
}

let cssomElements = [];
let currentElement = undefined;

function checkProcessedElementsStyleWasAltered(triggeringProp, processedElements) {
  for (let el of processedElements) {
    const observedStyles = currentElement[observedStylesMap];
    const currentStyles = getComputedStyleValue(el);
    for (let name of Object.keys(observedStyles)) {
      let newValue = currentStyles[name];
      let oldValue = observedStyles[name];
      if (newValue !== oldValue)
        CyclicalCssomMutationsError(currentElement, triggeringProp, el, name);
    }
  }
}

function checkCurrentElementStyleWasAltered(observedStyles, currentElement, triggeringProp){
  const newStyles = getComputedStyleValue(currentElement);
  for (let name of Object.keys(observedStyles)) {
    let newValue = newStyles[name];
    let oldValue = observedStyles[name];
    if (newValue !== oldValue)
      CyclicalCssomMutationsError(currentElement, triggeringProp, currentElement, name);
  }
}

function traverseCssomElements(){
  cssomElements = cssomElements.sort(function(a, b){a.compareNodePosition(b) & Node.DOCUMENT_POSITION_PRECEDING});
  const processedElements = [];
  for (let i = 0; i <= cssomElements.length; i++) {
    currentElement = cssomElements[i];
    const observedStyles = currentElement[oldStyles];
    const currentStyles = getComputedStyleValue(currentElement);
    for (let name of Object.keys(observedStyles)) {
      let newValue = currentStyles[name];
      let oldValue = observedStyles[name];
      if (newValue !== oldValue){
        observedStyles[name] = newValue;
        currentElement.styleCallback(name, oldValue, newValue);
        checkProcessedElementsStyleWasAltered(name, processedElements);
        checkCurrentElementStyleWasAltered(observedStyles, currentElement, name);
      }
    }
    processedElements.push(currentElement);
  }
  currentElement = undefined;
}

function addToBatch(el){
  if (currentElement){
    if (! (currentElement.compareNodePosition(el) & Node.DOCUMENT_POSITION_CONTAINS))
      CyclicalCssomMutationsError(currentElement, currentProperty, el, "*");
  }
  for (let i = 0; i < cssomElements.length; i++) {
    let inList = cssomElements[i];
    if (el.compareNodePosition(inList) & Node.DOCUMENT_POSITION_CONTAINS)
      return cssomElements.splice(i, 0, el);
  }
}

function removeFromBatch(el){
  if (currentElement){
    if (! (currentElement.compareNodePosition(el) & Node.DOCUMENT_POSITION_CONTAINS))
      CyclicalCssomMutationsError(currentElement, currentProperty, el, "*");
  }
  cssomElements.splice(cssomElements.indexOf(el), 1);
}


let interval;

export function startStyleCallback(){
  interval = requestAnimationFrame(traverseCssomElements);
}

export function stopStyleCallback(){
  clearAnimationFrame(interval);
}

startStyleCallback();

const oldStyles = Symbol("oldStyles");

function StyleCallbackMixin(type){
  return class StyleCallbackMixin extends type {
    
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
  import {StyleCallbackMixin} from "StyleCallbackMixin.js";

  class BlueBlue extends StyleCallbackMixin(HTMLElement) {
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

## Future work

A fully functioning `styleCallback(..)` that adhere to the requirements in HowTo: TraverseTheCssom 
is possible. It is safe and efficient enough. It will simplify several operations that now add 
complexity to apps and web components, while at the same time add its own practical problems, errors 
and edge-cases. But, `styleCallback(..)` is most relevant in that it adds and reduces the conceptual 
complexity of web components and HTML+CSS+JS programming.

On the side, the `styleCallback(..)` reduces complexity by giving the developer all the tools
needed to make custom CSS property values. The `styleCallback(..)` gives the ability to implement true,
full custom CSS properties (CSS variables only implement custom CSS property *names*, not custom CSS
property *values*). Custom CSS property values is the last missing component 
needed to implement a web component version of native HTML/CSS constructs such as `<table>`. 
Conceptually and practically, this is of great importance.

On the other side, `styleCallback(..)` gives the developer a method to *react to* style changes. 
Now, theoretically, both CSS and CSSOM has always been dynamic. CSS styles can be changed dynamically
as a part of the DOM. But, in practice, since there has been no direct method to observe CSSOM changes, 
CSSOM observation and reaction has been practically very limited.

My own opinion is that `styleCallback(..)` sheds light on the future of HTML and CSS. With a 
`styleCallback(..)`, `<table>` can finally be implemented using only web components technology.
This means that *many* first class HTML elements (core, native HTML elements) such as 
`<table><tr><td><caption>` and `<dl><dd><dt>` can be taken out of the HTML spec proper and 
remade as second class HTML citizen elements: web components that defines both custom CSS properties 
*and* custom CSS values. `styleCallback(..)` is the only missing piece in this puzzle.

When obscure HTML elements are converted into web components, 
then lots of HTML and CSS semantics can be moved out of the core grammar of HTML and CSS. For good. 
This will substantially reduce the complexity which beginner and experienced HTML and CSS developers 
need to relate to. Furthermore, as developers for the first time will have the full means to implement 
elements akin to `<table>` and `<dl>`, then maybe the dream of wide spread, reusable web components 
could finally come true. To implement a CSSOM lifecycle callback in web components therefore deserve
*more* scrutiny, not less.

## References

 * 
