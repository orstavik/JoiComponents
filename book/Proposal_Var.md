# Proposal: VAR

The `<VAR>` element is a unification of the `<TEMPLATE>` and `<SLOT>` elements.

## Short description
As with the template element, when a VAR element is parsed, 
the child elements are not added to the DOM but instead added under a document fragment that is
set as the .content property of the VAR object. 
This document fragment is accessible from JS.

As with slot, nodes can be assigned to the VAR. 
As with Slot, when a VAR is used inside a shadowDOM, the `.childNodes` of the `.host` node of the 
`.shadowRoot` that is the Var's `.getRootNode()` are the assignable/slottable nodes.
Ie. `slottables = <var>.getRootNode().host.childNodes`

As with slot, slottables with a specified slot attribute (such as `<div slot='name1'>`)
are matched to VAR elements with a corresponding name attribute (such as `<VAR name='name1'>`).
As with slot, if no name or slot attribute is specified, it defaults to empty string.

Differently from slot, if the VAR element has the attribute HIDDEN, no nodes can be assigned to it.
This means that `<VAR id="one" HIDDEN><h1>hello world!</h1></VAR>` functions identically to
`<TEMPLATE id="one"><h1>hello world!</h1></TEMPLATE>`.

Differently from slot, when the assigned nodes of VAR are resolved/flattened, 
the .content nodes (ie. the in template: childNodes) are considered slotted.
They will therefore retain the styles given in their parent document (regular css rules, 
as with slot children today), but also get the ::slotted(*) css rules (differently from slot childnodes)
today.

Differently from slot, there is no `varchange` event.
Instead, custom elements get a new callback method `varCallback(Slottable)`.
The `varCallback` is triggered when a list of assignable/slottable nodes the host node changes 
for a specific slotname.
`varCallback` is also triggered indirectly/recursively: 
1. if one of the assignable/slottable nodes of the host element is itself a var, 
2. and the content of that var changes, 
3. even though the assignable nodes have not changed directly,
4. the flattened content of the assignable nodes will have changed indirectly,
5. and this will trigger a `varCallback`,
6. which is implemented by making any VAR element alert its "parent Var element"
(the VAR element which is chained to it and into which it will slot its content).

Differently from slotchange, an initial `varCallback` for all assignable/slottable nodes
are triggered for all custom element when the element is constructed, always.
`varCallback` is not dependent on a shadowDOM and/or VAR elements.
The initial `varCallback` is triggered PostBatchedConstructor for all custom elements.
PostBatchedConstructor means that if another custom element is still in the process of being constructed,
`varCallback` will be delayed until all elements are ready.
Thus if several custom elements are constructed (as will happen during sync parsing from .innerHTML or
from a custom element constructing a shadowRoot with another custom element in its constructor),
`varCallback` for all custom elements will be delayed until all custom elements have been created and then
run together as a batch.

As with slotchange events, subsequential `varCallback` are triggered after the corresponding time of 
MutationObserver(childList) for the elements.

## Benefits of VAR: efficiency

1. The child nodes of slot elements function as fallback value when no assigned elements are attached.
   This means that if there always are assigned elements to an element, 
   these child nodes should never be active in the flattened/visible DOM.
   By parsing these elements directly into the .content property of the VAR, instead of into the DOM as with slot,
   instantiating work on these nodes when not used can be avoided.

2. There is no middle step into slotchange events. 
   `varCallback` are triggered by the MutationObserver directly, 
   and by direct methods from one VAR to another VAR element that are registered as its chained parent.
   
3. The flatten assigned nodes (ie. the resolution of HTML variables) is streamlined and simplified.
   This will not have a dramatic impact per se.
   But simplicity in variable resolution is critical when more complex models for efficiency 
   will be created later.

## Benefits of VAR: Ergonomic

1. A simpler model of resolving assigned nodes.
   The value of a `<VAR>` in the flattened DOM will now *always* be slotted in,
   regardless if the nodes are dynamically assigned or fallback value.
   This means that assigned nodes can be understood as equal in all cases.

2. No slotchange event, no slotchange event bubbling. 
   Only a varCallback.
   This means that the event/callback method in a custom element that holds a VAR will 
   always be local to that element.
   
3. Proper CSS style encapsulation for slotted nodes.
   If a mediating custom element wishes to style slotted content that it mediates,
   it has to do so by styling the custom element into which it passes the slotted content.
   
4. The flattened DOM can be perceived as being stripped of all slot elements.

5. Clarifies the fact that SLOT is an HTML variable. 
   That can be declared (with or without a value).
   And that are dynamically reassigned.

## Style considerations

1. The regular CSS rules that apply to both slotted elements and VAR child nodes 
   remain the same as today.

2. The ::slotted(*) CSS rules will now apply equally to assigned nodes and VAR.content nodes.

3. In slots, regular inheritable CSS properties of a SLOT in a mediating custom element will 
   affect slotted content.
   This effect is very elusive, makes the model of style encapsulation for slotted content very vague.
   (A mediating custom element is a custom element who places its slot/var
   element in the slottable position of another custom element).
   
### Implement the 'varCallback' as a mixin that uses the SLOT instead of the VAR.

todo:
1. make the new Slottables element both contain both algorithms for flattening.
2. add the BatchedConstructor to the mixin
3. make the varCallback use direct method calls to slot chain instead of slotchange event



## Further suggestions

1. Add onDomContentLoaded/onDocumentReady callback hook to VAR / TEMPLATE. 
   This callback hook would enable VAR / TEMPLATE to implement a below-the-fold solution in a single line.
   
