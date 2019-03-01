# HowTo: `:host(.with[style])`

There is one way that style rules from *inside* a shadowDOM can reach out and define the style of 
an element node that reside in the lightDOM: the CSS a special selector `:host(*)`.
The `:host(*)` selector define a CSS rule that will be applied to the host element in a web component.

This can be useful when we want to specify the 
Sometimes, we want to specify the style of the host node element. This can enable us to keep a more
flattened structure in our shadowDOM. todo Other benefits?

## Example: `<ol-li>` with ShadowStyle

In this example we will create two web components that implements the heart of the `<ol>`+`<li>` elements.
This will style something about the elements. blablabla.

```html
<script>  
  import {SlotchangeMixin} from "https://unpkg.com/joicomponents@1.2.25/src/slot/SlotchangeMixin.js"; 
  
  class OlWc extends SlotchangeMixin(HTMLElement) {
    
    constructor() {
      super();
      this.attachShadow({mode: "open"});                //[1]
      this.shadowRoot.innerHTML = `
<style>                                                 
  div {
    padding-left: 20px;
  }
</style>
<div>
  <slot></slot>
</div>`;
    }
    
    slotchangedCallback(slot, newNodes, oldNodes) {     
      newNodes
        .filter(item => item instanceof LiWc)
        .forEach((el, i) => el.updateNumber(i + 1));
    }
  }
  
  class LiWc extends HTMLElement {
  
    constructor() {
      super();
      this.attachShadow({ mode: "open" });                         //[1]
      this.shadowRoot.innerHTML = `
<span><span style="width: 50px;">#.</span><slot></slot></span>`;   
    }
    updateNumber(num) {                                             
      this.shadowRoot.children[0].children[0].innerText = num + ". ";           
    }
  }
  
  customElements.define("ol-wc", OlWc);
  customElements.define("li-wc", LiWc);
</script>

<ol-wc>
  <li-wc>one</li-wc>
  <li-wc>two</li-wc>
  <li-wc>three</li-wc>
</ol-wc>
```
1. specifying the shadowStyle in a `<style>` element inside the shadowDOM.
1. specifying the shadowStyle as a `style` attribute on a specific shadowDOM element.

### :host(.minor[details="easyToForget"])

In CSS, the :host selector is not a normal type selector. 
[:host(*) is a CSS pseudo-class function](https://developer.mozilla.org/en-US/docs/Web/CSS/:host()).
This means that if you want to query to check for a certain class or attribute, 
you have to wrap the class- and attribute specifiers in parenthesis.
If you want to get the host element only when it has: a) the CSS class "minor" and 
b) the attribute "details" with value "easyToForget", you write the CSS selector like this:
`:host(.minor[details="easyToForget"])`.