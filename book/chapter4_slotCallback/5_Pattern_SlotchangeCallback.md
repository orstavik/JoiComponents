# Pattern: SlotchangeCallback

In [PostSlotchangeCallback](4_Pattern_PostSlotchangeCallback) we triggered an initial callback for
the web components using it that will be triggered once, immediately after a) `DOMContentLoaded` or 
b) the first `slotchange` of an element would run (if it was created at startup).
In [SlotCallbackAfterDCL](3_Pattern_SlotCallbackAfterDCL) we queued and then triggered a `slotCallback`
using the relevant `<slot>` from the web component's own shadowDOM as argument.

In this pattern SlotchangeCallback, we are going to combine these two patterns. 
This combination creates a `slotchangeCallback(slot)` that is triggered whenever a `slotchange` event 
would be fired. The `slotchangeCallback(slot)` filters out SlotchangeNipSlips and delivers the
relevant `<slot>` element to the callback function.
However, in addition to doing this, the mixin that implements `slotchangeCallback(slot)` will also
fix the problem SlotchangeLostOnSafari. It does this by:

1. skipping all initial `slotchange` events.
   These events occur in Chrome and Firefox, but not Safari. 

2. manually locating all `<slot>` elements inside the shadowDOM,

3. trigger a `slotchangeCallback(slot)` for all of these `<slot>` elements that are not empty.
 
## Implementation: `SlotchangeMixin`

```javascript
const slotchangeListener = Symbol("slotchangeListener");
let constructedElements = [];
let isRunning = false;

function notNipSlip(composedPath, shadowRoot) {
  for (let node of composedPath) {
    if (node.tagName !== "SLOT")
      return null;
    if (node.getRootNode() === shadowRoot)
      return node;
  }
  return null;
}

function doCallSlotCallback(slotchange) {
  const slot = notNipSlip(slotchange, this.shadowRoot);
  slot && this.slotCallback(slot);
}

function setupElements() {
  for (let el of constructedElements) {
    el.shadowRoot.addEventListener("slotchange", doCallSlotCallback.bind(el));
    let slots = el.shadowRoot.querySelectorAll("slot");
    for (let slot of slots) {
      if (slot.assignedNodes().length > 0)
        el.slotchangeCallback(slot);
    }
  }
  constructedElements = [];
  isRunning = false;
}

if (document.readyState === "loading") {
  isRunning = true;
  document.addEventListener("DOMContentLoaded", function () {
    setupElements();
  });
}

function setupSlotchangeCallback(self) {
  constructedElements.push(self);
  if (isRunning)
    return;
  isRunning = true;
  Promise.resolve().then(function () {
    Promise.resolve().then(function () {
      setupElements();
    });
  });
}

export function SlotchangeMixin(base) {
  return class SlotchangeMixin extends base {

    constructor() {
      super();
      setupSlotchangeCallback(this);
    }
  }
}
```

## Demo: SlotchangeCallback

```html
<template>
  <style>
    div { border: 4px solid green; }
  </style>
  <div>
    <slot></slot>
  </div>
</template>

<script type="module">

  import {SlotchangeMixin} from "../../src/slot/SlotchangeMixin.js";

  class GreenFrame extends SlotchangeMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const templ = document.querySelector("template").content.cloneNode(true);
      this.shadowRoot.appendChild(templ);
    }

    slotchangeCallback(slot){
      console.log(slot);
    }
  }

  customElements.define("green-frame", GreenFrame);

  document.addEventListener("DOMContentLoaded", function () {
    const div = document.querySelector("div");
    div.innerHTML = "<green-frame>¯\\_(ツ)_/¯</green-frame>";
  });
</script>
<green-frame>¯\_(ツ)_/¯</green-frame>
<div>fill me up!</div>
```

## Discussion

The implementation `SlotchangeMixin` fixes several of the SlotMatroska problems:

1. SlotchangeLostOnSafari
2. PrematureSlotchange
3. SlotchangeNipSlip
4. SlotchangeSurprise

However, it still suffers from some problems. First, there is no callback when a `<slot>`
element is filled with fallback nodes initially. Second, FallbackNodesFallout is not fixed.
We need a mechanism to prevent an empty outer `<slot>` element marking an inner `<slot>` 
element as filled. Third, the callback depends on an *inner* state change, something inside it
having changed. It would be better if the callback depended on an *outer* state change, something
outside it having changed that it could take advantage of inside. And fifth, it does not address
the problem of SlotStyleCreep. Can these problems be fixed?

## References

 * 