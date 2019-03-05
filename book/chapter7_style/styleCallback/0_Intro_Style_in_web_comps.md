# Intro: Style in web components

To encapsulate CSS is certainly one of the main purposes behind web components. 
This chapter describes the different ways a web component can encapsulate CSS and still be styled from 
the outside.

1. HowTo: shadowStyle.
   Use `<style>`, `<link rel="style">` and `style="css-props"` in the shadowDOM. 
   CSS rules inside the shadowDOM of a web component are hidden and will not interfere with the lightDOM
   (except the `:host` selector, which we come back to).
   Demo: the `<blue-blue>` element that colors a piece of text and its background.

2. Problem: ThisStyleIsNotMyStyle.
   Demo: `<blue-blue>` that sets style on the host element in the lightDOM.
   When the host element style is changed from outside, the web components internal and external CSS
   properties conflict and overwrite each other in confusing ways.

3. HowTo: HostWithStyle fixes the ThisStyleIsNotMyStyle Problem.
   It uses the `:host` attribute to set a style on the host element node.
   Demo: `<blue-blue>` set using the `:host` selector that can be overridden when needed in the lightDOM.

4. HowTo: CSS variables on web components.
   Pass style settings into the custom element using CSS --custom-properties as css variables:
   `--some-value: blue;` in the lightDOM and then `color: var(--some-value)` in the shadowDom. 
   Demo: `<blue-blue>` that lets the user to set `color` and `bg-color` inside the shadowDOM via
   the css variables `--bg-color` and `--text-color`. 

5. UseCase 1: Coordinate SystemWorldCovariantCss
   todo: find an example from CSS where it gives a shorthand to coordinate SystemWorldCovariantCss
   example: an imagined `display-shorthand: fixed top-left 12px 200px;`

6. UseCase 2: Coordinate RealWorldCovariantCss
   native solution: CSS shorthand `border` for shorthandnames such as square and dots
   example: `color-mode: day blue;`
   
7. Pattern: CustomCssShorthand
   Not specific to web components.
   
   a. simplify use choices and covariant CSS properties
   example: `color-mode: day blue;` using simple string value
      
8. Pattern: manual `styleCallback()` part 1
   Where to listen for the style? the lightDOM host element. That way the style property can travel.
   via manual, local 
   use a callback to implement a listener for both CSS shorthands and ElementSpecificCssProperties
   custom to each individual element.
   it is naive, because it is triggered manually after each change. 
   for processing CustomCssShorthands in web components 

   same example as above, only in a web component
   todo example: `color-mode: day #990000;` using numeric value and a function to calculate palette?
      
9. Pattern: batched `styleCallback()`
   still manual trigger, but this time, the web components themselves make sure they are registered in 
   a que so that style that will batch their callbacks.
   Here, we need to employ the pattern StaticSettings to define which properties that should be called back.
   * `styleCallback("custom-prop", newValue, oldValue)` + `static get observedStyle() return ["custom-prop"]`

10. Pattern: automatic `styleCallback(...)` 
    triggered automatically by a rAF.
    still a bit naive, but this time all the element itself registers itself in an global array of 
    elements that are triggered every raf.
    still naively triggered by DOMContentLoaded "DCL" and then rAF.

11. Problem: DOM alter CSS alter DOM alter CSS loops
    `styleCallback()` must only alter state that is invisible from the lightDOM
    * no sideeffects (that alters the application state or the global PWA state or the state of composed events)
    * no dispatch of events (that can trigger event listener in the lightDOM)
    * no altering element attributes (that can be observed and trigger a callback in the lightDOM)
    It is an anti-pattern to alter other styles or DOM that is not *within* the current element. 

12. Problem 2: OutsideStyle Becomes InsideStructure                                   
    Native Solution: ElementSpecificCssProperties
    example: `list-style` for square and dots and inside and url
    example: `caption-side` for layout control
    
    when we do this, never alter any externally observable state
    such as dispatch event, alter host node attributes, alter single-state / application state
    or PWA state.
    
    write about how styleCallback spillover/sideeffects. That is why you should always trigger changes 
    that only effect the CSSOM *below* downwards your point of view.
   
13. Pattern: TreeOrdered `styleCallback()` 
    The batched process are top down.
    If the batch is altered during the check, and 
    the alteration is NOT strictly underneath the current node,
    throw an Error that can pin point the batched `styleCallback()` that was the root of the problem.
    
    Alter shadowDOM in `styleCallback()`
    b. alters the shadowDOM
    
14. Discussion: CSS properties vs. HTML attributes

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
   