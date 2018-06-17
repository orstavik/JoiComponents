# `MutationObserver` and `slotchange`

## `MutationObserver`

The DOM is dynamic. 
Using JS, developers add and remove nodes in the DOM all the run-time.
In the normal DOM, such changes are observed using the `MutationObserver` API.

```javascript
function onChange(changes) {
  for (let c of changes) {
    console.log(c.target, "'s .children have changed.");
  }
}
const someElement = document.createElement("div");
const myObserver = new MutationObserver(onChange);
myObserver.observe(someElement, {childList: true});
someElement.appendChild(document.createElement("span"));    //someElement's children have changed.
```

The `MutationObserver` observes changes in the list of `.children` of individual DOM nodes.
You create a `MutationObserver` object with  a particular function, and 
then you register a particular node and what type of mutation in the DOM you would like to observe.
Then, when such a mutation happens to the DOM, the function is run.

This function is given the list of all the changes for all the changes you asked for on that object.
(But if you only specified `childList: true`, this list contains only one entry).
And then you can add the reaction you need to the change. 
The MutationObserver does not work for recursive changes, 
and so if you for example need to observe changes in the entire DOM, 
you would need to add such `MutationObserver`s to all DOM nodes with children.

## `slotchange`
Inside the shadowDOM the monitoring of childNodes is a little bit different.
First of all, a shadowDOM is:
1. supposed to be *much* smaller than a normal DOM,
2. the shadowDOM are often rarely be dynamically changed, and 
3. if changed, these changes should originate from code within the customElement itself.

>Changes of a custom elements shadowDOM should only be performed 
from within the class definition of said custom element.

Therefore, you don't really need MutationObserver's inside a shadowDOM.
If the DOM dynamically changes, you should be able to see exactly 
where and when that occurs inside the same code where the DOM is specified.
And because you should only dynamically change the shadowDOM from 
where you also specify it, changes of the DOM can easily be managed proactively 
where they are triggered, as opposed to reactively from an observer.

> Using a `MutationObserver` inside a shadowDOM is likely a symptom of a bloated custom element or 
a custom element whose shadowDOM is reached into from the outside (cf. anti-pattern reaching).
  
However, inside the shadowDOM there can also be `<slot>`s.
And the `assignedNodes()` of these `<slot>`s can change.
Such changes will change the nodes that will be displayed in the flattened DOM,
and sometimes we need to be notified of that. Enter `slotchange` event.

The `slotchange` event is dispatched every time the `assignedNodes` of a `slot` changes.
But, there are some inconveniences with the `slotchange` event.

First inconvenience is that `slotchange` does not bubble. 
This means that you must add the `slotchange` event listener directly on each `slot` node, 
as opposed to one common `slotchange` event listener on `this.shadowRoot`.

The second inconvenience is that `slotchange` is not fired the first time a slot 
gets `assignedNodes` in Safari, while it is fired in Chrome and the polyfill. 
This difference must be harmonized.

## Example 1: listening for slotchanges directly in a custom element
In this example we will look at a component that reacts to the changes of any of its slots.

In order to tackle the problem of Safari not dispatching the initial `slotchange` event that
Chrome and the polyfill does, we will:
1. trigger the reaction of a `slotchange` manually at startup so that you ensure that 
the initial trigger is executed in any browser (ie once in Safari and twice in Chrome),
2. cache the result of the `flattenedChildren` on the host node for these reactions, and
3. make sure that `slotchangedCallback()` is not called unless the element's `flattenedChildren` 
really has changed.

```javascript
import {flattenedChildren} from "./flattenedChildren.js";

function getNecessarySlots(el) {
  const slots = el.querySelectorAll("slot");
  const res = [];
  for (let i = 0; i < slots.length; i++) {
    let slot = slots[i];
    let name = slot.getAttribute("name");
    if (!name || name === "")
      return [slot];
    res.push(slot);
  }
  return res;
}

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

class SlotchangeComponent extends HTMLElement {
    
  constructor(){
    super();
    this._slotListener = (e) => this._triggerSlotchangeCallback(e);
    this._slots = [];
    this._flattenedChildren = undefined;
  }
  
  connectedCallback(){
    this.shadowRoot.innerHTML= `
      <div id="one">
        <slot name="one"></slot>
      </div>
      <div id="two">
        <slot></slot>
      </div>`;
    this.addSlotListeners();
    this._triggerSlotchangeCallback(null);
  }
  
  disconnectedCallback(){
    this.removeSlotListeners();
  }
  
  addSlotListeners(){
    this._slots = getNecessarySlots(this.shadowRoot);
    for (let slot of this._slots)
      slot.addEventListener("slotchange", this._slotListener);
  }
  
  removeSlotListeners(){
    for (let slot of this._slots)
      slot.addEventListener("slotchange", this._slotListener);
    this._slots = [];
  }
  
  _triggerSlotchangeCallback(e){
    const old = this._flattenedChildren;
    const nevv = flattenedChildren(this);
    if (arrayEquals(old, nevv))
      return;
    this._flattenedChildren = nevv;
    this.slotchangedCallback(nevv, old, e);
  }
  
  slotchangedCallback(newFlattenedChildren, oldFlattenedChildren, event){
    //all the slottable flattenedChildren of the component would be
    const allChildrenFlattened = flattenedChildren(this.shadowRoot);
    //when the slot event is triggered, you can do this as well
    if (event) {
      const slot = event.currentTarget;                           
      const slotParent = slot.parent;
      const newFlattenedChildren = flattenedChildren(slotParent); 
    }
    console.log("some slot has changed");
  }
}
```
There is a lot of code here that we use to solve two issues:                                            
1. `slotchange` does not bubble. 
To tackle this issue, we must search for either a no-name slot or all the named slots
inside the shadowDOM and add event listener for `slotchange` to all these nodes,
and clean it up. Phu.. its a mouthful.
2. the disharmony between `slotchange` in Safari and Chrome.
To fix this problem, we cache the value of the transposable nodes between each potential triggering
`slotchange` event. This ensures that the `slotchangedCallback(...)` will only be called once
every time there is a change, regardless of how many times it is attempted triggered.

This is starting to become complex, so we would like to isolate that in a functional mixin.

## References
* https://github.com/webcomponents/gold-standard/wiki/Content-Changes
* https://github.com/webcomponents/gold-standard/wiki/Content-Assignment
* https://github.com/webcomponents/gold-standard/wiki/Detachment                                  
* https://www.polymer-project.org/2.0/docs/devguide/shadow-dom#observe-nodes
* https://www.polymer-project.org/2.0/docs/api/classes/Polymer.FlattenedNodesObserver
* https://github.com/w3c/webcomponents/issues/493#issuecomment-218077582
* https://dom.spec.whatwg.org/#mutation-observers
* https://github.com/whatwg/dom/issues/126
 
## Acknowledgments
Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
