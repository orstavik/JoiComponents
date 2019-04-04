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
 
## Implementation: `SlotchangeCallbackMixin`

```javascript
const slotchangeListener = Symbol("slotchangeListener");
let constructedElements = [];
let isRunning = false;

function notNipSlip(composedPath, shadowRoot) {
  for (let node of composedPath) {
    if (node.tagName !== "SLOT")
      return null;
    if (node.ownerDocument === shadowRoot)
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

export function SlotchangeCallbackMixin(base) {
  return class SlotchangeCallbackMixin extends base {

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

  import {SlotchangeCallbackMixin} from "../../src/slot/SlotchangeCallbackMixin.js";

  class GreenFrame extends SlotchangeCallbackMixin(HTMLElement) {
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

The implementation `SlotchangeCallbackMixin` fixes several of the SlotMatroska problems:

1. SlotchangeLostOnSafari
2. PrematureSlotchange
3. SlotchangeNipSlip
4. SlotchangeSurprise

However, it still suffers from some problems:

## Slottables, not slotted

1. It depends on the web component having a shadowDOM
2. It does not alert the web component if there is content that *could* be slotted, but which 
   currently is not.

The next step attempts to fix the two issues in one fell swoop. 

1. Instead of relying on the shadowRoot, this solution looks directly at the childNodes of the
   host node. 
2. This requires a custom method to identify Slottables grouped under different `slot` attributes/name strings.
3. This mixin also will then listen for `slotchange` events externally for any chained
   slot elements among the host element childNodes that are not currently mapped internally in the 
   web component, plus add a MutationObserver for changes to the childList to detect slottable, but not
   slotted nodes being altered.

## NoFallbackSlotchange

1. If the element has a shadowRoot, the mixin will at startup locate all the `<slot>` 
   elements within it, in addition to all the slotable groups. If the name of the slot is empty,
   the mixin will use the childNodes of the child as its flatDOM-childNodes.

2. To capture dynamic changes to the childList of slot nodes that are currently showing the fallback
   nodes, a MutationObserver(childList) will be added to all slot elements in this mode.
   
3. This mixin does not capture when a slot element is added to the shadowRoot after setup which do uses 
   its fallback nodes and does not get any transposed nodes.

4. To identify *when* a slot is added to the shadowDOM, a `slotchange` listener is also added on the 
   shadowRoot if it exists.

## Empty set of nodes

If the content of a slot is empty, it triggers a slotchangeCallback

The next solution again will try to fix these problems with these actions:
The function that groups slottables can identify "empty groups".
   An empty group is a contains:
   1. at least one `<slot>` element,
   2. the assignedNodes({flatten: true}) for all the `<slot>` elements is an empty array
   3. if so, these `<slot>` elements can be surrounded by whitespace, but nothing else.

## alter the name of a slot to allow for GentleMom principle

3. FallbackNodesFallout: If the content of a slot is empty, it hides the fallback childNodes.



## References

 * 