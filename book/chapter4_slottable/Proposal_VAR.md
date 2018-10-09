# Proposal: VAR

The `<VAR>` element is a unification of the `<TEMPLATE>` and `<SLOT>` elements.

Todo In the flattened DOM the `<VAR>` node would be converted into a #documentFragment.
     Assigned nodes would be attached to it. Or, the end `<VAR>` could remain, to comply with CSS rules.
     No, I think not. Using a #documentFragment would create a CSS border between the original elements and the
     element into which it is slotted. This would enable a simpler rule slot[name="whatever"]:assigned
     rules to be transfered wholesale into the document fragment of the VAR.
     Or that regular CSS rules that applied to the VAR would be transfered into the stylesheet of the documentFragment.

## Motivation

1. Only process `slotchange` events inside the custom element whose `shadowRoot` contain the slot.
   `slotchange` is a private matter between a custom element and its `<SLOT>` elements.
   Enable such direct `slotchange` events to also trigger on changes to the flattened structure (`assignedNodes({flatten:true})`), 
   and not just the immediate children of the host node (`assignedNodes()`).

2. Unify and simplify the resolution of assigned nodes and fallback nodes in `<SLOT>`.
   Today's model of treating assigned and fallback nodes differently causes confusion.
   Processing assigned and fallback nodes similarly will:
   1. create a clear conceptual model essential for developers and critical for web component adoption and
   2. have very few consequences for today's model (all behavioral changes I have seen could well be considered a fix).

3. Support the usecase of "setting up custom elements" as soon as both assigned nodes 
   (and initial attributes) are available, simply.
   
4. Open up new usecases for web components reacting to Slottables with unknown names.
   This can enable new patterns for interaction across shadowDOM borders, 
   such as allowing elements to adjust the shadowDOM according to an infinite number of slot names.

5. Enable `<SLOT>` elements to **delay rendering** its fallback nodes until they are needed.
   Not rendering fallback nodes that are never displayed will likely reduce both network traffic, memory
   and compute resources for the majority of `<SLOT>` fallback nodes made.
   If a custom element relies on an `<IMG>` in its `<SLOT>` fallback, 
   if this fallback is never needed, to **delay rendering** it like if it was placed in a template
   will both prevent it from loading and its layout and style being processed.
   
6. Unify `<TEMPLATE>` and `<SLOT>` and simplify the core principles of HTML variables.
   This is critical for developer understanding and adoption, but also highly important for
   future improvements of the platform.
   
7. Provide clearer and tighter CSS encapsulation for slotted nodes.
   Provide a more unified and simpler structure for existing CSS rules to be applied to.
   Reduce style creep of inherited CSS properties from middle-man chaining `<SLOT>` elements and in-the-middle documents.
   Reduce the confusion when children nodes of chained slot elements inside another custom element
   are treated as assignedNodes.

8. Increase the efficiency of flattening assigned nodes. 
   Increase the efficiency of `slotchange` events.
   Open up for future efficiency by providing a cleaner, unified model for HTML variables. 

## Short description
As with `<TEMPLATE>`, the child elements of a `<VAR>` is placed under a documentFragment property
`.content` when the `<VAR>` element is parsed, .
As with `<TEMPLATE>`, this document fragment is not placed in the DOM directly, but 
only accessible from JS.

As with `<SLOT>`, nodes can be assigned to the `<VAR>`. 
As with `<SLOT>`, when a `<VAR>` is used inside a shadowDOM, the `.childNodes` of the `.host` node of the 
`.shadowRoot` that is the Var's `.getRootNode()` are the assignable/slottable nodes.
Ie. `slottables = <var>.getRootNode().host.childNodes`

As with `<SLOT>`, slottables with a specified slot attribute (such as `<div slot='name1'>`)
are matched to `<VAR>` elements with a corresponding name attribute (such as `<VAR name='name1'>`).
As with `<SLOT>`, if no name or slot attribute is specified, it defaults to empty string.

Differently from `<SLOT>`, no `<VAR>` element can be connected under a shadowRoot that already has
another `<VAR>` element with the same `name` attribute connected.
This does not apply to the the main document, only to shadowRoot documents.

Differently from `<SLOT>`, if the `<VAR>` element has the attribute HIDDEN, 
no nodes can be dynamically assigned to it.
This makes 
`<VAR id="one" HIDDEN><h1>hello world!</h1></VAR>` function as 
`<TEMPLATE id="one"><h1>hello world!</h1></TEMPLATE>`.

Differently from `<SLOT>`, when the assigned nodes of `<VAR>` are resolved/flattened, 
the .content nodes (ie. the in template: childNodes) are considered slotted.
They will therefore retain the styles given in their parent document (regular css rules, 
as with `<SLOT>` children today), but also get the ::slotted(*) css rules (differently from `<SLOT>` childnodes)
today.

### `varCallback(Slottables)` vs `slotchange`

Differently from `<SLOT>`, there is no `varchange` event.
Instead, custom elements get a new callback method `varCallback(Slottables{name, assignedNodes})`.

`varCallback(Slottables)` triggers when a set of *external, flattened* nodes that **could be** 
assigned to a `<VAR>` element changes. It reacts to a slott**able**change event, not a slotchange event.

`varCallback(Slottables)` also triggers when a new set of *internal, fallback* nodes **could be** 
assigned to a `<VAR>` element. It reacts to `<VAR>` elements being added or removed from the shadowRoot.

If *external, flattened* nodes are set for a specific `<VAR>` name, changes to *internal, fallback* nodes
will NOT trigger a `varCallback`. 

If NO *external, flattened* nodes are set for a specific `<VAR>` name, changes to *internal, fallback* nodes
will trigger a `varCallback`. 

If *external, flattened* nodes are removed for a specific `<VAR>` name, a `varCallback` will be triggered
using *internal, fallback* nodes if available.

If neither *external, flattened* nodes nor *internal, fallback* nodes are available at startup,
an empty `varCallback(Slottables{name: "", assignedNodes: undefined})` is triggered. 
This makes `varCallback(...)` function as a PostBatchedConstructor callback for the custom element.

The `varCallback` is triggered in 4 ways:

1. Initially, directly.
   At PostBatchedConstructor-time, (after the branch containing the custom element is constructed),
   an initial `varCallback` for all assignable/slottable nodes is triggered.
   
   The initial varCallbacks is the union of the external and internal varChanges, 
   where external assignedNodes trump internal assingedNodes.
   
   The initial varCallbacks do not recursively trigger indirect varCallbacks on chained `<VAR>` elements.

2. Externally, directly.
   When a list of assignable/slottable nodes the host node changes for a specific slotname.
   If several slotnames are triggered at the same time, several varCallback will be called.

3. Externally, indirectly.
   `varCallback` is also triggered indirectly/recursively: 
   1. if one of the assignable/slottable nodes of the host element is itself a `<VAR>` element, 
   2. and the content of that `<VAR>` changes, 
   3. even though the assignable nodes have not changed directly,
   4. the flattened content of the assignable nodes will have changed indirectly,
   5. and this will trigger a `varCallback`.
   
    * This recursive function is implemented using direct method calls, not events.
    * The `<VAR>` element checks its host to see if itself is slotted, and if so, it will find its parent element
      and tell it to `triggerVarCallback` for the `<VAR>` element slotName.
 
   This method function identical to todays slotchange events, 
   except that it will only target the custom element that owns the `<VAR>` and irrelevant slotchange
   events cannot bubble up to confuse slotchange event listeners.

4. Internally.   
   Whenever a `<VAR>` element is added or removed within the shadowRoot, 
   a `varCallback` will be triggered for that `<VAR>` name, 
   if that same name has no externally assigned nodes.
   
 * Internally triggered `varCallback()`s can be skipped. The conceptual model is not very damaged by it.
   The concept is that changes of the shadowDOM should only occur from within the custom element itself,
   and thus processing due to such changes should be triggered pro-actively, 
   directly from where the change is made, and not reactively via the callback.
   This will up the performance of the `varCallback()`, simplify its conceptual model, and is my recommendation.
   If such a policy is chosen, every time a set of externally assignable nodes are removed, 
   the shadowRoot must be searched anew to find the current set of internal fallback nodes.

### Timing of `varCallback`
1. As with slotchange events, subsequential `varCallback` (2., 3., 4.) 
   are triggered after the corresponding time of 
   MutationObserver(childList) for the elements.
   
2. Initial `varCallback`
   PostBatchedConstructor means that if another custom element is still in the process of being constructed,
   `varCallback` will be delayed until all elements are ready.
   Thus if several custom elements are constructed (as will happen during sync parsing from `.innerHTML` or
   from a custom element constructing a shadowRoot with another custom element in its constructor),
   `varCallback` for all custom elements will be delayed until all custom elements have been created and then
   run together as a batch.

### Slottables

The parameter of the varCallback is Slottables. The Slottables interface is an object with:
 * `name`
 * `.assignedNodes({flatten:true})`
 * `.assignedElements({flatten:true})`

## Benefits of `<VAR>`: Ergonomic

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
   
4. The flattened DOM can be perceived as being stripped of all `<SLOT>` elements.

5. Clarifies the fact that `<SLOT>` is an HTML variable. 
   That can be declared (with or without a value).
   And that are dynamically reassigned.
   
6. The (fallback) .content of the `<VAR>` is expected not to change.
   The document fragment that is under the `<VAR>` can be changed, but these changes will not
   trigger a varCallback.
   This is in line with the concept of the varCallback as any changes of that fallback content should be done from 
   Adding a child node to the `<SLOT>` element will not trigger a slotchange event.
   within the custom element itself (thus making it simple to manage proactively, instead of reactively).
   This behavior is made more evident with the TEMPLATE characteristics of the `<VAR>` childNodes.

## Benefits of `<VAR>`: efficiency

1. The child nodes of `<SLOT>` elements function as fallback value when no assigned elements are attached.
   This means that if there always are assigned elements to an element, 
   these child nodes should never be active in the flattened/visible DOM.
   By parsing these elements directly into the .content property of the `<VAR>`, instead of into the DOM as with `<SLOT>`,
   instantiating work on these nodes when not used can be avoided.

2. There is no middle step into slotchange events. 
   `varCallback` are triggered by the MutationObserver directly, 
   and by direct methods from one `<VAR>` to another `<VAR>` element that are registered as its chained parent.
   
3. The flatten assigned nodes (ie. the resolution of HTML variables) is streamlined and simplified.
   This will not have a dramatic impact per se.
   But simplicity in variable resolution is critical when more complex models for efficiency 
   will be created later.

4. With slottableChanged instead of slotchange, the event is triggered on the level of the lightDOM instead
   of at the level of shadowDOM. This reduces the algorithmic work with one level, for all traversal.
   2 levels become 1. 3 levels become 2. etc. As most such events are low level, this should reduce the traversal somewhat.

5. Performance drawback. slotchange does not trigger when the slottables cannot be assigned to a slottable node.
   slottables will. If this is significant, a StaticSetting method `static get observedSlots() return ["", "slotName1"];`
   can be added. If no such setting is set, then all slottables are observed.
   But. This is very likely not necessary. If an app slots in tons of elements that are not used,
   and has no need for a varCallback, this is not an issue that should be solved with the slottables callback.

## Style considerations

1. Regular CSS rules.
   The childNodes of `<VAR>` would be styled as childNodes of TEMPLATE today.
   This is similar to how childNodes of `<SLOT>` are styled today, 
   with the exception that styles attributed to the `<SLOT>` itself are not inherited.
   
   The childNodes start from a new document root, but this document root has the same CSS rules defined 
   as the root in which the template/var is defined.

2. The ::slotted(*) CSS rules will now apply equally to assigned nodes and `<VAR>`.content nodes.
   Var.content nodes that gets into the slotted position will be treated as ::slotted.

3. In `<SLOT>`s, regular inheritable CSS properties of a `<SLOT>` in a mediating custom element will 
   affect slotted content.
   This effect is very elusive, makes the model of style encapsulation for slotted content very vague.
   For by far the majority of developers, this feature will function as style creep (benefitial or not),
   and not a predictable feature. 
   (A mediating custom element is a custom element who places its `<SLOT>`/var
   element in the slottable position of another custom element).
   
### Implement the 'varCallback' as a mixin that uses the `<SLOT>` instead of the `<VAR>`.

todo
Discussion about the VarMixin. Must make that page.
Update the pages for all 3 mixins.

## Further suggestions

1. Add onDomContentLoaded/onDocumentReady callback hook to `<VAR>` / TEMPLATE. 
   This callback hook would enable `<VAR>` / TEMPLATE to implement a below-the-fold solution in a single line.
   
2. The initial attributeChangedCallback could/should also be called at the same time? No, i think not.

3. Add initial attributeChangedCallback for all observed attributes, *also* when they are empty.
   Make demo that shows how this is useful when you use attributes to control the setup of the shadowDOM.
   
## Usecases

1. Make shadowDOM based on the slotted elements.

2. Make shadowDOM based on attribute setting (including the empty one).


### `<VAR>` element notifying shadowRoot of connection/disconnection.

1. `<VAR>` elements notifying their shadowRoot custom element that they get connected/disconnected.

When a `<VAR>` element connects to the shadowRoot, it:
   1. finds its `.getRootNode()`
   2. verifies that it is instanceof `shadowRoot`
   3. then gets its `shadowRoot.host` and stores it as its own `assigningHost`
   4. calls `assigningHost.varConnects(self)` with itself as parameter.
   5. `assigningHost.varConnects(self)` will check that no other `<VAR>` with the same `name` attribute
      is connected to it, and trigger `varCallback` if the hostNode is 
      ready && has no externally assigned nodes for the same `name`.

When a `<VAR>` element disconnects from the `shadowRoot`, it:
   1. calls `assigningHost.varDisconnects(self)`
   2. `assigningHost.varDisconnects(self)` will trigger `varCallback` if the hostNode is 
      ready && has no externally assigned nodes for the same `name`.
      
As connectedCallback and disconnectedCallback of `<SLOT>` is not available,
the demo is implemented using a rAF poll.

### `<VAR>.content` is perceived as static and does not trigger `varCallback`
When the `.content` of the `<VAR>` element changes, it will not trigger a `varCallback()`.
The `.content` can be changed dynamically, but when doing so the developer needs to actively
process changes that arise from it.