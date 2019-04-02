# SlotchangeNipSlip #3: RedundantCreations

In the previous chapter, we saw that creating an element can trigger multiple slotchange events.
And I must warn you, now we are going to well and truly start swimming in the deep end of the pool
of `slotchange` events. This is not easy. I assume that currently, not even many of the developers
behind the slotchange event truly comprehend this neither.

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