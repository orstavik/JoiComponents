## Benefits of `<I-VAR>`: Ergonomic

1. A simpler model of resolving assigned nodes.
   The value of a `<I-VAR>` in the flattened DOM will now *always* replace the content of the `<I-VAR>` node,
   regardless if the nodes are dynamically assigned or fallback value.
   This means that assigned and fallback nodes can be understood as equal in all cases.

2. No slotchange event, no slotchange event bubbling. 
   Only a varCallback.
   This means that the event/callback method in a custom element that holds a VAR will 
   always be local to that element.
   
3. Proper CSS style encapsulation for slotted nodes.
   If a mediating custom element wishes to style slotted content that it mediates,
   it has to do so by styling the custom element into which it passes the slotted content.
   
4. The flattened DOM can be perceived as replacing the content of all `<I-VAR>` elements.

5. Clarifies the fact that `<SLOT>` is an HTML variable. 
   That can be declared (with or without a value).
   And that are dynamically reassigned.
   
6. The (fallback) .content of the `<I-VAR>` is expected not to change.
   The document fragment that is under the `<I-VAR>` can be changed, but these changes will not
   trigger a varCallback.
   This is in line with the concept of the varCallback as any changes of that fallback content should be done from 
   Adding a child node to the `<SLOT>` element will not trigger a slotchange event.
   within the custom element itself (thus making it simple to manage proactively, instead of reactively).
   This behavior is made more evident with the TEMPLATE characteristics of the `<I-VAR>` childNodes.

## Benefits of `<I-VAR>`: efficiency

1. The child nodes of `<SLOT>` elements function as fallback value when no assigned elements are attached.
   This means that if there always are assigned elements to an element, 
   these child nodes should never be active in the flattened/visible DOM.
   By parsing these elements directly into the .content property of the `<I-VAR>`, instead of into the DOM as with `<SLOT>`,
   instantiating work on these nodes when not used can be avoided.

2. There is no middle step into slotchange events. 
   `varCallback` are triggered by the MutationObserver directly, 
   and by direct methods from one `<I-VAR>` to another `<I-VAR>` element that are registered as its chained parent.
   
3. The flatten assigned nodes (ie. the resolution of HTML variables) is streamlined and simplified.
   This will not have a dramatic impact per se.
   But simplicity in variable resolution is critical when more complex models for efficiency 
   will be created later.

4. With slottablesChanged instead of slotchange, the event is triggered on the level of the lightDOM instead
   of at the level of shadowDOM. This reduces the algorithmic work with one level, for all traversal.
   2 levels become 1. 3 levels become 2. etc. As most such events are low level, this should reduce the traversal somewhat.

5. Performance drawback. slotchange does not trigger when the slottables cannot be assigned to a slottable node.
   slottables will. If this is significant, a StaticSetting method `static get observedSlots() return ["", "slotName1"];`
   can be added. If no such setting is set, then all slottables are observed.
   But. This is very likely not necessary. If an app slots in tons of elements that are not used,
   and has no need for a varCallback, this is not an issue that should be solved with the slottables callback.

## Style considerations


Todo In the flattened DOM the `<I-VAR>` node would be converted into a #documentFragment.
     Assigned nodes would be attached to it. Or, the end `<I-VAR>` could remain, to comply with CSS rules.
     No, I think not. Using a #documentFragment would create a CSS border between the original elements and the
     element into which it is slotted. This would enable a simpler rule slot[name="whatever"]:assigned
     rules to be transfered wholesale into the document fragment of the VAR.
     Or that regular CSS rules that applied to the VAR would be transfered into the stylesheet of the documentFragment.

1. Regular CSS rules.
   The childNodes of `<I-VAR>` would be styled as childNodes of TEMPLATE today.
   This is similar to how childNodes of `<SLOT>` are styled today, 
   with the exception that styles attributed to the `<SLOT>` itself are not inherited.
   
   The childNodes start from a new document root, but this document root has the same CSS rules defined 
   as the root in which the template/var is defined.

2. The ::slotted(*) CSS rules will now apply equally to assigned nodes and `<I-VAR>`.content nodes.
   Var.content nodes that gets into the slotted position will be treated as ::slotted.

3. In `<SLOT>`s, regular inheritable CSS properties of a `<SLOT>` in a mediating custom element will 
   affect slotted content.
   This effect is very elusive, makes the model of style encapsulation for slotted content very vague.
   For by far the majority of developers, this feature will function as style creep (benefitial or not),
   and not a predictable feature. 
   (A mediating custom element is a custom element who places its `<SLOT>`/var
   element in the slottable position of another custom element).
   
The I-VAR stands for "Internet VARiable". The proposal was originally for an HTML element named VAR,
but as this element name has already been used in the HTML standard, I-VAR or IVAR seems the next 
obvious alternative. 