# Problem: `slotchange` issues

## What triggers a `slotchange`?

A `slotchange` is triggered by the following events:

1. **External**: Adding or removing a `childNode` of the `host` element.
   If the `childList` of the host node changes, this mutation can trigger a `slotchange` event.
   This is a change of the **slottable** nodes in the lightDOM surrounding a custom element, and
   we can call it an *external slottable-mutation*.
 
2. **Internal**: Adding or removing a `<SLOT>` element in the shadowDom of a custom element.
   We call it an *internal slot-mutation*.

**Important!!** An external slottable-mutation **must match** a corresponding internal `<SLOT>` node 
for it to trigger a `slotchange`; and an internal slot-mutation **must match** a corresponding set of
external slottable nodes for it to trigger a `slotchange`.
If you add or remove a `<SLOT>` node that has or will get *no* assigned nodes, then no `slotchange` 
event will fire. Similarly, if you add a slottable node that either is not or will not be slotted into
the custom element, then no `slotchange` event will fire.

In summary: `slotchange` events are triggered by:
1. **assignable external slottable-mutations** and
2. **assignable internal slot-mutations**.
   
There are three issues with `slotchange`.
   
## Issue 1: `<SLOT>` masking

What happens if you add a `<SLOT>` node to a shadowDOM that already contains 
another `<SLOT>` node with the same name?
Will this mutation trigger two `slotchange` events?
One event for the newly added `<SLOT>` that gets new nodes assigned to it? 
And another event for the old `<SLOT>` node that gets its elements removed?
Furthermore, in which order will these `slotchange` events be triggered?
Will they be triggered in tree order, so that you first get a `slotchange` event pointing to a `<SLOT>`
element with a full list of `assignedNodes`?
And then immediately after it get another `slotchange` event from a different `<SLOT>` node 
that has the same `name` property, but this time with an empty list of `assignedNodes`?
We test it:

todo test and example of the above situation.
todo reference to superfluous slotchange events.

As the tests shows, our initial assumptions was correct.
Masking `<SLOT>` elements with other `<SLOT>` elements with the same `name`
causes multiple `slotchange` events to be fired from both the masking and masked `<SLOT>` elements.
`slotchange` events triggered by masking `<SLOT>` elements can be triggered by both adding, removing 
and moving "same-named" `<SLOT>` elements.

`<SLOT>` masking creates `slotchange` events that are:
1. likely to cause unexpected and directly misleading events (cf. the example above),
2. superfluous events (you are most often not interested in a slotchange event that signals no change
in the external slottable nodes, as is the case with *all* `slotchange` events that occur due to 
`<SLOT>` masking), and
3. more likely a sign of an earlier mistake in the code (ie. the developer did not intend to add
two `<SLOT>` nodes with the same `name` earlier, but the problem with unexpected `slotchange` events
only arises later).

To this equation can be added that `<SLOT>` masking is not a necessary feature. 
There are neither significant performance benefit nor other ergonomic benefits that come from using it.
And therefore, `<SLOT>` masking should be considered an anti-pattern.

> Proposal: The spec should state that when `<SLOT>` nodes connects to the DOM, 
  it should make sure that no other `<SLOT>` nodes with the same name are connected to the same shadowRoot.
  ```
  HTMLSlotElement.connectedCallback() {
    const shadowRoot = this.getRootNode();
    const slotName = this.getAttribute("name") || "";
    if (shadowRoot is a shadowDOM && shadowRoot.querySelector(slot[name="slotName"]) !== this)
      throw new Error("No slot masking: two slot nodes with the same name is not allowed under the same shadowDOM");
  }
  ```

## Issue 2: Reacting in a proactive setting

Only a custom element should change its own shadowDOM.
The process of changing the shadowDOM is triggered reactively.
The developer might make it in the (reactive) `constructor()`, or 
he might change it as a reaction in `attributeChangeCallback(...)`.
All the methods in the custom elements are reactions.

But, when the custom element's reaction is triggered, the process of actually making or 
changing the shadowDOM should be fully proactive.
Developers will specify the content of the DOM and add internal event listeners 
in imperative (proactive) steps.
Therefore, as a developer, if you set up your shadowDOM in the `constructor()`, you:
1. in proactive mode make a sequence of imperative calls to fill dom nodes into the shadowDOM, then
2. switch to a reactive mindset, anticipate that every time a `<SLOT>` node is added during this procedure,
a `slotchange` event will fire, causing you to make a cognitive shift from the `constructor()` and 
to the function(s) that listens for `slotchange` event, which will be called asynchronously, and 
3. then shift back to the `constructor()` context and a proactive mindset in order to 
update internal event listeners or host element attributes.

If internal slot-mutations did not trigger `slotchange` callbacks, the developer
could avoid stepping out of the "proactive mindset" and for example `constructor()` context
while making the shadowDOM.
The sequence would all be in proactive mode:
1. do a sequence of imperative calls making the dom nodes in the shadowDOM, then
2. if you add or remove some `<SLOT>` nodes that you would like to assess the `assignedNodes` of,
do so by calling the processing of those `<SLOT>` nodes imperatively, "as normal", and then
3. add event listeners and host element attributes.

To switch between "proactive" and "reactive" mindset, switch context between `constructor()` and 
`slotchange` listeners, with some of the steps delayed asynchronously, 
is not an ergonomic benefit for you as a developer.

To stay purely proactive with the `slotchange` event is difficult. 
It is not a problem to manually, proactively trigger processing of the assignedNodes of newly 
added or removed `<SLOT>` nodes.
But, it can be a problem to ignore the delayed `slotchange` events that will be triggered by the browser
later as a response to the same situation.

> Opinion: I love reactive programming as much as the next guy. And this book is a testament to that.
  And, custom elements both *must* rely on reactive methods,
  and HMTL+JS *greatly* benefits from it in general. 
  But, internal slot-mutations is not a time to be reactive.
  Internal slot-mutations are done in a context where it is benefitial 
  for the developer to remain in a *proactive* mindset and avoid unnecessary cognitive shifts.

## Issue 3: what about external **unassignable** slottable-mutations?

If you add or remove a slottable node to a custom element that either:
 * doesn't have a shadowDom, or
 * doesn't have a corresponding `<SLOT>` element for the slottable node,
then this will not trigger a `slotchange` event. As there are no `<SLOT>` node whose `assignedNodes`
have changed.

We can call such an event **unassigned slottable-mutation**.
The concept of `slotchange` does not intend to frame such events, nor would it be amendable to do so.

To explain the role purpose **unassigned slottable-mutation** might play in a custom element, 
is best done solution-first.

## References

 * 