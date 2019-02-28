# Intro: Style in web components

To encapsulate CSS is certainly one of the main purposes behind web components. 
This chapter describes the different ways a web component can encapsulate CSS and still be styled from 
the outside.

1. HowTo: shadowStyle that is to use `<style>` and `<link rel="style">` and style attributes on 
   elements inside the shadowRoot. All these CSS rules are hidden from the lightDOM and will not 
   interfere with the lightDOM. Except the `:host` selector, which we will look at in the next chapter.
   The example here is the `<blue-blue>` element and then we add a background on the text block with the text,
   and a special number.

2. Problem: ThisStyleIsNotMyStyle.
   example: `<blue-blue>` set wrongly on the host element, then the host element is changed from outside, 
   and then nulled out again, and the original setting was lost.

3. HowTo: HostWithStyle fixes the ThisStyleIsNotMyStyle Problem.
   It uses the `:host` attribute to set a style on the host element node.
   example: `<blue-blue>` that is set on the host, and then also overridden by the host.

4. HowTo: CSS variables on web components.
   Pass style settings into the custom element using CSS --custom-properties as css variables:
    * `--some-value: blue;` in the lightDOM and
    * `color: var(--some-value)` in the shadowDom 
   
   example: `<blue-blue>` that sets the font type of the list of numbers.   

5. UseCase 1: Coordinate SystemWorldCovariantCss

6. UseCase 2: Coordinate RealWorldCovariantCss
   
7. UseCase 3: OutsideStyle Becomes InsideStructure

8. Native Solution 1: CSS Shortcuts
   example: `border` for shortcutnames such as square and dots
   
9. Native Solution 2: ElementSpecificCssProperties
   example: `list-style` for square and dots and inside and url
   example: `caption-side` for layout control
   
10. Pattern: Custom ElementSpecificCssProperties & manual, local `styleCallback()`
   use a callback to implement a listener for both CSS shortcuts and ElementSpecificCssProperties
   custom to each individual element.
   
   a. simplify use choices and covariant CSS properties
   example: custom use of numeric values, don't know what.
      
   b. alters the shadowDOM
   example: `list-style` for url
   example: `list-style` for inside/outside

   it is naive, because it is triggered manually after each change. 
   on DOMContentLoaded "DCL" and then after a manual check imperatively.
   * StyleMixin.js: `styleCallback("custom-prop", newValue, oldValue)` + `static get observedStyle() return ["--custom-prop"]`

12. Pattern: automatic, local `styleCallback()` batched in rAF
    still a bit naive, but this time all the element itself registers itself in an global array of 
    elements that are triggered every raf.
   
13. Pattern: automatic, local, top-down `styleCallback()` against a mutable DOM sorted TreeOrder

 * LayoutMixin.js: `layoutCallback({size: {width, height}, position{top, left, bottom, right}})` 
   and `static get observedLayout() return ["position", "size"]` 
   (cf. old resizeCallback()).
   
 * CssShadowPartsMixin.js: This might come in the standards, but it is not there yet.
   And ::shadowParts selector could be useful to specify the number pointer on the li-li element.
   But this is also heavy, and less useful than the styleCallback, so not implemented yet.
   
   
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
2. specifying the shadowStyle as a `style` attribute on a specific shadowDOM element.
   