# HTML composition / Interaction between lightDOM and shadowDOM

HTML composition is to create new DOM structures by combining html elements.

## How to politely cross the borders of DOM documents? 

The well-trodden pathways to cross document borders are:
 * Adding and removing elements that are "slotted" into shadowDOMs.
 * Passing data as attributes.
 * Setting css classes on elements and CSS variables.
 * Calling methods on JS objects and dispatching events (props down, events up).
 
These pathways should be followed strictly.
Keeping to these pathways makes the element safe and reusable,
both from an HTML, a CSS, and a JS standpoint.
And this is the general purpose of shadowDOM: 
to establish borders between parts of the DOM that should only be crossed using 
a select set of established pathways.

### Webcomponent rudeness: the `DocumentReaching` anti-pattern

Aside from these established pathways, 
altering, passing data or querying inside the scope of another document is an anti-pattern: 
DocumentReaching.
Symptoms of this antipattern are references to:
1. `this.ownerDocument`. This is a reference to the lightDOM document, and should rarely be used.
2. `document.querySelector("xyz")`. This is a reference to the main document, and 
should not be accessed from inside a custom element.
3. `someElement.shadowRoot`. If someElement is not `this` element (and then you should write `this.shadowRoot`), 
you should not interfere with that custom elements orchestration of its shadowDOM elements.

If you are *reaching* across document borders, try to replace the rude approach with a polite approach.
If you are *reaching* up into your parent (1. & 2.), 
you likely need to create a custom element for that ancestor element you are trying to reach.
An alternative solution is switch the position of control from the custom element where you are reaching from 
and into the parent document where you are reaching to.
If you are *reaching* down into a custom element,
you likely need to set-up one of the other established pathways in the custom element 
so that the custom element itself can assume control of the orchestration of its shadowDOM elements.

So, be on your best behavior!
Don't stare at or touch a MarriedMan's wife. 
And don't directly query, manipulate or style another element's shadowDOM.

* Do not underestimate the *cost of complexity* of HTML composition.
Do not *reach* into other documents in order to for example avoid creating another custom element.
Do not reach over the table at dinner, ask your fellow politely to pass the food.
Do not reach directly across document borders, ask the custom element politely to accomodate you.


## Opinionated advice for working with shadowDOM
1. Avoid "multi-sourced-slots". 
This means that you should try to avoid giving a slot siblings if it placed as a child
of another custom element. 

2. Be aware that when you dynamically add or remove `<slot>` elements 
inside the shadowDOM, this might disturb event listeners you have attacted to the slot element 
for slotchange events (since these events are do not bubble in Chrome nor Safari). 
If you listen for slotchange events, you will likely encounter problems when you update or alter the shadowDOM.
If you want to update the shadowDOM, you should employ the ChildrenChangedMixin.

3. Remember that only direct children of the `host` element are directly assigned.
Deeper descendants of the `host` element will be slotted via the child.

4. Avoid altering the assignedNodes directly. If you need to alter the assignedNodes, 
use the HelicopterParentChild pattern.

5. Anticipate chained `<slot>`s. The more reusable your elements are, 
the more likely their slots will be chained with others.

6. Use the `flattenedChildren(el)` function to access the "actual" list of an element.
Use SlotchangeMixin or ChildrenChangedMixin to observe changes of assignable nodes and slots.

7. When you have chained `<slot>`s, try to manipulate the DOM at the top most level.

## References
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom
 * [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 
