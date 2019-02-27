# Intro: Style in web components

This chapter describes the different ways a web component can be styled and 
react to style/layout changes.

1. Pattern: shadowStyle that is to use `<style>` and `<link rel="style">` and style attributes on 
   elements inside the shadowRoot. All these CSS rules are hidden from the lightDOM and will not 
   interfere with the lightDOM. Except the `:host` selector, which we will look at in the next chapter.
   The example here is the `<ol-li>` element and then we add a background on the text block with the text,
   and a special number.

2. Problem: ThisStyleIsNotMyStyle.
   example: `<ol-li>` set wrongly on the host element, then the host element is changed from outside, 
   and then nulled out again, and the original setting was lost.

3. Pattern: HostWithStyle fixes the ThisStyleIsNotMyStyle Problem.
   It uses the `:host` attribute to set a style on the host element node.
   example: `<ol-li>` that is set on the host, and then also overridden by the host.

4. HowTo: InheritedCSSProperties on web components.
   example: `<ol-li>` that sets the font type of the text.   

5. HowTo: CSS variables on web components.
   Pass style settings into the custom element using CSS --custom-properties as css variables:
    * `--some-value: blue;` in the lightDOM and
    * `color: var(--some-value)` in the shadowDom 
   
   example: `<ol-li>` that sets the font type of the list of numbers.   

6. Pattern: styleChangedCallback() for element specific CSS properties that alters the shadowDOM
   example: `list-style` for url
   example: `list-style` for inside/outside
   * StyleMixin.js: `styleCallback("custom-prop", newValue, oldValue)` + `static get observedStyle() return ["--custom-prop"]`

7. Pattern: styleChangedCallback() for element specific CSS properties that simplify use choices
   example: `list-style` for shortcutnames such as square and dots
   example: custom use of numeric values, don't know what.

8. LayoutMixin.js: `layoutCallback({size: {width, height}, position{top, left, bottom, right}})` 
   and `static get observedLayout() return ["position", "size"]` 
   (cf. old resizeCallback()).
   
9. CssShadowPartsMixin.js: This is likely coming, but we do not implement it yet.
   It is less relevant and useful than styleChangedCallback().


## Is a web components main purpose to encapsulate and hide CSS?

It certainly is one of the main points of web components.

One perspective on CSS is this:
> CSS and its global scope is any system architects nightmare.
If errors in CSS had stopped a web page/app from working, 
CSS and the way it is organized would have been changed looooong ago.

An answer to this perspective is:
> That is why we want to hide CSS. 
CSS is full of old, no-longer in use rules that we wrote some time ago.
Most of the rules had a purpose back then, but now, only a few of the rules do.
But to find out exactly where and when these rules apply can be too tedious, 
so it is better to simply hide the CSS rules in separate files.
A style that have since been reworked several times, but we are afraid to remove the old rules
as some of our elements might need them occasionally or implicitly.
So, yes, please, hide that stuff!

An answer to that again is:
> No wait.. That looks wrong.. We don't want to hide stuff we don't understand! 
We *only* want to hide stuff that we *do* understand. And. We don't really want to hide it: 
we just want to split it up into manageable bits, modularize it, 
so that we can design, test, deploy, maintain and sleep knowing about, without numbing our 
sensibility to system failure.

So our exercise is:
> So, ok, that is what we will do here. We will not hide anything in css that is ugly.
We will only encapsulate style stuff that is understandable and that can and should 
put into a web component. We will make CSS prettier. And I promise you: 
web components *do* provide a mechanism to uncook half the bowl of CSS spaghetti.

```javascript
import {SlotchangeMixin} from "SlottableMixin.js"; 

class OlWc extends SlotchangeMixin(HTMLElement) {
                                                                                
  connectedCallback() {                                           
    super.connectedCallback();
    this.style.paddingLeft = "20px";
    this.style.display = "block";
  }
  slotchangedCallback(slot, newNodes, oldNodes) {     //[2]
    newNodes
      .filter(item => item instanceof LiWc)
      .forEach((el, i) => el.updateNumber(i + 1));
  }
}

class LiWc extends HTMLElement {

  connectedCallback() {
    super.connectedCallback();
    this.attachShadow({ mode: "open" });
    this.style.display = "inherit";                      
    this.shadowRoot.innerHTML = `<span>#.</span><slot></slot>`;   //[1]
  }
  updateNumber(num) {                                             
    this.shadowRoot.children[0].innerText = num + ". ";           //[3]
  }
}

customElements.define("ol-wc", OlWc);
customElements.define("li-wc", LiWc);
```