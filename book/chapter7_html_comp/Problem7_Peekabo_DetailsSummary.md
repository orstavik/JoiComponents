# Problem7: Peekabo / ToggleView based on child type

Another frequently recurring problem for HelicopterParentChild components is to toggle on/off
the display of some, but not all child elements.
This is essentially the behavior as the native `<details>`+`<summary>` HelicopterParentChild pair.

## Example 1: `<custom-details>` and `slot="summary"` 

The `<details>`+`<summary>` elements function like this:
1. By default, all the `.childNodes` of the `<details>` element are hidden.
2. Except when the `open` attribute is added (`<details open>`), then all the `.childNodes` are shown. 
3. And except for the *first* `<summary>` element child, which is always shown.

We can implement more or less the same behavior in a single `<custom-details>` web component using 
an attribute `slot="summary"` instead of wrapping the always visible summary in a `<summary>` element.

```html
<button style="position: fixed; top: 0; right: 0;" onclick="toggleDetails()"> sunshine on/off</button>
<script>
  function toggleDetails() {
    const native = document.querySelector('details');
    native.hasAttribute("open") ? native.removeAttribute("open") : native.setAttribute("open", "");
    const custom = document.querySelector('custom-details');
    custom.hasAttribute("open") ? custom.removeAttribute("open") : custom.setAttribute("open", "");
  }
</script>

<details open>
  <summary>Native details/summary pair</summary>
  hello world!
</details>

<script>
  class CustomDetails extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          :host(:not([open])) slot#content {
            display: none;
          }
          b {
            display: inline-block;
          }
          :host([open]) b {
            transform: rotate(90deg);
          }
        </style>
        <div><b>&#x25BA;</b> <slot name="summary">Details</slot>
        </div>
        <slot id="content"></slot>
      `;
      this.shadowRoot.querySelector("b").addEventListener("click", function () {
        this.hasAttribute("open") ? this.removeAttribute("open") : this.setAttribute("open", "");
      }.bind(this));
    }
  }

  customElements.define("custom-details", CustomDetails);
</script>

<hr>
<custom-details open>
  <span slot="summary">custom-details/slot="summary" pair:</span>
  <span>Hello</span> sunshine!!
</custom-details>
```
## Discussion

There are some differences between the native `<details>` and the `<custom-details>` web components:

1. the native version filters the summary based on element type, not a `slot` attribute.

2. the native version will *only* show the *first* `<summary>` element in default mode, 
   while many elements with `slot="summary"` can be shown constantly in the custom version.

3. To implement a version that behaves even more like the native version, 
   use the `SlotChildMixin` of `slottables-changed` event and let the `<custom-details>` element
   itself control the `slot` attribute on the assigned children. 
   In such a scenario, `<custom-summary>` elements must likely be passed a slot-chain dynamically 
   created and deleted for this exact purpose in a SlotMatroska. It is not very pretty.

## `<sensitive-details>`

It would be nice if our `<custom-details>` was a bit more sensitive. 
If nothing but whitespace has been placed as its content, 
it should show us so that it is empty and not pretend to be `open`able 
by presenting the user with a tempting triangle.

Whether a `<sensitive-details>` element is empty should not be controlled from outside.
It is automatically observed and maintained by the `<sensitive-details>` element.
At the same time we would like the outside to be able to style it. That would be simpler if we could
assign styles to the element based on an attribute.

The `_empty` attribute is therefore made as a StubbornAttribute. 
The StubbornAttribute monitors the state of slotchange events with `SlottablesEvent`.
It then checks if the content of the default, no-name `<slot>` is either  
to accomplish this. The SlottablesEvent is safe in case  

A `<sensitive-details>` element is considered empty if it only contains whitespace text nodes.
That means that it is EmptyButNotEmpty or its flattenedDOM is only filled with whitespace.

```html

```

## References

 * [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)
