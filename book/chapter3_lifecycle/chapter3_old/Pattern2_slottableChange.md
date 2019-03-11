# Pattern: SlottableChange

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

