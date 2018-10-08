# Mixin: `Slottable`

## Motivation

As we have seen, `slotchange` is a vehicle that enables a custom element to *react* to 
"things being slotted".
But. `slotchange` excludes unassignable slottable-mutations. But why is that an issue?
What would be the purpose of listening for slottable-mutations that 
would not directly result in "nothing being slotted"?
The principle purpose of reacting to something that would not be slotted, is 
**to make the unslottable slottable**.

That is the principle usecase. Completely non-intelligeble. We need a practical usecase.
Let's say we wan't to make a list. This list should be sorted, like a good old fashioned `<OL>`.
But, we have some extra requirements.
First, we wan't it to be sparse. The list should not populate all the numbered positions, 
but be able to only include for example the numbers 1, 4, 7, 8, 9, and 42.
Second, the list does not know which numbers it will contain in advance. 
If we knew that, well, that would be cheating.
Third, the list might contain multiple entries under each number.
And forth, items might be added to the list in random order, but should be displayed orderly.
Without altering the original order. Which would be cheating.
We need a `SparseSortedList`.

But, to make `SparseSortedList` as an HTML custom element we need a new resource: 
a `slottablechange` event, or rather a `slottableCallback(...)`.

## `slottableCallback(...)`

There is a pattern that addresses the three `slotchange` issues.
This pattern must first avoid reacting to internal slot-mutations.
Second, it should listen to all slottable-mutations, assignable or not, direct and indirect.
When this event occurs on an element, we want method `slottableCallback()` to be triggered.

`slottableCallback(...)` a reactive method that trigger on all external slottable-mutation, 
both direct and indirect, assignable and unassignable.
The callback has three parameters: `slottableCallback(Slottables, indirectness, indirectSlotchangeEvent)`.
The `Slottables` is an object that mimics the `HTMLSlotElement`
and thus provides a `.name`, `.assignedNodes({flatten: true})`, 
and `.assignedElements({flatten: true})`.

To achieve this pattern requires several steps and components.
In order to fully understand these components, we will present them one by one.

## Class: `Slottables`

External slottables-mutations may or may not be connected to a corresponding `<SLOT>` element.
Therefore, we need another container for the slot-name and assignedNodes data.
This unit we set up as a class `Slottables`.
In addition to house the name and directly assignable nodes, `Slottables` also provides
the methods `.assignedNodes()` and `assignedElements()` with the option `{flatten: true}`.

```javascript
class Slottables {
  constructor(name, assigneds) {
    this.name = name;
    this.assigneds = assigneds;
  }

  assignedNodes(config) {
    if (!(config && config.flatten === true))
      return this.assigneds;
    let res = [];
    if (!this.assigneds)
      return res;
    for (let n of this.assigneds) {
      if (n.tagName === "SLOT" && n.getRootNode().host) { //if(node instanceof HTMLSlotElement) does not work in polyfill.
        const flat = n.assignedNodes({flatten: true});
        res = res.concat(flat);
      } else
        res.push(n);
    }
    return res;
  }

  assignedElements(config) {
    return this.assignedNodes(config).filter(n => n.nodeType === Node.ELEMENT_NODE);
  }  
}
```

## Observe direct slottable mutations

To observe direct slottable-mutations we need to monitor changes in 
the custom element's `host` node's `childList`.         
This is done manually when the observation starts, and 
then a mutation observer is added to monitor and react to any subsequent changes.

Every time a `host` node's `childList` changes, the observing method needs to map
the `childNodes` based on their `slot` attribute. 
It compares each of these `Slottables` set with the previous result for the same `slot` name.
For every set of `Slottables` added or removed or changed, it triggers a reaction.

```javascript
const slottables = Symbol("slottables");

function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function arrayEquals(a, b) {
  return b && a && a.length === b.length && a.every((v, i) => v === b[i]);
}

function indirectSlottableMutation(el, ev) {
  let path = ev.composedPath();
  for (let i = 0; i < path.length; i++) {
    let slot = path[i];
    if (slot.tagName !== "SLOT")
      return;                                             //no eavesdropping
    if (slot.parentNode === el) {
      const slotName = slot.getAttribute("slot") || "";
      el.slotCallback(el[slottables][slotName], i + 1, ev);  //found the right slot and triggering callback
      return;
    }
  }
}

function directSlottableMutation(changes) {
  const el = changes[0].target;
  const newSlottables = mapNodesByAttributeValue(el.childNodes, "slot");
  for (let name in el[slottables]) {
    if (newSlottables[name] === undefined) {
      delete el[slottables][name];                           //deleted
      el.slotCallback(new Slottables(name, null));
    }
  }
  for (let name in newSlottables) {
    let nodes = newSlottables[name];
    if (!el[slottables][name])                               //added
      el.slotCallback(el[slottables][name] = new Slottables(name, nodes));
    if (!arrayEquals(nodes, el[slottables][name].assigneds)) //changed
      el.slotCallback(el[slottables][name] = new Slottables(name, nodes));
  }
}

const mo = new MutationObserver(directSlottableMutation);

function SlottableCallback(el) {
  el[slottables] = {};
  mo.observe(el, {childList: true});
  el.addEventListener("slotchange", e => indirectSlottableMutation(el, e));

  const map = mapNodesByAttributeValue(el.childNodes, "slot");
  if (Object.keys(map).length === 0) map[""] = [];
  for (let name in map)
    el.slotCallback(el[slottables][name] = new Slottables(name, map[name]));
}
```

To exclude unassigned slottable-mutations requires a filter of elements that verify the existence 
of a slot in the shadowDOM of the element:
`!!el.shadowRoot.queryselector('slot[name="slottableName"]')`
However, this makes the concept of slottable slightly more complex,
as one needs to know about such events not occuring.
It also has a minor computation cost for all events.
And it completely wipes out a very strong usecase. 

## Observe indirect slottable mutations

There is a trick to observe indirect slottable-mutations:
Add a `slotchange` event listener *on the `host` node(?!)*.
Adding a `slotchange` event listener on the `host` node will 
capture all `slotchange` events that bubbles from any `<SLOT>` elements among that `host` node's children.
By applying the SlotchangeEavesdropping and findsMySlot algorithms,
such a listener will filter out any irrelevant `slotchange` events efficiently and 
trigger exclusively for all indirect slottable-mutations for that element.

```javascript
function indirectSlottableMutation(el, ev){
  let path = ev.composedPath();
  for (let i = 0; i < path.length; i++) {
    let slot = path[i];
    if (slot.tagName !== "SLOT")
      return;                                             //no eavesdropping
    if (slot.parentNode === el){
      const slotName = slot.getAttribute("slot") || "";
      el.slottablesCallback(el.slottables[slotName], i+1, ev);  //found the right slot and triggering callback
      return;
    }
  }
}

el.addEventListener("slotchange", ev => indirectSlottableMutation(el, ev));
```

## Mixin: `SlottableMixin`

We can now put all this together in a mixin.
Adding this mixin provides the custom element with a 
`slottableCallback(slottables, indirectness, indirectSlotchangeEvent)`. 
`slottableCallback(...)` strongly resembles `slotchangeCallback(...)` from previous chapter, 
except that it:
 * excludes all triggers for internal slot-mutations, 
 * includes triggers for external unassignable slottable-mutations, and
 * pass a `Slottables` instead of a `<SLOT>` node as its first parameter.

```javascript
/**
 * BatchedPostConstructorCallback
 */
function findLastNotChecked(toRun, hasRun) {
  for (let i = toRun.length - 1; i >= 0; i--) {
    let el = toRun[i];
    if (hasRun.indexOf(el) < 0)
      return el;
  }
  return null;
}

//Ques for batched tasks
let startedQue = [];
let completed = [];
let isStarted = false;

//First, block flushing of the que until DCL, and on DCL, open the que and try to flush it
let dcl = document.readyState === "complete" || document.readyState === "loaded";
dcl || window.addEventListener("DOMContentLoaded", function () {
  dcl = true;
  flushQue();
});

//process for flushing que
function flushQue() {
  //step 1: check that dcl is ready.
  if (!dcl) return;
  //step 2: all elements started has been processed? reset and end
  const fnel = findLastNotChecked(startedQue, completed);
  if (!fnel) {
    startedQue = [];
    completed = [];
    return;
  }
  //step 3: run function, add the element to the completed list, and run again with TCO
  fnel[0](fnel[1]);
  completed.push(fnel);
  flushQue();
}

function batchedConstructorCallback(fn, el) {
  startedQue.push([fn, el]);
  if (!isStarted) {
    isStarted = true;
    Promise.resolve().then(() => {
      Promise.resolve().then(() => {
        flushQue();
        isStarted = false;
      });
    });
  }
}

/**
* SLOTTABLES
*/
class Slottables {
  constructor(name, assigneds) {
    this.name = name;
    this.assigneds = assigneds;
  }

  assignedNodes(config) {
    if (!(config && config.flatten === true))
      return this.assigneds;
    let res = [];
    if (!this.assigneds)
      return res;
    for (let n of this.assigneds) {
      if (n.tagName === "SLOT" && n.getRootNode().host) { //if(node instanceof HTMLSlotElement) does not work in polyfill.
        const flat = n.assignedNodes({flatten: true});
        res = res.concat(flat);
      } else
        res.push(n);
    }
    return res;
  }

  assignedElements(config) {
    return this.assignedNodes(config).filter(n => n.nodeType === Node.ELEMENT_NODE);
  }
}

/**
* SLOTTABLE CALLBACK
*/
const slottables = Symbol("slottables");

function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function arrayEquals(a, b) {
  return b && a && a.length === b.length && a.every((v, i) => v === b[i]);
}

function indirectSlottableMutation(el, ev) {
  let path = ev.composedPath();
  for (let i = 0; i < path.length; i++) {
    let slot = path[i];
    if (slot.tagName !== "SLOT")
      return;                                             //no eavesdropping
    if (slot.parentNode === el) {
      const slotName = slot.getAttribute("slot") || "";
      el.slotCallback(el[slottables][slotName], i + 1, ev);  //found the right slot and triggering callback
      return;
    }
  }
}

function directSlottableMutation(changes) {
  const el = changes[0].target;
  const newSlottables = mapNodesByAttributeValue(el.childNodes, "slot");
  for (let name in el[slottables]) {
    if (newSlottables[name] === undefined) {
      delete el[slottables][name];                           //deleted
      el.slotCallback(new Slottables(name, null));
    }
  }
  for (let name in newSlottables) {
    let nodes = newSlottables[name];
    if (!el[slottables][name])                               //added
      el.slotCallback(el[slottables][name] = new Slottables(name, nodes));
    if (!arrayEquals(nodes, el[slottables][name].assigneds)) //changed
      el.slotCallback(el[slottables][name] = new Slottables(name, nodes));
  }
}

const mo = new MutationObserver(directSlottableMutation);

function SlottableCallback(el) {
  mo.observe(el, {childList: true});
  el.addEventListener("slotchange", e => indirectSlottableMutation(el, e));

  const map = mapNodesByAttributeValue(el.childNodes, "slot");
  if (Object.keys(map).length === 0) map[""] = [];
  for (let name in map)
    el.slotCallback(el[slottables][name] = new Slottables(name, map[name]));
}

export const SlottableMixin = function (Base) {
  return class SlottableMixin extends Base {

    constructor() {
      super();
      this[slottables] = {};
      batchedConstructorCallback(SlottableCallback, this);
    }
  }
};
```

## Example: SparseList 

`SparseList` has an unknown number of slots. 
The list accepts a variety of `slottable` elements that it will 
wrap in blocks on the screen based on their number value.
To accomplish this task `SparseList` will construct and update its shadowDom *on demand*.
Whenever a new slot
table element is added, `SparseList` will check if it can slot that element, 
If it can, nothing needs to be done.
But if it can't, `SparseList` will create a new `<SLOT>` node for the new slottables in its shadow DOM.

```javascript
function makeTemplate(name){
  const div = document.createElement("div");
  div.innerHTML = `<div style="position:absolute; top: 0; left: -20px;>${name})</div><slot name="${name}"></slot>`;
  return div;
}

class SparseList extends SlottableMixin(HTMLElement) {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  slottableCallback(slottables) {
    const slot = this.shadowRoot.querySelector(`slot[name=${slottables.name}]`);
    if (slottables.assignedNodes().length > 0 && !slot)
      this.shadowRoot.appendChild(makeTemplate(slottables.name));
    else if (slottables.assignedNodes().length === 0 && slot) 
      slot.parentNode.remove();
  }
}
```
`SparseList` can both **react to make the unassignable assignable them**.
And with `slottableCallback` custom elements can both **react** and **declare** slottable structures.

## Discussion: declarative vs imperative consequences.

Internally, the custom element above *reacts imperatively* to create the slottable-to-slot relationship. 
It does not *declare synchronously* slottable-to-slot structure. This might seem like a false move, 
a step that will lead us out on a perilous journey that will end badly.
But, this is not the case. What the above model does is to actually facilitate more 
"declarative synchronous" use of the custom element in the template. 
While the inside of the custom elements changes from
a reactive-declarative to a reactive-imperative model, 
the rest of the insides of the custom element was already reactive-imperative.
The consequence is mainly that new reactive powers in the custom element enables more 
declarative power (and thus need less need for imperative management) in the lightDOM . 
This `SparseList` custom element will just "fit anywhere, anytime". 
It doesn't need manipulation of its children or insides to work. It can simply be declared once, 
and remain there forever. And this becomes especially evident when we do the obvious move of
sorting the slotted nodes in our example: `SparseOrderedList`.

```javascript
function makeTemplate(name){
  const div = document.createElement("div");
  div.innerHTML = `<div style="position:absolute; top: 0; left: -20px;>${name})</div><slot name="${name}"></slot>`;
  return div;
}

class SparseOrderedList extends SlottableMixin(HTMLElement) {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  slottableCallback(slottables) {
    const slot = this.shadowRoot.querySelector(`slot[name=${slottables.name}]`);
    if (slottables.assignedNodes().length > 0 && !slot){
      const slots = this.shadowRoot.querySelectorAll(`slot`);                    //new code starts
      for (let i = 0; i < slots.length; i++){
        const otherSlot = slots[i];
        if (parseInt(otherSlot.name) > parseInt(slottables.name))
          return this.shadowRoot.insertBefore(makeTemplate(slottables.name), otherSlot.parentNode);
      }                                                                          //new code stops
      return this.shadowRoot.appendChild(makeTemplate(slottables.name));      
    }
    else if (slottables.assignedNodes().length === 0 && slot) 
      slot.parentNode.remove();
  }
}
```

## Discussion: Are attributes a viable alternative?

It is possible to make custom elements react-able to slottables without this callback.
The go-to alternative would be to number the list items using an attribute on the child elements.
Then the custom element would need to monitor the children of the host element 
(indirectness is not needed here), and in the custom element callback of this childList observer:
1. add a new slot in the `shadowRoot` (exactly like we did in the example above), and
2. also reach into the lightDOM of the host node and add a corresponding `slot` attribute to the children
in question.

However, such alternatives would essentially need to do all the same tasks that the SlottableMixin is doing for us.
It might be able to skip the indirect unassigned slottables-mutations in some usecases, but not in others.
And, such alternatives using *both* a custom attribute and a slot attribute, would also be vulnerable 
for attribute-race-conditions such as: what if the user directly specifies a `slot` attribute?
What if the user specifies both a different `slot` and a custom attribute?

### OLD: Alternative intro
Our custom element can react to lots of events. 
It can react to being constructed, changes to one of its attributes, to being connected and disconnected,
and via event listeners, a multitude of actions.

But, what if we wanted our custom element to react to new elements being *available* for a
hitherto unknown and non-existing `<SLOT>`.
What if we wanted our custom element to spawn `<SLOT>` elements inside its shadowDOM to suit the
context into which it was placed?

This might sound far fetched and magical, but it really isn't.
We just wish to be able to communicate settings to the custom element without using the 
use the slots in the custom element to also "style" some of the custom elements
content that we can't do via 

## Things to be tested
1. no slotchangeCallback when we add or remove inside slot nodes. 
2. slotchangeCallback when we add or remove slot unassigned slottable nodes 


But. Do we want to do that? 
Regardless of approach, we need to if-check the slottablesCallback on slot.name same as we do 
with attributeChangedCallback on attribute name.

### OLD: Conclusion?
That custom element can morph their inner shadowDom based on external events are nothing new. 
Attributes can be used, as connectedCallback. But, the benefit of using slot to control this change 
is that it can then be done in a single direct step. An alternative approach would be to add a 
special attribute, react to that attribute and make a shadowDom, and then have the custom element 
reach into child of the parent and add a slot attribute also. But, this is more brittle. 
As the slot attribute might be added directly, thus not triggering the necessary 
attributeChangedCallback, etc. Etc.

## References