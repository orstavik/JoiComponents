# WhatIs: SlotMatroska

Web components can use other web components in their shadowDOM.
This gives a web component the ability to encapsulate several other custom elements side-by-side,
giving developers a good way to organize their code into logical pieces and 
encapsulate both HTML template and CSS rules along the same lines across an application.

But, web components can also use other web components to extend their own "framing abilities".
If an outer web component in its shadowDOM uses another inner web component, then
the outer web component can place one of its own `<slot>` elements as a slotable child of the
inner web component.
A `<slot>` inside the inner web component will then get the `<slot>` of the outer web component as 
one of its slotable nodes.
If that outer `<slot>` element in turn has another is linked with yet another outer-outer slotable node,
then that outer-outer slotable node will indirectly be slotted into the inner web component.
We call this recursive `<slot>` relationship a "**slot chain**".
And we call "placing `<slot>` elements as a slotable node under another web component host node"
for "**linking slots**".

This is much easier to understand in an example, than theoretically. So, let's just dive in!

## Example: `<green-frame>` with `<passe-partout>`

In this example we will add a passepartout to our green frame.
To do so, we create another web component called `PassePartout`.
The `PassePartout` adds a grey border around the image, and
then the `GreenFrame` web component uses the new `PassePartout` element as
an extra inner frame around its slotted content.

```html
<script>
  class PassePartout extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 20px solid grey;
          }
        </style>

        <div>
          <slot id="innerSlot"></slot>
        </div>`;
    }
  }
  class GreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 10px solid green;
          }
        </style>

        <div>
          <passe-partout>
            <slot id="outerSlot"></slot>
          </passe-partout>
        </div>`;
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>
  <img src="picThis.jpg" alt="can you imagine">
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

* GreenFrame uses another web component PassePartout in its shadowDOM.
GreenFrame then place its `<slot id="outerSlot">` as a child of the PAssePArtout host node.
When `<slot id="outerSlot">` is placed as a slotable of PAssePArtout, 
the relationship between `<slot id="outerSlot">` and the `<passe-partout>` host node
form a **slot link**.

* The `<slot id="outerSlot">`, `<slot id="outerSlot">` and `<img src="picThis.jpg" ...>` make 
up a **slot chain**.

## References
 

 