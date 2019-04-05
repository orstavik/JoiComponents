## 3. Slottables, not slotted

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
4. To identify *when* a slot is added to the shadowDOM, a `slotchange` listener is also added on the 
   shadowRoot if it exists.


X. This mixin does not capture when a slot element is added to the shadowRoot after setup which do uses 
   its fallback nodes and does not get any transposed nodes.

# Theory: Slottables vs. Slotted

(a change in) Slottables, ie. CanBeSlotted, reflects an external state (change). 
(a change in) Slotteds, ie. HasBeenSlotted, reflects an internal state (change). 

Lifecycle callbacks reflect external state changes that the web component can opt in to react to.


## References

 * 
