# Pattern: NativeFocus

There are a handful of native UX elements that the user is intended to interact with:

 * `<a>`, with `href` attribute
 * `<link>`, with `href` attribute
 * `<button>`
 * `<input>`, not `type="hidden"`
 * `<select>`
 * `<textarea>`

The basic principle is that the user can interact with these elements, with for example the keyboard, and thus the user should be able to `tab` his/her way to the element, or be directed there by the page itself by the developer calling the `focus()` method on the DOM element.

This behavior you likely want to echo in a custom, interactive web component.

## How to make a web component focusable

To make a web component focusable, you add `tabindex="0"` to the element. But, this provides two issues. First, you get a default attribute visible on the lightDOM host node. That is not very pretty. Second, you need to apply this attribute postConstruction. This makes for some manageable, but still complecting race conditions with other attributes added to the element.

Thus, instead of adding `tabindex="0"` to the element, we add it to a wrapper element inside the web component's shadowDOM. The wrapper element is a `<div>` element that wraps around all the other dom elements in the web component. To make the wrapper element unobtrusive both in style and layout, we set `display: unset; margin: 0; padding: 0;` on it. In addition, we observe the `tabindex` attribute on the host node, and confer any tabindex set on the host node to the tabindex'ed element in the shadowDOM.

## What to do on `focus` and `blur`?

Once `tabindex` is set inside the shadowDOM on a wrapper element, the `focus` and `blur` events can be listened for on the wrapper element. When the wrapper element is active, ie. after `focus` event and before the next `blur` event, you can listen for certain `keypress` events.

## Implementation

```html
<script>
  class FocusAble extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `<div style="display: unset; margin: 0; padding: 0;" tabindex="0"><slot></slot></div>`;
      this._slot = this.shadowRoot.children[0];
      this._keypressListener = this.onKeypress.bind(this);
      this._slot.addEventListener("focus", this.onFocus.bind(this));
      this._slot.addEventListener("blur", this.onBlur.bind(this));
    }

    static get observedAttributes(){
      return ["tabindex"];
    }

    attributeChangedCallback(name, oldValue, newValue){
      this._slot.setAttribute("tabindex", newValue);
    }

    onFocus(){
      this._slot.addEventListener("keydown", this._keypressListener);
    }
    onBlur(){
      this._slot.removeEventListener("keydown", this._keypressListener);
    }
    onKeypress(e){
      if (e.key === "PageDown")
        console.log("going down...");
      if (e.key === "PageUp")
        console.log("going up!!!");
    }
  }

  customElements.define("focus-able", FocusAble);
</script>

<focus-able>
  tab once to me, and use pageup/pagedown
</focus-able>

<focus-able>
  tab twice to me, and use pageup/pagedown
  <textarea name="omg" id="" cols="30" rows="10">
    tab  three times to me, and try to use pagedown and pageup inside me.
</textarea>
</focus-able>
```

## todo use `mouseover` and `mouseout` as triggers to listen for `keydown`?

ok, should the 
 
## todo add the appropriate ARIA roles and attributes for the element
 
## References:

 * https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event