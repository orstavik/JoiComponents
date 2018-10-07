# Mixin: `Slottable`

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
function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function compareSlottables(name, nodeList, slottables){
  if (!nodeList)
    return null;
  if (!slottables || slottables.name !== name || nodeList.length !== slottables.assigneds.length)
    return new Slottables(name, nodeList);
  for(let i = 0; i < nodeList.length; i++){
    if (nodeList[i] !== slottables.assigneds[i])
      return new Slottables(name, nodeList);
  }
  return slottables;
}

function directSlottableMutation(changes){
  const change = changes[changes.length-1];
  const el = change.target;
  const mapOfAssignableNodes = mapNodesByAttributeValue(el.childNodes, "slot");
  const allNames = [...new Set([...Object.keys(mapOfAssignableNodes), ...Object.keys(el.slottables)])];
  for (let name of allNames){
    const oldSlottables = el.slottables[name];
    const updatedSlottables = compareSlottables(oldSlottables, name, mapOfAssignableNodes[name]);
    if (updatedSlottables !== oldSlottables) {
      el.slottablesCallback(updatedSlottables, 0, undefined);
      if (updatedSlottables === null)
        delete el.slottables[name];
      else
        el.slottables[name] = updatedSlottables;
    }
  }
}

const observer = new MutationObserver(directSlottableMutation);

export function NaiveSlottableCallback(el){
  observer.observe(el, {childList: true});
  //manually trigger an initial slottableCallback() for all slottables
  el.slottables = {};
  const mapOfAssignableNodes = mapNodesByAttributeValue(el.childNodes, "slot");
  for (let name of Object.getOwnPropertyNames(mapOfAssignableNodes)){
    el.slottables[name] = new Slottables(name, mapOfAssignableNodes[name]);
    el.slottableCallback(el.slottables[name], 0, undefined);
  }
}
```

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
    if (slot.parentNode === this){
      const slotName = slot.getAttribute("slot") || "";
      this.slottablesCallback(el.slottables[slotName], i+1, ev);  //found the right slot and triggering callback
      return;
    }
  }
}

el.addEventListener("slotchange", ev => indirectSlottableMutation(el, ev));
```

## Mixin: `SlottableMixin`

We can now put all this together in a mixin that we can add to custom elements.
This mixin provides the custom element with a 
`slottableCallback(slottables, indirectness, indirectSlotchangeEvent)` 
that function identically to the
`slotchangeCallback(slot, indirectness, slotchangeEvent)` from previous chapter, 
except that it:
 * excludes all triggers for internal slot-mutations, 
 * includes triggers for external unassignable slottable-mutations, and
 * pass a `Slottables` instead of a `<SLOT>` node as its first parameter.
 
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

function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

const observer = new MutationObserver(directSlottableMutation);

function directSlottableMutation(changes){
  const change = changes[changes.length-1];
  const el = change.target;
  const mapOfAssignableNodes = mapNodesByAttributeValue(el.childNodes, "slot");
  const allNames = [...new Set([...Object.keys(mapOfAssignableNodes), ...Object.keys(el.slottables)])];
  for (let name of allNames){
    const oldSlottables = el.slottables[name];
    const updatedSlottables = Slottables.update(oldSlottables, name, mapOfAssignableNodes[name]);
    if (updatedSlottables !== oldSlottables) {
      el.slottablesCallback(updatedSlottables, 0, undefined);
      if (updatedSlottables === null)
        delete el.slottables[name];
      else
        el.slottables[name] = updatedSlottables;
    }
  }
}

function indirectSlottableMutation(el, ev){
  let path = ev.composedPath();
  for (let i = 0; i < path.length; i++) {
    let slot = path[i];
    if (slot.tagName !== "SLOT")
      return;                                             //no eavesdropping
    if (slot.parentNode === this){
      const slotName = slot.getAttribute("slot") || "";
      this.slottablesCallback(el.slottables[slotName], i+1, ev);  //found the right slot and triggering callback
      return;
    }
  }
}

export function NaiveSlottableCallback(el){
  observer.observe(el, {childList: true});
  el.addEventListener("slotchange", ev => indirectSlottableMutation(el, ev));
  //manually trigger an initial slottableCallback() for all slottables
  el.slottables = {};
  const mapOfAssignableNodes = mapNodesByAttributeValue(el.childNodes, "slot");
  for (let name of Object.getOwnPropertyNames(mapOfAssignableNodes)){
    el.slottables[name] = new Slottables(name, mapOfAssignableNodes[name]);
    el.slottableCallback(el.slottables[name], 0, undefined);
  }
}
```

## Example: SparseSortedList

We run it in an example. We see that it hits, it gives us the slottablechanged event. 
We also see that it does not give us a slotchange event whem we add or remove inside slot nodes. 
But, then we see that now we can also get slottableCallbacks when we get slottables that have 
no target slot. Hm.. How to think about that?

Ok, alternative one is to filter them out. That is conceptually simple, 
but the minor computation cost a bit grating. !!shadowDom.queryselector(slot[name=slottableName)

But. Do we want to do that? 
Regardless of approach, we need to if-check the slottablesCallback on slot.name same as we do 
with attributeChangedCallback on attribute name.

And, se have some exciting usecases for "UnassignedSlottables".

Let's say we need to make a shadowDom with an unknown quantity of slots. 
Where we need to wrap the children. Enter : SparseSortedList!

The sparse sorted list uses a rule to sort its slots. You can provide that rule. 
It then will create a shadowDom, that is mostly empty. Then, for every slottableCallback, 
it will create a new slot in its shadowDom, with surrounding elements, and 
then the slottables will *get to be slotted* reactively. The custom element can react to 
slottable changes, not only declare them proactively.

That custom element can morph their inner shadowDom based on external events are nothing new. 
Attributes can be used, as connectedCallback. But, the benefit of using slot to control this change 
is that it can then be done in a single direct step. An alternative approach would be to add a 
special attribute, react to that attribute and make a shadowDom, and then have the custom element 
reach into child of the parent and add a slot attribute also. But, this is more brittle. 
As the slot attribute might be added directly, thus not triggering the necessary 
attributeChangedCallback, etc. Etc.