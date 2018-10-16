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

<img src="svg/slot_style.svg" width="100%" alt="diagram"/>

## What happened?

When the browser flattens the DOM, it needs to move (ie. transpose) each slotable node into
their corresponding `<slot>`. When looking at a slot chain like the one above, 
we can think of this process happening recursively from the inside out.

1. `<slot id="innerSlot">` inside `PassePartout` "kidnaps" the `<slot id="middleSlot">` 
   inside `GreenFrame`. This produces this partially flattened piece of DOM:
```html
<slot id="innerSlot">
  <slot id="outerSlot"></slot>
</slot>
```

2. `<slot id="middleSlot">` inside `GreenFrame` "kidnaps" the `<img src="picThis.jpg" ...>`
   from the outer html document. This produces the final flattened piece of DOM:
```html
<slot id="innerSlot">
  <slot id="outerSlot">
    <img src="picThis.jpg" ...>
  </slot>
</slot>
```

## Slot chain issues

There are several *key* issues that needs to be addressed here:

1. The `<slot id="innerSlot">` is **not replaced(!)** by the last slotable nodes directly.
   If it were, the result would indeed be truly flat:
```html
<img src="picThis.jpg" ...>
```

2. The `<slot id="innerSlot">` is not filled with **only the last slotable** nodes neither.
   **All** the in-between, mediating `<slot>`s are included in the final result, 
   wrapping the final flattened slotted nodes in a **`<slot>` matroska**.

3. The order of the `<slot>`s in the `<slot>` matroska is **inside-out**.
   In the flattened DOM, `<slot>`s in the flattened chain appears in the reverse order in 
   which the documents that they belong to appear. 

It is *easy* to get confused working with such a structure. And in the next chapters we will discuss in
detail:
 * Why the `<slot>` structure will confuse you. 
 * How a **`<slot>` matroska** can confuse you.
 * Tips to help you remember the `<slot>` principles. 
 * Guidelines to avoid `<slot>` confusion.

## Discussion 
This is not a simple topic. Don't be sad or frustrated if you don't understand it fully yet.
Think of it as a sign of mental health and a proof of your own humanity.
Also, take solace in that when I first heard about such *linking slots*, 
I too found it unnatural and unappealing.
I also considered it a strange edge-case and fairly irrelevant. 

But. The good news is that it is actually much easier to get accustomed to linking slots than
might first appear.
*Linking slots* is neither particularly difficult nor strange.
It resembles many other forms of linking familiar to JS programmers and HTML developers, and 
can fall quite quickly into place.
Second, it is a much more useful than might first be considered.
In fact, once familiar with the concept, any web component made to be reused in different contexts
both benefit greatly and need to take slot chains into account.

In my own view, it is not the perfect structure for what we can call nested HTML composition.
But, it is manageable, with careful study, the help of some tools and watching your steps.

## to max: labels for sketch

* GreenFrame uses another web component PAssePArtout in its shadowDOM.
GreenFrame then place its `<slot id="outerSlot">` as a child of the PAssePArtout host node.
When `<slot id="outerSlot">` is placed as a slotable of PAssePArtout, 
the relationship between `<slot id="outerSlot">` and the `<passe-partout>` host node
form a **slot link**.

* The `<slot id="outerSlot">`, `<slot id="outerSlot">` and `<img src="picThis.jpg" ...>` make 
up a **slot chain**.

## References
 

 1.2. -> style chained slots regularly
         discussion on style creep both for directly assigned, but also and especially inherited styles
      -> style chained slots ::slotted
         discussion: "no ::slotted(*) presents for the children of slots"
         kids behvaing badly gets no presents from santa.
      -> theory on variable resolution vs transposition
