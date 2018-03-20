#A discussion of _slotchange_ based on .childrenChangedCallback        

### What can we use _slotchange_ for in addition to its use in .childrenChangedCallback?

1) Use-case: observe slotchanges of all descendants in the lightDOM. 
Observations of both "normal grandchildren" and "slotted grandchildren" should be done sparsely. 
It would be very costly if every element would observe changes to its descendants. 

2) Use-case: observe slotchanges of children in the shadowDOM. This is needed and not covered by the
.childrenChangedCallback( ... ) 

3) Use-case: observe slotchanges of all descendants in the shadowDOM. 

4) Requirement: Should actions in response to slotchanges be queued in the event loop as opposed to the microtask que? Here
there might be performance considerations I am not familiar with. But in any case, this breaks the concept that
visible children be treated equally since MutationObserver( reactFunc ).observe({childList: true}) will que its
listening reactFunc in the microtask que.                             

5) Requirements: other platform considerations?


##### Observeration of grandchildren and shadowDOM elements
Listening for all such "slotted children changes" can cause confusion. 
If you have more than one slotted grandchild, or slots in both shadowDOM and lightDOM, a slotchange event from 
one such slot might be confused with the slotchange event from another slot 
(todo check if slotchange passes shadowRoot borders/composed: true).
Because of the cost in developer complexity, it would be good practice for the developer to pinpoint 
the elements from where childChanges can occur. 
Currently, the slotchange event is the only API to observe such changes at the moment, 
but it would be less confusing to _when observing slotchange events, first identify which slot element is to be observed, and then add a callback function to that precise element_.
This would apply to use-cases 1 and 2 both.

### Preliminary conclusion                                           
If a) a proper observation mechanism of "visible children" changes 
is implemented as either an HTMLElement callback or an option in 
MutationObserver, and b) a .onSlotChange(callbackFunc) or similar is 
implemented on the HTMLSlotElement, the slotchange event has few other use-cases. 
