# Mixin: ChildrenChange

## External vs. internal stimuli
The reason `SlotchangeMixin` is unaffected by the presence of `.shadowRoot` and `<slot>` elements,
is that it reacts only to **outside** stimuli.
`SlotchangeMixin` only triggers `slotchangeCallback(...)` when a *potentially slottable* element
has been added or removed (and the first time the element connects to the DOM).

This does mean that `slotchangeCallback(...)` is **NOT** triggered:
 * when a new `<slot>` element is added to the shadowDOM, 
 * that results in new slotted elements being transposed to the flattenedDOM.

This goes counter to `slotchange` event semantic. 
However. Changes of the shadowDOM should be done within the custom element.
And so it would be clearer to call functions that should trigger after such a change from the same place 
where the shadowDOM is changed, instead of indirectly triggering the same functions via a callback.
Changes of *potentially slottable* nodes however are not driven from inside the element and 
thus is well served triggered from a callback.

On the other side, `slotchange` and `ShadowSlotchangeMixin` are triggered from inside the element.
This requires the element to have a shadowRoot and corresponding `<slot>` elements.
And this means that *both* *internal* changes the element itself triggers callbacks/events
(which you likely do not need and thus need to disregard) *and* *external*
changes (which you likely need to be notified of/react to).
But *not all* external changes of *potentially slottable* nodes are triggered.

It is my opinion that for web components externally initialized changes of *potentially slottable* 
elements is what the element needs to be notified of in many use-cases.
`slotchange` means *only actually slotted elements from the inside*. 
But it should mean *all potentially slottable elements from the outside*.

## `SlotchangeMixin`
[`SlotchangeMixin`](../../../../../src/slot/SlottableMixin.js) 
implements a different strategy to observe `slotchange` events.
Instead of attaching event listeners for `slotchange` events on the `.shadowRoot`, 
`SlotchangeMixin` uses `MutationObserver` to **observe the `childNodes` of the `host` node**.
`SlotchangeMixin` then categorizes these nodes by `slot`-attributes,
and then in addition attaches `slotchange` listeners to any chained `<slot>` element child nodes
of its `host` element. Phu.. Its a mouthful.

However, although the implementation is a lot less intuitive, 
both `SlotchangeMixin` and `ShadowSlotchangeMixin` function similarly. 
Except for one small, but beautiful little difference: 
`SlotchangeMixin` reacts to external, not internal stimuli.
                                                                                  
## Example: `<red-frame>` using `SlotchangeMixin`

In this example we remake the `<red-frame>` `SlotchangeMixin`.

```html
<script type="module">

  import {SlotchangeMixin} from "./SlottableMixin.js";

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

<!--


If you 
that `SlotchangeMixin.slotchangeCallback(...)` better serves the needs of a custom element
whereas `slotchange` and `ShadowSlotchangeMixin` is better suited for   
`slotchangeCallback(...)` reacts to changes in the environment of the custom element, 
not changes that can be affected from within the shadowDOM.
This means that `slotchangeCallback(...)` will not necessarily trigger when you add or remove `<slot>`
elements inside the shadowDOM. 
Changes of the shadowDOM of an element thus cannot trigger `slotchangeCallback(...)`.
But, at the same time, the `slotchangeCallback(...)` gives you you are not dependent on any 

As changes inside the element does not affect which elements 
are currently *slottable*, `slotchangeCallback(...)` does not trigger.

`slotchange` event reacts to changes from within the shadowDOM of the element.
If there are no `<slot>` that correspond to the slot name that changes, or
no `<slot>` element at all, then no `slotchange` event neither.

This is 

If you add a `<slot>` element inside the shadowDOM,
and then connect that element or another `<slot>` element with the same `name` attribute back into the shadowDOM,
then `slotchangeCallback(...)` will not be triggered, whereas a `slotchange` event should be triggered
in Chrome (and maybe Safari, I don't know).

When the missing initial `slotchange` event in Safari is triggered, then the caching of 
previously `assignedNodes` for each slot name can be skipped, and that will enable such
changes of the shadowDOM to trigger `slotchangeCallback(...)` too.
As of right now, the solution is just to know that if you remove and then add `<slot>` elements
inside the shadowDOM, that will not trigger `slotchangeCallback()` unless the values have actually 
changed. As such changes should be done from within the component, both solutions are 
-->