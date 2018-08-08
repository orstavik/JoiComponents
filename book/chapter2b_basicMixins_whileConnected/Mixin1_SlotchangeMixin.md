# Mixin: Slotchange

The `SlotChangedMixin` adds a reactive method `.slotchangedCallback()` to the custom element.
The `.slotchangedCallback()` method is triggered every time:
* the element connects to the DOM for the first time, and then when
* the `.assignedNodes()` of one of the slot elements in the shadowDOM of the element changes.

If several `<slot>`s are changed at the same time, the `.slotchangedCallback()` will be
called several times, once per `slotName`.

The `.slotchangedCallback()` method is NEVER triggered twice for the same assigned nodes.
This harmonizes the behavior between Chrome and Safari.
Duplicate `<slot>` elements with the same `name` attribute are ignored 
as they will never be assigned any nodes. 

The signature of the callback is `.slotchangedCallback(slotName, newAssignedNodes, oldAssignedNodes)`.
* `slotName`, the `name` of the slot whose assigned nodes have changed/initialized.
* `newAssignedNodes` are the newly assigned nodes.
* `oldAssignedNodes` are the previously assigned nodes, undefined when first initialized.

> ATT!! `newAssignedNodes` and `oldAssignedNodes` are both the complete set of DOM nodes.
This means that HTML comments and text nodes, not just element nodes, are included in the lists.

There are two approaches to implement `SlotchangeMixin`: 
`StaticSlotchangeMixin` and `SlotchangeMixin`.

## `StaticSlotchangeMixin`
[`StaticSlotchangeMixin`](../../src/StaticSlotchangeMixin.js) 
implements a strategy that listens for `slotchange` events inside 
the shadowDOM only, the most intuitive approach.
At `connectedCallback()`-time, the `StaticSlotchangeMixin` will discover any `<slot>`
elements inside it, add `slotchange` event listeners on those `<slot>` elements and trigger 
a `slotchangedCallback(...)` for each `slotName` at `firstConnectedCallback()`-time and thereafter 
whenever the `.assignedNodes()` of one of those `<slot>`s changes.

### Problem: `this.updateSlotListeners()`
But. There is a problem with `StaticSlotchangedMixin`.
* If the content of the custom element's `shadowRoot` is altered,
* **while** the custom element is **connected** to the DOM,
* so as to **add or remove a `<slot>` element** under `this.shadowRoot`,
* then a custom method **`this.updateSlotListeners()` must be called** on 
the custom element,
* so that the `StaticSlotchangedMixin` can attach new event listeners for `slotchange` events,
* and remove unnecessary event listeners.
* `updateSlotListeners()` will trigger a `slotchangedCallback()` for any new `<slot>`,
* and this is also necessary for the custom element to be able to continue to 
listen for future `slotchange` events in its shadowDOM.

> ATT!! if you alter the shadowDOM and forget to call `updateSlotListeners()`, 
StaticSlotchangeMixin can fail without warning.

**If only..** the `slotchange` event bubbled like the specification says.
If so, the `slotchange` event listener could be attached to the `this.shadowRoot`,
which would remain constant, and `this.updateSlotListeners()` would not be needed.
But, the reality is that `slotchange` does not bubble in neither Chrome nor Safari. 
So we must continue to listen for `<slot>` node directly and `updateSlotListeners()`.

Or.. we could employ a different strategy to observe `slotchange` events. Enter `SlotchangeMixin`.

## `SlotchangeMixin`
[`SlotchangeMixin`](../../src/SlotchangeMixin.js) 
implements a different strategy to observe `slotchange` events.
Instead of attaching event listeners for `slotchange` events on the `<slot>` elements 
inside the `shadowRoot`, `SlotchangeMixin` instead **observes the `childNodes` of the
`host` node** in the lightDOM using `MutationObserver`. `SlotchangeMixin` then categorizes 
these nodes by `slot`-attributes,
and then in addition attaches `slotchange` listeners to any chained `<slot>` element child nodes
of its `host` element. Phu.. Its a mouthful.

However, although the implementation is a little less intuitive, 
both `SlotchangeMixin` and `StaticSlotchangeMixin` function identically. 
Except for one, beautiful little difference: `SlotchangeMixin` is dynamic! 
Since the `host` node remains constant while the custom element is connected to the DOM,
the `MutationObserver` that listens for changes in its childNodes *never needs to be updated*.
And so the custom element who extends `SlotchangeMixin` can change and update its
`shadowRoot` and its `<slot>` elements without ever needing to worry about `this.updateSlotListeners()`.

## Example: `<red-frame>` using `SlotchangeMixin`

In this example we remake the `<red-frame>` `SlotchangeMixin`.

```html
<script type="module">

  import {SlotchangeMixin} from "./SlotchangeMixin.js";

  class RedFrame extends SlotchangeMixin(HTMLElement) {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     
      this.shadowRoot.innerHTML =                   
        `<style>
          :host {
            display: inline-block;
            border: 10px solid red;
          }                                                                              
        </style>
        <div id="count"></div>               
        <slot></slot>`;                     
    }
    
    slotchangedCallback(slotName, newAssignedNodes) {            //[1]
      const div = this.shadowRoot.getElementById("count");
      div.innerText = newAssignedNodes.length;
    }
  }
  customElements.define("red-frame", GreenFrame);
</script>

<red-frame>                                      
  <img src="tomato.jpg" alt="tomato">
  <img src="strawberry.jpg" alt="strawberry">
</red-frame>

<script>
  setTimeout(function(){
    const cherry = document.createElement("img");
    cherry.src = "cherry.jpg";
    cherry.alt = "cherry";
    document.querySelector("red-frame").appendChild(cherry); 
  }, 2000);
</script>
```
1. All the functionality of efficiently and harmonically listening for `slotchange` events
are encapsulated in `SlotchangeMixin`.
If you need to distinguish between different `<slot>` elements, 
use the first argument `slotName` of the callback method.

## References
* https://github.com/webcomponents/gold-standard/wiki/Content-Changes
* https://github.com/webcomponents/gold-standard/wiki/Content-Assignment
* https://github.com/webcomponents/gold-standard/wiki/Detachment                                  
* https://www.polymer-project.org/2.0/docs/devguide/shadow-dom#observe-nodes
* https://www.polymer-project.org/2.0/docs/api/classes/Polymer.FlattenedNodesObserver
* https://github.com/w3c/webcomponents/issues/493#issuecomment-218077582
* https://dom.spec.whatwg.org/#mutation-observers
* https://github.com/whatwg/dom/issues/126
 
## Acknowledgments
Many thanks to Jan Miksovsky and the Elix project for input and inspiration.

TODO: Add StaticSetting `excludeSlot(){ return ["slotNameToBeExcluded", "excludeMeTo"];}`?