# HowTo: `::slotted(*)`

As we saw in the previous chapter, slotted nodes are first and foremost 
styled from their original, lightDOM document.
Slotted nodes will also inherit CSS properties of their parent nodes in the flattened DOM.
But, what if we from the context of the shadowDOM wished to style the assigned nodes
with CSS properties that are not inheritable?
Enter CSS `::slotted(*)`.

`::slotted(...)` is a special form of CSS selector (a CSS pseudo class):
`::slotted(...)` adds CSS rules to the nodes which gets slotted, to nodes from a different document.
Here are the rules regarding `::slotted(...)` that you need to know:

1. `::slotted(...)` selects *only the slotted children*, **not the slotted descendants**. 

2. Inside the `::slotted(...)` selector you specify which child nodes you wish to select.
   `::slotted(h1)` will only select slotted `<h1>` children.
   `::slotted(*)` selects all slotted children in the `<slot>` 
   (and this is therefore what we consider the default version of the `::slotted(...)` 
   pseudo class selector).

3. **CSS rules from lightDOM document always trumps `::slotted(...)` rules in the shadowDOM document**
   when they apply to the same slotted node.
   `::slotted(...)` is a CSS pseudo class with CSS specificity of 0,
    and regardless of the precision of the internal selector within the `::slotted(...)` query,
    the CSS rule `::slotted(...)` is always considered least important. 

4. **`::slotted(...)` properties always trumps inherited properties**. Of course.

5. To select a specific `<slot>` for a `::slotted(...)` rule, prefix the `::slotted(...)` selector.
   `::slotted(*)` selects the slotted children *for all `<slot>` nodes in the document*.
   `slot[name="boo"]::slotted(h1)` selects the slotted children *only for the `<slot name="boo">` node*.

## Example: `<green-frame>` with `::slotted(...)` style

```html
<script>
  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: "open"
      });
      this.shadowRoot.innerHTML =
        `<style>
          div {
            display: block;
            border: 10px solid green;
          }
          ::slotted(h1) {
            color: red;
            border-bottom: 6px solid red;
          }
          slot[name="title"]::slotted(h1) {
            border-left: 6px solid purple;
          }
          ::slotted(span){
            font-style: italics;
          }
          ::slotted(p.specific){
            color: blue;
          }
          ::slotted(*){
            color: orange;
            border-top: 6px solid blue;
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
    color: grey;
  }
  p {
    color: pink;
  }
  h1 {
    color: green;
  }
</style>
<green-frame>
  <h1 slot="title">Hello </h1>
  <p class="specific"><span>world!</span></p>
  <h2>by Orstavik</h2>
</green-frame>
```

## Diagram

<img src="svg/style_slotted.svg" width="100%" alt="diagram"/>

## References
 

 1.2. -> style chained slots regularly
         discussion on style creep both for directly assigned, but also and especially inherited styles
      -> style chained slots ::slotted
         discussion: "no ::slotted(*) presents for the children of slots"
         kids behvaing badly gets no presents from santa.
      -> theory on variable resolution vs transposition
