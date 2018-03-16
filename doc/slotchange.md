#An argument against _slotchange_
### What is the "visible child" of an HTMLElement
Using \<slot> is a way to declaratively in the HTML arrange html components at
composition time of multiple components, as opposed to at creation time of each 
and every component. But, outside of HTML, a slotted child and a normal child 
should in most cases be treated equally. A slotted child is primarily "just a child":
it looks that way on screen, and should act that way in the DOM js environment too.
Only very rarely, and more often in a platform context than an app context, 
does a developer need to know if the change of a visible
child was slotted, as opposed to a direct change of the DOM.
   
So, we need a new word: "visible children" of an HTMLElement are 
_both_ "normal .children" (.children) _and_ "slotted children" (.assignedNodes()).
The "visible children" is a list of the "normal .children" where 
the slot elements has been replaced with the .assignedNodes() of those slot elements.
In most cases where we talk about "children" we are thinking about these 
"visible children" and not _just_ the "normal children".

cf. gold standard??
cf. https://www.polymer-project.org/2.0/docs/devguide/shadow-dom
cf. https://www.polymer-project.org/2.0/docs/api/classes/Polymer.FlattenedNodesObserver 

### Visible children changes
Currently, the platform provides observation of
 * "normal children" changes through MutationObserver(...).observe({childList: true})
 * "slotted children" changes through the slotchange Event.
 
However, in most cases, when we say "children changed" we refer to "visible children changed". 
We need to observe  changes of both "normal children" and "slotted children". 
To observe such "visible children" changes, one must combine the two methods. 
This is what ChildrenChangedMixin is doing.
Another approach would be to extend MutationObserver to provide something like a "visibleChildList" 
option that would react to any changes of the "visible children".         

### Other requirements of _slotchange_
What use-cases/requirements does the slotchange event facilitate other than observing/reacting to changes 
of an HTMLElement's "visible children" list?

1. Use-case: observe slotchanges of children's children in the lightDOM. Observations of both "normal grandchildren" and
"slotted grandchildren" should be done sparsely. It would be very costly if every element would observe changes to
its descendants. 

2. Use-case: observe slotchanges of descendants in the shadowDOM. 

3. Requirement: Should actions in response to slotchanges be queued in the event loop as opposed to the microtask que? Here
there might be performance considerations I am not familiar with. But in any case, this breaks the concept that
visible children be treated equally since MutationObserver( reactFunc ).observe({childList: true}) will que its
listening reactFunc in the microtask que.

4. Requirements: other platform considerations?

#### Observeration of grandchildren and shadowDOM elements
Listening for all such "slotted children changes" can cause confusion. 
If you have more than one slotted grandchild, or slots in both shadowDOM and lightDOM, a slotchange event from 
one such slot might be confused with the slotchange event from another slot 
(todo check if slotchange passes shadowRoot borders/composed: true).
Because of the cost in developer complexity, it would be good practice for the developer to pinpoint 
the elements from where childChanges can occur. 
Currently, the slotchange event is the only API to observe such changes at the moment, 
but it would be less confusing to _when observing slotchange events, first identify which slot element is to be observed, and then add a callback function to that precise element_.
This would apply to use-cases 1 and 2 both.

### Conclusion 
If a) a proper observation mechanism of "visible children" changes is implemented as either an 
HTMLElement callback or an option in MutationObserver, and b) a .onSlotChange(callbackFunc) or similar is 
implemented on the HTMLSlotElement, the slotchange event could be removed. 
