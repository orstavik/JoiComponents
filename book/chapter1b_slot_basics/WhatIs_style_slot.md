# HowTo: style `slot`

`<slot>`s and slotted nodes is primarily styled using types of CSS selectors:
 * regular CSS selectors and
 * `::slotted(*)`.

Regular CSS selectors can style both:
1. the `<slot>` element itself (in the shadowDOM), 
2. parents of the `<slot>` element (in the shadowDOM),
3. the slotted nodes (in the lightDOM)¸and
4. the slotted nodes parents (in the lightDOM).

`::slotted(*)` can *only* select the *slotted direct children*,
not slotted descendants.
`::slotted(*)` has high specificity.

## Example: `<green-frame>` with style

In this example we will add styles to the green frame.
We will use many different selectors to see the many ways to succeed.

```html
<script>
  class GreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 10px solid green;
            font-style: italic;       //[will be inherited]
          }
          slot {
            font-family: times;       //[will be inherited]
            border-left: 2px solid blue;
          }
          ::slotted(h1) {
            border-top: 2px solid red; //[will be added]
          }
          ::slotted(span){
            border-top: 2px solid red; //[will not be added as the span is a slotted descendant]
          }
          ::slotted(*){
            border: 5px solid yellow;  //[will be added to both h1 and p]
          }
        </style>

        <div>
          <slot></slot>
        </div>`;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>
<style>
  body {
    font-weight: lighter;
  }
  * {
    background: lightgrey;
  }
  span {
    border-bottom: 2px solid orange;
  }
</style>
<green-frame>
  <h1>Hello </h1>
  <p><span>world!</span></p>
</green-frame>
```

## Diagram

todo

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
 

 