# SlotchangeNipSlip: SlotchangeEavesdropping / BigBrotherEavesDropping

In [Problem: SlotchangeSurprise](7_Problem_SlotchangeSurprise), we saw how multiple `slotchange` 
events can surprise us. In this chapter, we how *completely* irrelevant `slotchange` events
might trigger a `slotchange` listener, and thus how web components might accidentally eavesdrop 
on `slotchange` events they should not be party of. We start with an example:

## Example: 

Two core web component principles:
 * Only `composed` events propagate up from the shadowDOM inside a custom element and through to the
   host `node` and lightDOM of the custom element.
 * Outside sources (other custom elements and scripts) should not listen into
   events *inside* the shadowDOM of a custom element. 
   
`slotchange` events are not `composed`.
A `slotchange` is and should be a *private* matter between the `<SLOT>` whose assignedNodes changes, 
and the custom element which that `<SLOT>` directly belongs to.

But, with `slotchange` events there is a problem: `<SLOT>` elements can be chained. 
*Direct* changes of the `assignedNodes` in one `<SLOT>` element can therefore also 
*indirectly* change the `assignedNodes` of another `<SLOT>` element.
This chapter describes how to process both direct and indirect `slotchange` events.

## Direct and indirect `slotchange` events

For a custom element, a **directSlotNode** is a `<SLOT>` node that exist inside that 
custom element's shadowDOM, and an **indirectSlotNode** is a `<SLOT>` node that 
is chained to that slot.

A custom element who controls a `<SLOT>` element would like to be informed of two types of 
`slotchange` events:

1. **Direct `slotchange` events**: a change in a `<SLOT>` element's *directly* assigned nodes.
   If the `.childNodes` of the `host` element changes,
   this could produce a direct `slotchange` event in a `<SLOT>`.
   Direct `slotchange` events produce a different from the `<SLOT>.assignedNodes()` 
   before and after the event.

2. **Indirect `slotchange` events**: a change in a chained `<SLOT>` element.
   If a `<SLOT>` node is placed as one of the `host` node's children, a change in that `<SLOT>` node's
   `.assignedNodes()` can also indirectly change the `.assignedNodes({flatten: true})` 
   of the custom element's directSlotNode.
   Such changes would *not* affect the result of the directSlotNode's `.assignedNodes()`, but *do*
   change the result produces by the directSlotNode's `.assignedNodes({flatten: true})`.
   As slots can be chained over many levels, indirect `slotchange` events can also 
   propagate via several slot nodes.

## Processing `slotchange` 1: `this.shadowRoot.addEventListener("slotchange" ...)`

`slotchange` events bubble, and when dispatched from a `<SLOT>` node, 
it will bubble up to the `shadowRoot` ancestor of that `<SLOT>` node.
Also, when `<SLOT>` nodes are chained, `slotchange` events will also bubble up to the chained
`<SLOT>` node. This means that a `slotchange` event, if not stopped, 
will propagate up so as to notify *all* `<SLOT>` nodes in its chain that would be affected.

Therefore, to retrieve both direct and indirect `slotchange` events in a custom element is simple.
Add an event listener on the `shadowRoot` in your custom element, and
this listener will then capture all direct and indirect slotchange events that can occur 
inside your custom element.

To set up a callback for any custom element with a `.shadowRoot`, the following method can be applied:

```javascript
export function naiveSlotchangeCallback(el){
  el.shadowRoot.addEventListener("slotchange", e => {   //[*]
    el.slotchangeCallback(e);
  });
}
```

>Att 1!! Remember to add your `slotchange` listener to **this.shadowRoot**, and *not* ~~**this**~~!
`slotchange` events only `bubble`, but they are not `composed`. 
When a `slotchange` event reach a `.shadowRoot` document, it will therefore *stop* and *not* travel 
from this `this.shadowRoot` node and to `this` (the `host` node).

>Att 2!! Do not call `.stopPropagation()` in your `slotchange` listener.
Stop a `slotchange` from bubbling, and other custom elements will not be notified of indirect `slotchange`s.

## Processing `slotchange` 2: `findDirectSlotNode`

When indirect `slotchange` events bubble from one chained `<SLOT>` node to the next, 
the event itself does not change. This is as expected, but 
it can cause confusion in the indirect `slotchange` event listener.
In an indirect `slotchange` event, the `slotchange.target` and the `slotchange.composedPath()[0]` 
is *not* a directSlotNode of the custom element.
Instead, the target `<SLOT>` node would be an indirectSlotNode from one or more lightDOMs above.
The directSlotNode that reside in your custom element's shadowDOM will be hidden in the event path
as something like `.composedPath()[1]` or `.composedPath()[2]` etc.

It makes *no difference* if you attach the event listener to the top `shadowRoot` 
or to each individual `<SLOT>` node. Both event listeners will yield the same `slotchange` event 
with the same `target` and `composedPath()`.

Often, when `<SLOT>`s are chained, no additional nodes are added along the way. 
This means that often, calling `.assignedNodes()` on the `target` and the directSlotNode in 
the path would yield the same result.
However, if additional nodes are added to the slottables of a custom elements along the way,
calling `.assignedNodes()` on the `target` and the directSlotNode in the path would *not* 
yield the same result.

Whether or not the indirectSlotNode and the directSlotNode yield the same result
all depends on how the custom element is used. Which you as an author of the custom element
in principle do not control. This in turn means that tou can build a custom element
that works fine in 100 applications, only to suddenly break when applied to the next 100, when 
people tries to use your custom element inside other custom elements.

Therefore, when you process a `slotchange` event, you should always make sure you have the "correct", 
directSlotNode for your custom element.
To find the directSlotNode for in a `slotchange` event, you simply need to
check the nodes in the events `composedPath()` to find the first node which have the custom elements
`shadowRoot` as its `rootNode`:

```javascript
function findDirectSlotNode(e, shadowRoot){
  const path = e.composedPath();
  for(let i = 0; i < path.length -1; i++){
    let node = path[i];
    if (node.getRootNode() === shadowRoot)
      return {directSlotNode: node, indirectness: i};
  }
  return null;
}
```
Another relevant finding from searching the events `composedPath()` like this is that the number of
links in the slot chain gets reflected by the position from where you find the directSlotNode.
If the event examined is a direct `slotchange` event, the position will be `0`.
Ie the `slotchange` event is triggered two lightDOMs above, the position would be `2`.
`findDirectSlotNode(e, shadowRoot)` therefore returns a result with containing both 
the `directSlotNode` and the level of `indirectness` (where `0` === a direct `slotchange` event).

## Problem: SlotchangeEavesdropping

But, there is a snag with indirect `slotchange` events.
Your custom element `slotchange` listeners *actually can* intercept `slotchange` events
that are completely irrelevant for them.

To illustrate this problem, we will set up an example.
In this example we set up a group of custom elements that chain their `<SLOT>` nodes.
The resulting custom element `<family-photo>` will 
frame an image in a wooden (brown) frame with a bronze (yellow) label.
The custom elements all use a `naiveSlotchangeCallback` to log their `slotchange` events.

```html
<family-photo>
  <img src="https://images.pexels.com/photos/1146603/pexels-photo-1146603.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125" alt="grandpa">
  <span slot="label">My internet family</span>
</family-photo>
 
<script type="module">
function findDirectSlotNode(e, shadowRoot){
  const path = e.composedPath();
  for(let i = 0; i < path.length -1; i++){
    let node = path[i];
    if (node.getRootNode() === shadowRoot)
      return {directSlotNode: node, indirectness: i};
  }
  return null;
}
function naiveSlotchangeCallback(el){
  el.shadowRoot.addEventListener("slotchange", e => {   //[*]
    const slot = findDirectSlotNode(e, el.shadowRoot);
    slot && el.slotchangeCallback(slot.directSlotNode, slot.indirectness, e);
  });
}
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
      naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, event){
      console.log("FamilyPhoto", indirectness, event.composedPath());
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
      naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, event){
      console.log("WoodenFrame", indirectness, event.composedPath());
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
      naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, event){
      console.log("BronzeLabel", indirectness, event.composedPath()); 
    } 
  }
  customElements.define("bronze-label", BronzeLabel);
  customElements.define("wooden-frame", WoodenFrame);
  customElements.define("family-photo", FamilyPhoto);
 
  const familyPhoto = document.querySelector("family-photo");

setTimeout(()=>{
  console.log("-----------------------------------")
  const addedImg = document.createElement("img")
  addedImg.src = "https://images.pexels.com/photos/12971/pexels-photo-12971.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125";
  familyPhoto.appendChild(addedImg);  
}, 1000); 

setTimeout(()=>{
  console.log("-----------------------------------")
  const addedLabel = document.createElement("div");
  addedLabel.setAttribute("slot", "label");
  addedLabel.innerText = " by orstavik";
  familyPhoto.appendChild(addedLabel); 
}, 2000);  

</script> 
```
This example illustrates the number of different direct and indirect `slotchange` events 
that gets triggered as custom elements and `<SLOT>`s are used inside each other and chained.
We will return to the initial events in this example in the next chapter, but 
here we will focus on the events that are triggered when new elements are added to the `familyPhoto`
in the two `setTimeout`s.

From the first `setTimeout`, an new `<img>` is added under the `<family-photo>`. 
As it has no `slot` attribute, it is forwarded into `<wooden-frame>`.
This triggers the `slotchange` listeners in both:
 1. `<wooden-frame>` that an indirect (1) `slotchange` event has occured, and
 2. `<family-photo>` that an direct (0) `slotchange` event has occured.

This matches what the console prints:
```
WoodenFrame 1 (6) [slot, slot, div, document-fragment, wooden-frame, document-fragment] <slot>​…​</slot>​
FamilyPhoto 0 (6) [slot, slot, div, document-fragment, wooden-frame, document-fragment] <slot>​…​</slot>​
```

In the next `setTimeout`, a new `<div slot="label">` is added under the `<family-photo>`.
This `<div>` is forwarded into `<bronze-label slot="label">` element.
However, `<bronze-label slot="label">` is itself slotted into the `<wooden-frame>`.
Because of this nesting, `<wooden-frame>` also gets alerted about the change.
And the console prints:

```
BronzeLabel 1 (10) [slot, slot, document-fragment, bronze-label, slot, div, div, document-fragment, wooden-frame, document-fragment] <slot>​…​</slot>​
WoodenFrame 4 (10) [slot, slot, document-fragment, bronze-label, slot, div, div, document-fragment, wooden-frame, document-fragment] <slot name=​"label">​…​</slot>​
FamilyPhoto 0 (10) [slot, slot, document-fragment, bronze-label, slot, div, div, document-fragment, wooden-frame, document-fragment] <slot name=​"label">​…​</slot>​
```

The problem we need to address is the `WoodenFrame 4 ...` log.
Due to the makeup of the event path for `slotchange` here, the `<wooden-frame>` shadowRoot 
also intercepts the slotchange event of one of its grandchildren, a non-child descendants.
This is not desired. And here is why.

When HTML are composed, it would technically be possible to alert all elements about changes not only
to their immediate children, but also their grandchildren, great-grandchildren, great-great-grandchildren
etc. etc. But. This would not scale well. First of all, to implement such a structure, the number of 
elements that would need to be observed, *and* the number of `slotchange` events that would be 
listened to would rise exponentially. Second, the complexity for the poor developer trying to keep
control of the elements that would be affected by his or her changes, would an exponentially larger number 
of elements and branches to contend to. Therefore, changes to grandchildren and lower descendants are
not considered a `slotchange`; *only* changes to immediate children of the `host` node are.

We should therefore *not* listen for the indirect `slotchange` event in `<wooden-frame>` neither.
It is a granchild `slotchange` event. It is a private matter between the `<slot name="label"></slot>`
and its direct parent `<bronze-label slot="label">`.
**`slotchange` only concerns a custom element and its direct children**, 
other elements intercepting such communication are *SlotchangeEavesdropping*.

## Processing `slotchange` 3: `findDirectSlotNode` without SlotchangeEavesdropping

We do not want to eavesdrop. Nobody does. It is impolite. 
And we especially do not want others to eavesdrop on us.
So, we want to clear away indirect event listeners for grandchildren.

Thankfully, the method of doing so is super simple.
If there is another element that is *not* a `<SLOT>` in the `composedPath()`
before a directSlotNode is found, that slotchange is *not for us*.
This leads to a universal, simple algorithm for processing **all** slotchange events that
will return the directSlotNode, the level of indirectness and filter out SlotchangeEavesdropping.

```javascript
function findDirectSlotNode(e, shadowRoot){
  const path = e.composedPath();
  for(let i = 0; i < path.length -1; i++){
    let node = path[i];
    if (node.tagName !== "SLOT")
      return null;
    if (node.getRootNode() === shadowRoot)
      return {directSlotNode: node, indirectness: i};
  }
  return null;
}
```

## A naive `slotchangeCallback`

There is dry gunpowder in the above paragraphs. Let's look at the fireworks. Since:
1. all `slotchange` events of interest, ie. both direct and indirect, can be captured with a single
   `this.shadowRoot.addEventListener("slotchange", ...)`, 
2. all `slotchange` event listeners must ensure that they work on the directSlotNode, and not the target, and
3. indirect SlotchangeEavesdropping events should be avoided in all instances for the same reason that
   direct `slotchange` events avoids them, then
   
**BANG!** it *is* both *possible* and *desireable* to create 
**a single, unified `slotchange` listener in all custom elements** (that uses process `slotchange` events).

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
    const slot = findYourOwnSlot(e, el.shadowRoot);
    slot && el.slotchangeCallback(slot.directSlotNode, slot.indirectness, e);
  });
}
```
 * The only drawback/dependency of this function is that the custom element
   that it is applied to, must have an open `.shadowRoot`.

## Example: GrandpaInAFrame without SlotchangeEavesdropping

We conclude this chapter with our previous example, corrected not to eavesdrop on indirect grandchild 
`slotchange` events. In the next chapter we will look at the multitude of initial `slotchange` events 
that you see in the example, why they arise and how to best resolve the issue:
[Problem: DeclarativeResolution](../chapter4_slotCallback/Problem_DeclarativeResolution.md).

```html
<family-photo>
  <img src="https://images.pexels.com/photos/1146603/pexels-photo-1146603.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125" alt="grandpa">
  <span slot="label">My internet family</span>
</family-photo>
 
<script type="module">
  function findDirectSlotNode(e, shadowRoot){
    const path = e.composedPath();
    for(let i = 0; i < path.length -1; i++){
      let node = path[i];
      if (node.tagName !== "SLOT")              //[no eavesdropping]
        return null;                            //[no eavesdropping]
      if (node.getRootNode() === shadowRoot)
        return {directSlotNode: node, indirectness: i};
    }
    return null;
  }
  function naiveSlotchangeCallback(el){
    el.shadowRoot.addEventListener("slotchange", e => {   //[*]
      const slot = findDirectSlotNode(e, el.shadowRoot);
      slot && el.slotchangeCallback(slot.directSlotNode, slot.indirectness, e);
    });
  }
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
      naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, event){
      console.log("FamilyPhoto", indirectness, event.composedPath());
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
      naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, event){
      console.log("WoodenFrame", indirectness, event.composedPath());
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
      naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, event){
      console.log("BronzeLabel", indirectness, event.composedPath()); 
    } 
  }
  customElements.define("bronze-label", BronzeLabel);
  customElements.define("wooden-frame", WoodenFrame);
  customElements.define("family-photo", FamilyPhoto);
 
  const familyPhoto = document.querySelector("family-photo");

setTimeout(()=>{
  console.log("-----------------------------------")
  const addedImg = document.createElement("img")
  addedImg.src = "https://images.pexels.com/photos/12971/pexels-photo-12971.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125";
  familyPhoto.appendChild(addedImg);  
}, 1000); 

setTimeout(()=>{
  console.log("-----------------------------------")
  const addedLabel = document.createElement("div");
  addedLabel.setAttribute("slot", "label");
  addedLabel.innerText = " by orstavik";
  familyPhoto.appendChild(addedLabel); 
}, 2000);  

</script>
```
## References

