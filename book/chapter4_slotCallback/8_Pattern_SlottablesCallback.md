# Pattern: SlottablesCallback

The SlottablesEvent free us from the `shadowRoot`. It also alerts us about Slottables that are not
can be slotted, but not yet are. It also avoids SlotchangeSurprise and PrematureSlotchange problems.
It filters out SlotchangeNipSlips.

But, we would like to add initial FallbackSlotchange events. Thus, we make a 
`slotCallback(slot)` for `slottables-changed` events. 
We don't add the second argument `fallbackMode` in this mixin
as it can be checked from inside using `slot.assignedNodes().length === 0`

```javascript
import {SlottablesEvent} from "SlottablesEvent.js";

function setup(el){
  if (!el.shadowRoot)
    return;
  const slots = el.shadowRoot.querySelectorAll("slot");
  for (let slot of slots) 
    slots.assignedNodes().length === 0 && el.slotCallback(slot);
}

export function SlottablesCallback(base) {
  return class SlottablesCallback extends SlottablesEvent(base) {
    constructor() {
      super();
      this.addEventListener("slottables-changed", e => this.slotCallback(e.detail.slot));
      // const cb = () => setup(this);                                       //todo test that i can do this with arrow functions.
      Promise.resolve().then(()=> Promise.resolve().then(()=> setup(this))); 
    }
  }
}
```

## Demo: SlottablesEvent

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

  import {SlottablesCallback} from "../../src/slot/SlottablesCallback.js";

  class GreenFrame extends SlottablesCallback(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const templ = document.querySelector("template").content.cloneNode(true);
      this.shadowRoot.appendChild(templ);
    }
    
    slotCallback(slot){
      console.log(slot);
      console.log("FallbackMode: ", slots.assignedNodes().length === 0);
    }
  }

  customElements.define("green-frame", GreenFrame);

  setTimeout(function () {
    const two = document.querySelector("#two");
    two.innerHTML = "";
    const one = document.querySelector("#one");
    one.innerHTML = "<green-frame id=\"four\"></green-frame>";
  }, 1000);
</script>
<green-frame id="one"></green-frame>
<green-frame id="two"><h1>hello sunshine</h1>¯\_(ツ)_/¯</green-frame>
<green-frame id="three"><h1>hello sunshine</h1><h2 slot="nowYouSeeMe"></h2>¯\_(ツ)_/¯</green-frame>

<pre>
two {slot: slot}
three {slot: slot} 
three {slot: Slottables} 
two {slot: slot} 
one {slot: slot} 
//it should print #one and #four, in fallback mode since.
</pre>
```

`slottablesCallback` triggers when the element starts with its fallback nodes.

`slottablesCallback` does not handle:
1. when a slot element is dynamically added to the shadowRoot after setup, *and* this `<slot>` uses
   its fallback nodes by default.
2. when the childNodes of a slot element in fallbackMode is dynamically altered.

## References

 * 
