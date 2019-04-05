# Pattern: MySlotCallback

As described in SlotchangeNipSlip, `slotchange` propagate across shadowDOM borders from outside
`<slot>` elements. ((We can say that these events are `{composed: false, despmoc: true}`))
Some of these reverse-composed `slotchange` events are relevant and should trigger a `slotCallback()`,
ie. `slotchange` events from directly chained `<slot>` elements. 
But, some of these events are irrelevant and should be discarded, ie. SlotchangeNipSlips. 

In this upgrade of NaiveSlotCallbackMixin, the MySlotCallbackMixin, for all `slotchange` events,
we therefore find the "in-house" `<slot>` element in the composed path and filter out 
SlotchangeNipSlips at the same time. We use the `notNipSlip(..)` function to do this.
Additionally, we alter the argument of our `slotCallback(slotElement)` to be the nearest 
`<slot>` element instead of the `slotchange` event.

## `MySlotCallbackMixin`

```javascript
const slotchangeListener = Symbol("slotchangeListener");

function notNipSlip(composedPath, shadowRoot){
  for(let node of composedPath){
    if (node.tagName !== "SLOT")
      return null;
    if (node.getRootNode() === shadowRoot)
      return node;
  }
  return null;
}

function callSlotCallback(slotchange){
  const slot = notNipSlip(slotchange, this.shadowRoot);
  slot && this.slotCallback(slot);
}

export function SlotCallbackMixin(base) {
  return class SlotCallbackMixin extends base {
    
    constructor(){
      super();
      this[slotchangeListener] = callSlotCallback.bind(this)
    }
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      this.shadowRoot.addEventListener("slotchange", this[slotchangeListener]);
    }    
    disconnectedCallback(){
      super.disconnectedCallback && super.disconnectedCallback();
      this.shadowRoot.removeEventListener("slotchange", this[slotchangeListener]);
    }    
  }
}
```
This can be run and tested in this demo:

> todo replace this demo with the NipSlip demo.

```html
<script type="module">

import {SlotCallbackMixin} from "../../src/MySlotCallbackMixin.js";

class GreenFrame extends SlotCallbackMixin(HTMLElement){
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
    <style>
    div {
      border: 4px solid green;
    }
    </style>
    <div><slot>picture this!</slot></div>
    `;
  }
  
  slotCallback(slotchange){
    console.log(slotchange);
  }
}
customElements.define("green-frame", GreenFrame);
</script>

<green-frame></green-frame>

<script >
setTimeout(function(){
  document.querySelector("green-frame").innerText = "Hello sunshine!";
}, 1000);
</script>
```
This SlotCallbackMixin solves the SlotchangeNipSlip problem and gives us the relevant `<slot>`
element as argument. But, most problems are still left unsolved.

## References

 * 