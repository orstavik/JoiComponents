# Pattern: OnHover

Some UX elements can react to the wheel. It can ease interaction if these elements can be activated by hovering alone.

This behavior should be used sparingly, if at all. This pattern might be a UX anti-pattern. You definitively want to use such behavior sparingly.

## Implementation

To detect when the user hovers an element, use `mouseenter` and `mouseleave` events on the host node. 

```html
<script>
  class HoverAble extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `<slot></slot>`;
      this._slot = this.shadowRoot.children[0];
      this._onMouseenterListener = this.onMouseenter.bind(this);
      this._onMouseleaveListener = this.onMouseleave.bind(this);
      this.addEventListener("mouseenter", this._onMouseenterListener);
    }

    onMouseenter(){
      this.removeEventListener("mouseenter", this._onMouseenterListener);
      this.addEventListener("mouseleave", this._onMouseleaveListener);
      console.log("hover begins on.. " + this.innerText);
    }
    onMouseleave(){
      this.addEventListener("mouseenter", this._onMouseenterListener);
      this.removeEventListener("mouseleave", this._onMouseleaveListener);
      console.log("hover ends on.. " + this.innerText);
    }
  }

  customElements.define("hover-able", HoverAble);
</script>

<h1>Hover over "one" and "two"</h1>
<hover-able>
  one
</hover-able>
<hr>
<hover-able>
  two
</hover-able>
```
 
## References:

 * https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseleave_event