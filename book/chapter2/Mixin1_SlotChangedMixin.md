# Mixin: SlotChanged

The `SlotChangedMixin` adds a reactive method `.slotchangedCallback()` to the custom element.
The `.slotchangedCallback()` method is triggered every time:
* the element connects to the DOM, 
* the `.assignedNodes()` of one of the slot elements in the shadowDOM of the element changes.

The `.slotchangedCallback()` method is NEVER triggered twice for the same assigned nodes.
This harmonizes the behavior between Chrome and Safari.
The mixin ignores any redundant slot within the element (as they will not be assigned any nodes neither). 

The signature of the callback is `.slotchangedCallback(slot, newAssignedNodes, oldAssignedNodes)`.
* `slot` is the particular slot element whose assigned nodes is initialized or has changed.
* `newAssignedNodes` are the newly assigned nodes. 
* `oldAssignedNodes` are the previously assigned nodes, undefined when first initialized.

> ATT!! `newAssignedNodes` and `oldAssignedNodes` are both the complete set of DOM nodes.
This means that HTML comments and text nodes, not just element nodes, are included in the lists.

### `this.updateSlotListeners()`
The problem with the SlotchangedMixin is that:
* if the content of the shadowDOM of the custom element (`this.shadowRoot`) is altered 
* *while* the custom element is connected to the DOM
* in such a way that a `<slot>` element under `this.shadowRoot` is either added or removed 
(or replaced by an identical element)                    
* *then* a custom method **`this.updateSlotListeners()`** must be called on 
the custom element with `this.shadowRoot`
* so that the `SlotchangedMixin` can attach new event listeners for `slotchange` events,
* and remove unnecessary event listeners.
* This will trigger a `slotchangedCallback()` for any new `<slot>` elements attached,
* and this is necessary for the custom element to be able to continue to 
listen for all `slotchange` events from within its shadowDOM.

> ATT!! if you alter the shadowDOM and forget to call `updateSlotListeners()`, 
the mixin fails without warning.

If only.. the `slotchange` event bubbled like the specification says.
If so, `this.updateSlotListeners()` would not be needed.
Instead, the `slotchange` event listener could be attached to the `this.shadowRoot` 
which would remain unchanged.
But, the reality is that `slotchange` does not bubble in neither Chrome and Safari. 
So we must continue to listen for `<slot>` node directly.

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
    
    slotchangedCallback(slot, newAssignedNodes) {            //[1]
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
If there are more than one `<slot>` element that one needs to distinguish between, 
the first argument `slot` of the callback method can be used.

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
