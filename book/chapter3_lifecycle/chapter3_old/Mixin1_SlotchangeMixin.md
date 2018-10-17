# Mixin: Slotchange

The `SlotchangeMixin` adds a reactive method `.slotchangeCallback()` to the custom element.
The `.slotchangeCallback()` method is triggered every time:
* the `.assignedNodes()` of one of the slot elements in the shadowDOM of the element changes
(initiated by `slotchange` events), and
* at the first `AnimationFrame` after an element was constructed
   * when the slot has no assigned nodes and 
   * in Safari when an initial `slotchange` event should, but is not dispatched.
   
If several `<slot>`s are changed at the same time, the `.slotchangedCallback()` will be
called several times, once per `slotName`.

The `.slotchangedCallback()` method is NEVER triggered twice for the same assigned nodes.
Duplicate `<slot>` elements with the same `name` attribute are ignored 
as they will not be assigned any nodes. 

The signature of the callback is `.slotchangedCallback(slotName, newAssignedNodes, oldAssignedNodes)`.
* `slotName`, the `name` of the slot whose assigned nodes have changed/initialized.
* `newAssignedNodes` are the newly assigned nodes.
* `oldAssignedNodes` are the previously assigned nodes, undefined when first initialized.

`SlotchangeMixin` caches the assigned nodes for each `slotchangeCallback(...)`
so that no duplicate calls to the `slotchangeCallback(...)` is triggered.

> ATT!! `newAssignedNodes` and `oldAssignedNodes` are both the complete set of DOM nodes.
This means that HTML comments and text nodes, not just element nodes, are included in the lists.

## Implementation issues with `SlotchangeMixin`

[`SlotchangeMixin`](../../../src/slot/SlottableMixin.js) 
listens for `slotchange` events on the `.shadowRoot` of the custom element.
To achieve this efficiently, `SlotchangeMixin` assumes that the custom element 
creates an "open" `.shadowRoot` in the *constructor()*.
If this `.shadowRoot` is later removed, if only temporarily,
the `.slotchangeCallback(...)` will stop working.
If the `.shadowRoot` is attached in "closed" mode,
the element will not work (cf. [Closed shadowRoot](../../chapter1/HowTo_closed_shadowRoot.md)).

A second issue is that `SlotchangeMixin` does not trigger `.slotchangeCallback(...)`
if there is no `<slot>` element for that slot name inside the `.shadowRoot`.
This means that `.slotchangeCallback(...)` cannot be used to create appropriate
`<slot>` elements "as needed".

A third issue with `SlotchangeMixin`, is that when `<slot>` elements are added dynamically 
to the shadowRoot, Chrome and Safari will trigger a `slotchange` event, while Safari will not.
To solve this problem in Safari, `.triggerSlotchangeCallbackManually(slot)` can be used.

### Guidelines for `SlotchangeMixin`
 * call `this.attachShadow({mode: "open"});` in the constructor of the element that uses it.
 * do not remove the `.shadowRoot` from the element at any time.
 * do not add `<slot>` elements to the shadowRoot.

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