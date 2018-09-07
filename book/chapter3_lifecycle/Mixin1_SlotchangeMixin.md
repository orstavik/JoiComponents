# Mixin: Slotchange

The `SlotChangeMixin` adds a reactive method `.slotchangeCallback()` to the custom element.
The `.slotchangeCallback()` method is triggered every time:
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
`ShadowSlotchangeMixin` and `SlotchangeMixin`.

## `ShadowSlotchangeMixin`
[`ShadowSlotchangeMixin`](../../src/ShadowSlotchangeMixin.js) is the most intuitive approach.
`ShadowSlotchangeMixin` listens for `slotchange` events inside the shadowDOM.
When `isConnected` the `StaticSlotchangeMixin` will:
 * add `slotchange` event listeners on the `.shadowRoot` property,
 * and `triggerInitialSlotchange()` to ensure that the initial `slotchange` event 
currently missing in Safari is compensated.

`StaticSlotchangeMixin` caches the assigned nodes for each `slotchangeCallback()`
so that no duplicate calls to the `slotchangeCallback()` will occur.

The main problem with `ShadowSlotchangeMixin` is that it assumes the presence of `.shadowRoot`
and one or more `<slot>` elements. 
But, there are several scenarios where `.shadowRoot` or `<slot>` element is not available:
1. the `.shadowRoot` is attached in "closed" mode (cf. [Closed shadowRoot](../chapter1/HowTo_closed_shadowRoot.md)),
2. the custom element does not include a `.shadowRoot` or `<slot>` element,
but would still like to be notified of slottable children changes, or
3. the custom element is temporarily removing its `.shadowRoot` or `<slot>` element for some reason.

If the custom element at any point gets connected or disconnected to the DOM while it 
does not have a `.shadowRoot` property, `ShadowSlotchangeMixin` will throw an Error.

If your custom element has a constant, "open" `.shadowRoot`, 
`ShadowSlotchangeMixin` is the way to go.
 
## `SlotchangeMixin`
[`SlotchangeMixin`](../../src/SlotchangeMixin.js) 
implements a different strategy to observe `slotchange` events.
Instead of attaching event listeners for `slotchange` events on the `.shadowRoot`, 
`SlotchangeMixin` uses `MutationObserver` to **observe the `childNodes` of the `host` node**.
`SlotchangeMixin` then categorizes these nodes by `slot`-attributes,
and then in addition attaches `slotchange` listeners to any chained `<slot>` element child nodes
of its `host` element. Phu.. Its a mouthful.

However, although the implementation is a lot less intuitive, 
both `SlotchangeMixin` and `ShadowSlotchangeMixin` function similarly. 
Except for one small, but beautiful little difference: 
`SlotchangeMixin` tackles a missing `.shadowRoot`! 
                                         
## Difference between `slotchangeCallback()` and `slotchange`
There is one remaining difference between `slotchangeCallback()` and `slotchange`.
If you remove a `<slot>` node from the shadowDom, and then add a new (or the same)
`<slot>` node with the same `name` attribute to the shadowDom again at a later point,
and the nodes that was assigned to the removed slot node equals the nodes that is assigned to the new slot node,
then a new `slotchange` event should be triggered, but due to the caching of values, the `slotchangeCallback()`
will not trigger.
When the initial slotchange event is added to Safari and thus removing the need to cache `slotchange` values,
then caching can be removed in `slotchangeCallback()` and these two differences harmonized.

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