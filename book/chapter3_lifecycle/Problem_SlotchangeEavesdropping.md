# Problem: SlotchangeEavesdropping

A `<SLOT>` node and the custom element `host` node it belongs to are intimately connected.
The `<SLOT>` gets its `assignedNodes` from the `host` node's `childNodes`,
and the `host` node should control any and all interaction that concerns the state and position of
its own `<SLOT>` elements in its own shadowDOM.
If outsiders were to be given access to control the `<SLOT>`, they should do so via the custom element
host node, not by "reaching into" the shadowDOM to access the `<SLOT>` directly.

## The relationship between `slotchange` events and custom elements

The same principle applies to `slotchange` events.
The custom element who controls a `<SLOT>` element would like to be informed of two types of `slotchange`
events:

1. A **direct** change of a `<SLOT>` element's immediately `.assignedNodes()`.
If the `.childNodes` of the `host` element changes in such a way as to produce new list of directly
`assignedNodes()` of one of its `<SLOT>`s, then the custom element would like to be notified, 
such as via a slotchange event bubbling up to its shadowRoot from the `<SLOT>`.

2. An **indirect** change of a `<SLOT>` element's transposed `.assignedNodes({flatten: true})`.
If one of a `<SLOT>` element's directly `.assignedNodes()` is itself a `<SLOT>`,
then the custom element would like to get notified of such a change to any such chained `<SLOT>`
elements, for example via a `slotchange` event that indirectly bubbles up to its shadowRoot via 
the slot chain.

These `slotchange` events, that directly or indirectly signal a change in a `<SLOT>` node's
flattened assigned nodes, are the concern the custom element to which the `<SLOT>` node belongs.
And, even more. These `slotchange` are *not* the concern of other elements.
Other elements should respectfully go via the custom element's host node if they wish to get
information about a change in one of that custom element's shadowed `<SLOT>`s.

A `slotchange` is a private matter between a custom element and its `<SLOT>` elements.
And so, to intercept, process or (heaven forbid) `stopPropagation` of a `slotchange` events
destined for another custom element, should be avoided in civil society. 

## How to process `slotchange` events?

> Tips!! Use `this.shadowRoot.addEventListener("slotchange" ...);`, not ~~this.addEventListener("slotchange" ...);~~
`slotchange` events only `bubble`, they are not `composed`, 
and so they will not travel from the `.shadowRoot` node to the `host` node.

To retrieve `slotchange` events in a custom element, is simple:
Add an event listener on the `shadowRoot` in your custom element.
This event listener will capture all direct and indirect slotchange events inside your element,
and no-one else's.

But. The indirect `slotchange` events originate from another `<SLOT>` element.
`.composedPath()[0]` is the chained `<SLOT>` element from one or more lightDOMs above.
This means that even though the event is relevant 
(it signals a change to one of your `<SLOT>`s flattened assigned nodes), 
you must search the event's `.composedPath()` to find the `<SLOT>` that is in your `shadowRoot`.
This "find-your-own-slot"-processing *must* be done for all `slotchange` events since 
you have no control if the users of your custom element will assign `<SLOT>` nodes to it or not.
And, it makes *no difference* if you attach the event listener to the top `shadowRoot` or to each
individual `<SLOT>` node, since this has nothing to do with the content of indirect `slotchange` events.

This leads to a universal algorithm for processing **all** slotchange events.
First of all, it does not really matter where you attach your `slotchange` listener, 
so keep things simple and add just one listener to `this.shadowRoot`.
Second, to "find-your-own-slot" of *indirect* `slotchange` events,
you must iterate the `.composedPath()` to find the `<SLOT>` which `.getRootNode() === this.shadowRoot`.

```javascript
this.shadowRoot.addEventListener("slotchange", e => {
  const path = e.composedPath();
  for(let i = 0; i < path.length -1; i++){
    let node = path[i];
    if (node.tagName !== "SLOT")
      return null;
    if (node.getRootNode() === this.shadowRoot)
      this.slotchangeCallback(node, i, e);     //slotchangeCallback(slotNode, indirectness, event)
  }
});
```

## A naive `slotchangeCallback`

There is dry gunpowder in the above paragraphs. Let's look at the fireworks.
The first BANG! was the social rule that courteous web components NEVER should eavesdrop 
on other custom element's `slotchange` events.
With `slotchange` events this is possible, but it requires looking into another element's
shadowDOM, which breaks basic principles of web component encapsulation.
The second BANG! was the need to process all `slotchange` events using the same algorithm
for "finding-your-own-slot".
The consequence of this is a third BANG! 
All `slotchange` events could and should be processed into the same callback method: 
`slotchangeCallback`.

```javascript
function findYourOwnSlot(e, shadowRoot){
  const path = e.composedPath();
  for(let i = 0; i < path.length -1; i++){
    let node = path[i];
    if (node.tagName !== "SLOT")              //[no eavesdropping]
      return null;                            //[no eavesdropping]
    if (node.getRootNode() === shadowRoot)
      return [node, i];
  }
  return null;
}

export function naiveSlotchangeCallback(el){
  el.shadowRoot.addEventListener("slotchange", e => {   //[*]
    const [slot, indirectness] = findYourOwnSlot(e, el.shadowRoot);
    el.slotchangeCallback(slot, indirectness, e);
  });
}
```
 * This function has a dependency: 
   the `el` must have an open `.shadowRoot` available before to add the `slotchange` listener.

## Example: GrandpaInAFrame

In this example we set up a group of custom elements that chain their `<SLOT>` nodes.
The resulting custom element `<family-photo>` will 
frame an image in a wooden (brown) frame with a bronze (yellow) label.
The `<family-photo>` custom element also uses the `NaiveSlotchangeMixin` to
log every time an element is slotted.

In the example we will also *delay* the callback until the first `requestAnimationFrame`.
This drops all the initial slotchange events so we only see the `slotchange` events for the
dynamically added nodes.
We will return in force to the initial `slotchange` events in the next chapter:
[Problem: DeclarativeResolution](Problem_DeclarativeResolution.md).

```html
<family-photo>
  <img src="https://images.pexels.com/photos/1146603/pexels-photo-1146603.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125" alt="grandpa">
  <span slot="label">My internet family</span>
</family-photo>
 
<script type="module">
  import {naiveSlotchangeCallback} from "https://rawgit.com/orstavik/JoiComponents/master/src/slot/NaiveSlotchangeCallback.js";

  class FamilyPhoto extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: "open"
      });
      this.shadowRoot.innerHTML = `
<wooden-frame style="display: inline-block;">
  <slot></slot>
  <bronze-label slot="label">
    <slot name="label"></slot>
  </bronze-label>
</wooden-frame>
`;
      requestAnimationFrame(() => naiveSlotchangeCallback(this));
    }
    slotchangeCallback(slot, indirectness, chainedSlots){
      console.log("FamilyPhoto", slot, slot.assignedNodes({flatten: true}), indirectness, chainedSlots);
    } 
  }
  class WoodenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: "open"
      });
      this.shadowRoot.innerHTML = `
<div style="position: relative; border: 40px solid brown;">
  <slot></slot>
  <div style="position: absolute; bottom: -35px; left: 30%;">
    <slot name="label"></slot>
  </div>
</div>
`;
      requestAnimationFrame(() => naiveSlotchangeCallback(this));
    }
    slotchangeCallback(slot, indirectness, chainedSlots){
      console.log("WoodenFrame", slot, slot.assignedNodes({flatten: true}), indirectness, chainedSlots);
    } 
  }
  class BronzeLabel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: "open"
      });
      this.shadowRoot.innerHTML = `
<style>
  :host {display: inline-block; background: yellow;}  
</style>
<slot></slot>
`;
      requestAnimationFrame(() => naiveSlotchangeCallback(this));
    }
    slotchangeCallback(slot, indirectness, chainedSlots){
      console.log("BronzeLabel", slot, slot.assignedNodes({flatten: true}), indirectness, chainedSlots); 
    } 
  }
  customElements.define("bronze-label", BronzeLabel);
  customElements.define("wooden-frame", WoodenFrame);
  customElements.define("family-photo", FamilyPhoto);

  const familyPhoto = document.querySelector("family-photo");

setTimeout(()=>{
  const addedImg = document.createElement("img")
  addedImg.src = "https://images.pexels.com/photos/12971/pexels-photo-12971.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125";
  familyPhoto.appendChild(addedImg);  
}, 1000); 

setTimeout(()=>{
  const addedLabel = document.createElement("div");
  addedLabel.setAttribute("slot", "label");
  addedLabel.innerText = " by orstavik";
  familyPhoto.appendChild(addedLabel); 
}, 2000); 

</script>
```
In the example above, one eavesdropping of a `slotchange` event is averted.
When the label "by orstavik" is added after 2000ms, 
the `slotchange` event is 

## References