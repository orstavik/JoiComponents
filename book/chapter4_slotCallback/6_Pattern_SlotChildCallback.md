## Pattern: SlotChildCallback

> todo rename "flattened DOM" to monoDOM.

[Problem: NoFallbackSlotchange](../chapter3_slot_matroska/6_Problem_NoFallbackSlotchange)
illustrate that we need an initial `slotchange` events even for `<slot>` elements
whose initial state is to show its fallback `.childNodes`. 

## Implementation: `SlotChildMixin`

The `SlotChildMixin` slightly alters the check of the `Slotchange`. Instead of filtering out
`<slot>` elements based on their assignedNodes being empty, the `SlotChildMixin` triggers them
regardless at startup. To aid the developer in knowing whether or not the slot is in fallback mode,
a second boolean parameter `fallback` is added to the callback.

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
  slot && this.slotCallback(slot, slot.assignedNodes().length === 0);       //change One
}

function setupElements() {
  for (let el of constructedElements) {
    el.shadowRoot.addEventListener("slotchange", doCallSlotCallback.bind(el));
    let slots = el.shadowRoot.querySelectorAll("slot");
    for (let slot of slots)
      el.slotCallback(slot, slot.assignedNodes().length === 0);             //change Two
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

The `slotCallback(slot, fallbackMode)` is not triggered by the `SlotChildMixin` when:
1. `<slot>` elements are added to the shadowDOM after the element is instantiated, nor 
2. if the `.childNodes` of a `<slot>` element being changed dynamically from JS.

However, such dynamic changes of the shadowDOM should only be performed from within the web
component itself. And, from this imperative standpoint, the developer has access to both the
web component itself and the `slot` and `fallbackMode` arguments, thus simply being able to
assess whether or not the `slotCallback(slot, fallbackMode)` needs to be triggered and if so to 
trigger it.

Furthermore, to capture dynamic changes to the `.childNodes` of a `<slot>` element that is in 
`fallbackMode`, the `SlotChildMixin` would need to add a `MutationObserver(childList)` to each 
`<slot>` element. This `MutationObserver(childList)` can be turned on or off as the `<slot>` element 
goes into and out of `fallbackMode`. However, I don't consider this a good solution: 
1. it will be quite costly, both in complexity and performance; and
2. to alter the `.childNodes` of a `<slot>` element is not a good practice, either: 
   * the web component should alter a `<slot>` element dynamically, or 
   * alter the `<slot>` element using its transposed nodes.

## Demo: SlotChildCallback

```html
<template>
  <style>
    div { border: 4px solid green; }
  </style>
  <div>
    <slot>Hello sunshine</slot>
  </div>
</template>

<script type="module">

  import {SlotchangeMixin} from "../../src/slot/SlotChildMixin.js";

  class GreenFrame extends SlotchangeMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const templ = document.querySelector("template").content.cloneNode(true);
      this.shadowRoot.appendChild(templ);
    }

    slotchangeCallback(slot, fallbackMode){
      console.log(this.id, fallbackMode, slot);
    }
  }

  customElements.define("green-frame", GreenFrame);

  document.addEventListener("DOMContentLoaded", function () {
    const two = document.querySelector("#two");
    two.innerHTML = "";
  });
</script>
<green-frame id="one"></green-frame>
<green-frame id="two">¯\_(ツ)_/¯</green-frame>
```

## Trick: `setupCompleted()` callback

Sometimes, we need a callback that is always triggered *after* the web component's:
1. `constructor()`, 
2. the initial Custom Element Reactions, ie. possibly (multiple) `attributeChangedCallback(...)` 
   and possibly a `connectedCallback()`, 
3. the initial `slotchange` events has passed, and
4. `slotchangeCallback(..)` or similar.

To setup such a callback simply delay the functionality in a double, nested async callback in the 
`constructor()`:

```javascript
class WebComponent extends HTMLElement {

  constructor(){
    super();
    const setupCompleted = this.setupCompleted.bind(this);                //Att!! You cannot inline this variable!!
    Promise.resolve().then(() => Promise.resolve().then(setupCompleted)); //Att!! Do not make this into a single line!!
  }
  
  setupCompleted(){
    //this method will run soon after the element has completed its setup.
  }
}  
```
 
Such a `setupCompleted()` callback is very simple to set up. `slotChildCallback(null)` is therefore
not triggered if there are no `<slot>` elements in the shadowDOM initially.

## References

 * 
                                  