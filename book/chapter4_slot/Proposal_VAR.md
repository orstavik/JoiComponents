# Proposal: VAR

Why add a fictive Proposal to a textbook, you might ask?
It is my goal to deepen our common understanding of `<SLOT>` and `<TEMPLATE>`. 
By seeing this alternative solution to them both, 
I hope both the strength and weaknesses of `<SLOT>` and `<TEMPLATE>` will be easier to see.

The `<VAR>` element is a unification of the `<TEMPLATE>` and `<SLOT>` elements.
The changes proposed here could equally be applied as changes to the `<SLOT>` element.
The changes and proposal is constructed to make it possible to pick and choose whenever possible.
The reason I am formulating the proposal around a new element is to allow gradual implementation in
existing browsers without breaking existing applications relying on existing `<SLOT>` behavior.

## Motivation

1. Process direct and indirect `slotchange` events inside the custom element whose 
   `shadowRoot` contain the affected slot.
   
   Today: `slotchange` events in chained `<SLOT>` composition can bubble and trigger
   unrelated `<SLOT>` nodes.
   
   Tomorrow: `slotchange` events is a private matter between a custom element and its `<SLOT>`s,
   and will never reach other unrelated custom elements.
   
   Ref: [Problem: SlotchangeEavesdropping](Problem_SlotchangeEavesdropping.md)
   
2. Unify and simplify the resolution of assigned nodes and fallback nodes in `<SLOT>`.
   
   Today: assigned and fallback nodes are resolved differently. 
   This causes confusion both in terms of what will be shown on screen (no GentleMom pattern), 
   how it will be styled (no `::slotted(*)`) and JS API (cf. even the developers of the function 
   in Mozilla thought it worked differently).
   
   Tomorrow: Resolving assigned and fallback nodes similarly will:
   1. create a clear conceptual model in line with normal variable resolution,
      aid developer understanding and thus enhance web component adoption
   2. have very few consequences for today's model 
      (all behavioral changes could be considered fixes).
   
   Ref: [Theory: SLOT as HTML variable](Theory_SlotVariable.md)

3. Support the usecase of "setting up custom elements" as soon as 
   assigned nodes (and attributes) are available.
   
   Today: There is no callback that triggers after the complete construction of the DOM branch
   in which an element is created.
   
   Tomorrow: A single callback in all custom elements that guarantee that both attributes 
   and assigned nodes are ready. This callback will also function as an `initialAttributesCallback`

   Ref: [Problem: DeclarativeResolution](Problem_DeclarativeResolution.md)
   Ref: [Pattern: BatchedConstructorCallbacks](../chapter2_HowToMakeMixins/Pattern10_BatchedConstructorCallbacks.md)
   Ref: [Mixin: InitialAttributes](../chapter3_lifecycle/Mixin2_InitialAttributes.md)
   
4. New feature/usecase: Make web components reactive to unassigned slotables.
   
   Today: not available.
   
   Tomorrow: This feature will enable new *declarative* HTML composition patterns such as
   allowing elements to adjust, sort and structure the shadowDOM depending on slotted nodes *only*.

   Ref: [Pattern: Slottables](Pattern_Slottables.md)

5. Delay full construction of `<SLOT>` fallback nodes until used.
   
   Today: Only children of `<TEMPLATE>` are partially constructed until use.
   
   Tomorrow: Both children `<TEMPLATE>` and `<SLOT>` nodes are partially constructed until use.
   The majority of `<SLOT>` fallback nodes made are never used.
   Delayed rendering fallback nodes that are never displayed will likely reduce both memory
   and compute resources and network traffic. 
   
   Ref: see subchapter Delay rendering. move to description If a custom element relies on an `<IMG>` in its `<SLOT>` fallback, 
   if this fallback is never needed, to **delay rendering** it like if it was placed in a template
   will both prevent it from loading and its layout and style being processed.
   
6. Unify `<TEMPLATE>` and `<SLOT>` and simplify the core principles of HTML variables.
   
   Today: Two different elements and conceptual structures are needed to implement the usecases 
   underlying `<TEMPLATE>` and `<SLOT>`.
   
   Tomorrow: One element and conceptual structure that has a simpler resolution model 
   than the existing `<SLOT>` element can replace them both.
   A simpler model will lower the threshold for developers entering web component development.
   A simpler model will lower the barrier for future improvements and development of the platform/browsers.
   
   Ref: 
   
7. Provide stricter CSS encapsulation for slotted nodes.
   
   Today: Slotted nodes can be styled at all levels when assigned. 
   
   Tomorrow: Stricter CSS encapsulation of slotted nodes provide a clearer 
   conceptual model for web component developers.
   Combined with unification of variable resolution for fallback nodes and assigned nodes,
   the ability to style slotted and use fallback nodes increases while at the same time being tighter
   encapsulated.
   
   Ref: [Problem: StylingSlots](../chapter1c_slot_style/Problem_StylingSlots.md)
   Ref: [Pattern: GentleMom](../chapter1b_slot_basics/Pattern_GentleMom.md)

8. Increase the system efficiency of: a) `slotchange` events, b) flattening assigned nodes and c) `<SLOT>` fallback nodes. 
   
   Today: Reactions to `slotchange` events go via the event callback system and can affect eavesdropping elements.
   Slot fallback nodes are in principle fully rendered at construction time.
   The algorithm for flattening assigned nodes require some additional contextual checks.
   
   Tomorrow: Reactions to `slotchange` events go can pass directly to only the relevant custom elements
   without requiring the event callback system.
   The flattening (resolution) of assigned nodes gets fewer contextual checks.
   Slot fallback nodes will only be rendered when used (assigned).
   
9. Manage `<VAR>` assignments and changes *within* the shadowDOM proactively only, not reactively.

    Today: Changes to the shadowDOM that alters the assignment to one or more `<SLOT>` elements
    will trigger `slotchange` events. This forces developers that also need to listen for *externally* 
    triggered slotchange events to manage these *internally* triggered slotchange events reactively.
    
    Tomorrow: Manage all *externally* triggered slotchange events reactively, but 
    trigger no reaction on *internally* triggered slotchange events.
    
    Ref: [Problem: StylingSlots](Problem_slotchange_issues.md)
   
10. Open up for future efficiency by providing a cleaner, unified model for HTML variables. 

## Short description of `<VAR>` behavior

`<VAR>` == `<TEMPLATE>`:
 * When the parser encounters child nodes of a `<VAR>`, it puts them in a special `.content` property. 
   `.content` is a documentFragment.
 * Elements in `.content` are only fully constructed when used.
 * The `.content` property is not placed in the DOM directly, but only accessible from JS.

`<VAR>` == `<SLOT>`:
 * nodes can be assigned to the `<VAR>`.
 * When placed in a document, the slotable nodes of `<VAR>` equals the slotable nodes of `<SLOT>`.
   Ie. `slotables <=> <var>.getRootNode().host.childNodes`
 * slottables with a specified slot attribute (such as `<div slot='name1'>`)
   are matched to `<VAR>` elements with a corresponding name attribute (such as `<VAR name='name1'>`).  
   Ie. `slotables[slot=name] <=> <var[name=name]>.getRootNode().host.childNodes`
 * If no name or slot attribute is specified, it defaults to empty string `""`.

`<VAR>` != `<SLOT>`:
 * `<VAR>` elements cannot be connected to a shadowRoot (or document in general) 
   that already has another `<VAR>` element with the same `name` attribute connected.
 * `<VAR>` elements with the attribute HIDDEN will not be assigned nodes.
 * This makes 
   `<VAR id="one" HIDDEN><h1>hello world!</h1></VAR>` function as 
   `<TEMPLATE id="one"><h1>hello world!</h1></TEMPLATE>`.
 * `<VAR>` elements are resolved, not flattened. 
   When `<VAR>.content` nodes are used as fallback nodes, they are considered assigned.
   They will retain the styles given in their parent document of declaration (regular css rules, 
   as with `<SLOT>` node and its children today), but also get the ::slotted(*) css rules 
   (differently from `<SLOT>` childnodes) today.
   
`<VAR>` != `<SLOT>`/`<TEMPLATE>`:
 * In the flattened DOM, the `<VAR>` element is a document/documentFragment, 
   similar to a shadowRoot.
   As a document, the `<VAR>` node will have stronger CSS encapsulation.
   *I am not sure exactly which model should be applied here.*
 * `::var[name](css rule)`. The `css rule` will when the DOM is flattened be transferred to the
   document representing the `<VAR>` node. Such `css rule`s could therefore apply their `*`
   to both child and descendants that get assigned to the `<VAR>`.
 
## `varCallback(Slottables)`

### `varCallback(Slottables)` vs `slotchange`

`<VAR>` != `<SLOT>`:
 * there is no `varchange` event. Instead, custom elements get a new callback method 
   `varCallback(Slottables{name, assignedNodes})`.

 * `varCallback(Slottables)` triggers when a set of *external, flattened* nodes both 
    **could be** or **is** assigned to a `<VAR>` element changes. It reacts to a 
    slot**able**change event, not a slot**ted**change event.

 * If *external, flattened* nodes are removed for a specific `<VAR>` name, 
   a `varCallback` will be triggered with an empty result, regardless if a `<VAR>` with that name
   in the shadowDOM has fallback nodes or not.

 * If no *external, flattened* nodes are available at startup,
   an empty `varCallback(Slottables{name: "", assignedNodes: []})` will be triggered. 
   This makes `varCallback(...)` function as a PostBatchedConstructor callback for the custom element.

The `varCallback` is triggered in 3 ways:

1. Initially, directly.
   At PostBatchedConstructor-time, (after the branch containing the custom element is constructed),
   an initial `varCallback` for all external assignable/slottable nodes is triggered.
   
   The initial varCallbacks do not recursively trigger indirect varCallbacks on chained `<VAR>` elements,
   as they all will be initially triggered.

2. Externally, directly.
   When a list of assignable/slottable nodes changes for a specific slotname.
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
 
   This method will function similar to todays `slotchange` events, 
   except that it will only target the custom element that owns the `<VAR>` and 
   irrelevant slotchange events cannot bubble up to confuse slotchange event listeners.

The `varCallback` is not triggered by internal changes in the shadowDOM where the `<VAR>` exists,
or changes of the `<VAR>` element itself (ie. a `<VAR>` element being connected or disconnected).
Changes to the `<VAR>` element itself or the document in which the `<VAR>` resides should be managed
proactively by the developer (where he makes the change), and not reactively via a callback.

### Timing of `varCallback`
1. As with slotchange events, subsequential `varCallback` (2., 3., 4.) 
   are triggered after the corresponding time of MutationObserver(childList) for the elements.
   
2. Initial `varCallback`
   `varCallback` will be triggered PostBatchedConstructor-time.
   This means that `varCallback` will be triggered after DCL and after the construction of the branch in which it resides.
   `varCallback` will be delayed until all elements are ready.
   Thus if several custom elements are constructed (as will happen during sync parsing from `.innerHTML` or
   from a custom element constructing a shadowRoot with another custom element in its constructor),
   `varCallback` for all custom elements will be delayed until all custom elements have been created and then
   run together as a batch.

### `varCallback(...)` signature

`varCallback(slottables, indirectness, data)`

1. 
```
slottables {
  name
  .assignedNodes({flatten:true})
  .assignedElements({flatten:true})
}
```
2. `indirectness`, 
   * indirectness === 0: a direct change to one of the `host` nodes children.
   * indirectness \> 1: a change by a chained `<VAR>` or `<SLOT>`

3. `data`. Similar to the `slotchange` event. This data is not really critical and can be skipped.

### `<VAR>` on connection/adoption

`<VAR>.adoptedCallback` &
`<VAR>.connectedCallback`:
   1. finds its `.getRootNode()`
   2. verifies that it is instanceof `shadowRoot`
   3. verifies that rootNode does not have another `<VAR>` with the same name
      (`<VAR[name=X]> && shadowRoot.querySelectorAll("VAR[name=X]").length > 2`)

## Limitations that prevent a mixin solution

1. Mixin cannot control parser behavior.

2. The algorithm of flattening slots does not allow slot fallback nodes to be recursively assigned.

3. CSS encapsulation cannot be controlled from JS.

## Further suggestions

1. Add onDomContentLoaded/onDocumentReady callback hook to `<VAR>` / TEMPLATE. 
   This callback hook would enable `<VAR>` / TEMPLATE to implement a below-the-fold 
   solution in a single line.
   
   Ref: [Pattern: TemporaryTemplate](../chapter3_lifecycle/Pattern1_TemporaryTemplate.md)
   
2. Setting up the `<TEMPLATE>` element as a document node can also be used as a means to create an
   HTML-import like functionality.
   
## References

 * 