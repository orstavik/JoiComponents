# SlotchangeNipSlip #3: NotOnlyTransposedNodes

In the previous chapter, we saw that creating an element can trigger multiple slotchange events.
And I must warn you, now we are going to well and truly start swimming in the deep end of the pool
of `slotchange` events. This is not easy. I assume that currently, not even many of the developers
behind the slotchange event truly comprehend this neither.

## DOM branch vs. DOM node events

`slotchange` is different than the `constructor()`, `connectedCallback()`, and 
`attributeChangedCallback(..)`: `slotchange` is of course and event, while the others are lifecycle 
callbacks, obviously. But, the critical difference between the `slotchange` event and the other
lifecycle callbacks is that the other lifecycle callbacks rely only on a *single* DOM node, while 
the `slotchange` event relies on *three* DOM nodes: a host node, a child node of the host node, and
a `<slot>` element inside the shadowDOM of the host node.
These three elements must exist together and in a certain constellation for a node to be transposed 
(or no longer transposed) and for there to be a `slotchange` event.

Therefore, we can call the `slotchange` a **DOM branch event**, a constellation occuring in a 
hierarchy of minimum three DOM nodes. On the other hand, the lifecycle callbacks `constructor()`, 
`connectedCallback()`, and `attributeChangedCallback(..)` are **DOM node events**, they require a 
change to only a *single* node to exist.

## HTML is DOM branch declaration

When we declare HTML elements in HTML, we do two sets of operations, at the same time.

1. we create a set DOM nodes, that are given attributes, either connected or disconnected from the 
   DOM.
   
2. we organize these DOM nodes as a hierarchy, in which nodes are positioned inside and alongside 
   each other.
   
When we look at HTML template, we see these two processes as occurring simultaneously. But if we look
at it from JS, these two processes do not occur at the same time: in JS we first call an elements
`constructor()`, then for example call `.setAttribute(..)` on the object, and then use 
`appendChild(..)` to connect the element to another element (inside or outside the DOM). 
The example below illustrate how this work by creating two identical DOM branches using HTML and 
then JS:

```html
<div box="big">
  <h1>Hello world!</h1>
</div>

<script>
  const bigBox = document.createElement("div");          //[1]
  const h1 = document.createElement("h1");               //[1]
  h1.innerText = "Hello world!";                         //[1]     //[3]
  bigBox.setAttribute("box", "big");                          //[2]
  document.querySelector("body").appendChild(bigBox);              //[3] [4]
  bigBox.appendChild(h1);                                          //[3]
</script>
```
The first stage in the process is to create three DOM nodes: bigBox, h1 and a text node with 
"Hello world!". The next stage in the process is to attach the attributes. And the third stage
in the process is to organize them in a hierarchy. During this third stage, the forth stage of
connecting the elements to the DOM can be triggered.

## Example: SlotchangeNipSlip #3

A big problem with slotchange events is that when we in HTML declare even small DOM branches in 
HTML, this can trigger lots of `slotchange` events on partial DOM branches, DOM constructions that
we do not really see from the HTML perspective. This is not such a problem when `<slot>` elements
are only one level deep, but when `<slot>` elements are chained, this can cause large set of redundant
`slotchange` events to occur for what looks like simple DOM constructions. 

Normal HTML declarations of DOM branches can therefore trigger several, redundant `slotchange` events.
Below is an example to illustrate this problem:

```html
<template id="portrait">
  <style>
    green-frame {
      display: block;
      width: 300px;
      height: 300px;
    }
    #frameTwo {
      height: 1.2em;
    }
  </style>
  <green-frame id="frameOne">
    <slot>a picture</slot>
  </green-frame>
  <green-frame id="frameTwo">
    <slot name="label">of somebody</slot>
  </green-frame>
</template>

<template id="frame">
  <style>
    :host {
      border: 4px solid green;
    }
  </style>
  <slot></slot>
</template>

<script>
  class PortraitFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const template = document.querySelector("#portrait").content.cloneNode(true);
      this.shadowRoot.appendChild(template);
      this.shadowRoot.addEventListener("slotchange", this.slotchangeCallback.bind(this));
    }

    slotchangeCallback(event) {
      console.log(this.id, event.composedPath());
    }
  }

  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const template = document.querySelector("#frame").content.cloneNode(true);
      this.shadowRoot.appendChild(template);
      this.shadowRoot.addEventListener("slotchange", this.slotchangeCallback.bind(this));
    }

    slotchangeCallback(event) {
      console.log(this.id, event.composedPath());
    }
  }

  customElements.define("green-frame", GreenFrame);
  customElements.define("portrait-frame", PortraitFrame);
</script>

<portrait-frame id="portrait">
  <h2>¯\_(ツ)_/¯</h2>
  <span slot="label">self-portrait, by ivar</span>
</portrait-frame>

<h3>SlotchangeNipSlip #3: CreateRedundantSlotchangeEvents </h3>

We start viewing the situation from HTML.
<ol>
  <li>
    A h2 and span element are declared in the top most lightDOM.
  </li>
  <li>
    The h2 and span elements are then transposed into their respective slot element in the portrait-frame shadowDOM.
  </li>
  <li>
    Then, the two slot elements in the portrait-frame shadowDOM are transposed into two different green-frame elements
    and their inner slots.
  </li>
  <li>
    From the perspective of HTML, this should trigger a total of four slotchange events.
  </li>
</ol>

But, in JS, six(?!) slotchange events are triggered.
<ol>
  <li>
    frameOne (2) [slot, document-fragment]<br>
    This event is triggered as the first slot in portrait-frame is transposed to the inner slot in the first green-frame
    element.
  </li>
  <li>
    frameTwo (2) [slot, document-fragment]<br>
    This event is triggered as the first slot in portrait-frame is transposed to the inner slot in the first green-frame
    element.
  </li>
  <li>
    frameOne (5) [slot, slot, document-fragment, green-frame#frameOne, document-fragment]<br>
    portrait (5) [slot, slot, document-fragment, green-frame#frameOne, document-fragment]<br>
    "¯\_(ツ)_/¯" is added to the portrait-frame element. This element is then transposed to the portrait-frame element
    and then the green-frame#one. The green-frame#one slotchange event listener is triggered first, then the portrait.
  </li>
  <li>
    frameTwo (5) [slot, slot, document-fragment, green-frame#frameTwo, document-fragment]<br>
    portrait (5) [slot, slot, document-fragment, green-frame#frameTwo, document-fragment]<br>
    "self-portrait, by ivar" is added to the portrait-frame element. This element is then transposed to the
    portrait-frame element and then the green-frame#two. The inner, green-frame#two slotchange event listener is
    triggered first, then the outer portrait-frame event listener.
  </li>
</ol>
```

The example above is simplified. But even this simplified problem will *always* occur whenever a web 
component is created with that chains one or more `<slot>` elements


## References

 * 