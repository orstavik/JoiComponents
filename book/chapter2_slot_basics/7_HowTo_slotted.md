# HowTo: `::slotted(*)`

As we saw in the previous chapter, slotted nodes are first and foremost 
styled using regular CSS rules and selectors in the lightDOM document in which they are declared.
Slotted nodes can also inherit CSS properties from both their lightDOM and shadowDOM context.
So, we can style slotted content.                             

But, what if we wanted to "style non-inherited CSS properties of one or more transposed ("slotted") 
element? The shadowDOM standard include a special CSS selector (a CSS pseudo class):
`::slotted(...)` to solve this one particular use-case.

`::slotted(...)` works like this:

1. The `::slotted(...)` selector will match any HTML element that is transposed into a `<slot>`
   in the shadowDOM. This essentially means that:
   1. a CSS rule *from the shadowDOM* can apply to child elements of the host node *in the lightDOM*, 
   2. when and only when these child elements gets transposed "slotted". 

2. The `::slotted(...)` selector matches **slotted children only**, *not slotted descendants*.
   There is no CSS selector that from the shadowDOM can ascribe a non-inherited CSS property to the
   child of a slotted element.

3. Inside the `::slotted(...)` selector you can specify which child nodes you wish to select.
   * `::slotted(*)` selects all slotted child elements.
   * `::slotted(h1)` will only select slotted `<h1>` elements.
 
4. `::slotted(...)` has very low priority. As a rule of thumb, CSS rules in lightDOM document 
   trumps `::slotted(...)` rules in the shadowDOM for the same element, regardless of the 
   specificity of the inside selector within the `::slotted(...)` selector. 

5. `::slotted(...)` properties will trump CSS properties that is only inherited. Of course.

6. To select a specific `<slot>` for a `::slotted(...)` rule, prefix the `::slotted(...)` selector.
   * `slot[name="boo"]::slotted(h1)` selects `<h1>` elements that are slotted into the `<slot name="boo">`.
   * `*::slotted(*)` (same as `::slotted(*)`) selects all slotted elements for all `<slot>` elements.

## Example: `<green-frame>` with `::slotted(...)` style

```html
<script>
  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =
        `<style>
          ::slotted(*){
            border-right: 6px solid green;
          }
          *::slotted(*){
            border-bottom: 6px solid green;
          }
          slot[name="title"]::slotted(h1) {
            color: green;
          }
          ::slotted(h1) {
            color: red;
          }
          ::slotted(p.specific){
            color: darkgreen;
          }
        </style>
        <div>
           <slot name="title"></slot>
           <slot></slot>
        </div>`;
    }
  }

  customElements.define("green-frame", GreenFrame);
</script>
<style>
  body {
    color: blue;
  }
  p {
    color: lightblue;
  }
</style>
<green-frame>
  <h1 slot="title">Hello </h1>
  <p class="specific"><span>world!</span></p>
</green-frame>
```

## Diagram

<img src="svg/style_slotted.svg" width="100%" alt="diagram"/>

## References
 
 * [CSS spec: `::slotted`](https://drafts.csswg.org/css-scoping/#slotted-pseudo)

 1.2. -> style chained slots regularly
         discussion on style creep both for directly assigned, but also and especially inherited styles
      -> style chained slots ::slotted
         discussion: "no ::slotted(*) presents for the children of slots"
         kids behvaing badly gets no presents from santa.
      -> theory on variable resolution vs transposition
