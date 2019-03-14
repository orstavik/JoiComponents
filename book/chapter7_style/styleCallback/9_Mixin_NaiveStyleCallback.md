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

> Only native CSS properties and double-dash custom CSS properties can be observed
> (cf. [CSSStyleDeclaration](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration)).

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
  const els = batch.slice();
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

## Why NaiveStyleCallback is naive

There are several issues, both conceptual and practical that concern both architecture, 
developer ergonomics, efficiency and bugs related to the NaiveStyleCallback. In fact, there are
so many, that I have devoted the next chapter [HowTo: TraverseTheCssom](a_HowTo_TraverseTheCssom)
to discuss them.

## References

 * 