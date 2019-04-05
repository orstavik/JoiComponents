# Pattern: SlottablesEvent

## Theory: Slottables vs. Slotted

Before we dive into the implementation of this mixin, we need to establish two terms: 

 * **Slotted**: DOM nodes that *have been* transposed ('slotted') into a `<slot>` element in the 
   shadowDOM of a web component. The `slotchange` event alert about nodes that *has been transposed*.
   
   In the flattened DOM, the nodes that are transposed/slotted into a `<slot>` element is contained
   within that `<slot>` and hence its parent web component. The transposed nodes is part of 
   the *inner state* of a web component in the flattened DOM. This means that the `slotchange` event:
    * **directly** reflect a change of the **inner state** of the web component's shadowDOM that is  
    * **indirectly** a reflection of a change of the **outer state** surrounding the web component's 
      host node in the lightDOM. 
   
 * **Slottables**: DOM nodes that *can be* transposed ('slotted') into a `<slot>` element in the
   shadowDOM of a web component. Slottables are nodes that *has the potential* to be slotted if
   a corresponding `<slot>` element either exists or will be created. There are no events about such
   an occurrence.

   In the DOM, the slottable nodes are part of the *outer state* of a web component. 
   The slottable nodes *might* be slotted, but they also may not. Thus, if there existed an event
   `slottableschanged`, then this event would:
    * **directly** reflect a change of the **outer state** surrounding the web component's 
      host node in the lightDOM. 

## Implementation: `slottables-changed` event

To implement an event `slottables-changed` cannot be done globally as a ComposedEvent as it requires
the web component to both setup a `MutationObserver(childList)` on its host node, and listen for
the `slotchange` event that is `{composed: false}` and hence will not be available on neither 
the `window` nor `document`. Instead, we use the EventRecording pattern to create a mixin that will
dispatch a `{composed: false, bubbles: false}` event on the web component host node.

The mixin will:
1. when the element is constructed, process it at the end of its construction cycle, just like
   SlotchangeMixin.
2. Instead of adding an event listener on the `shadowRoot`, the mixin will register the element with a
   `MutationObserver({childList: true})` instance. 
3. In addition, the mixin will listen for `slotchange` events on the host node(!) As you may know,
   this event listener *will not* capture `slotchange` events from inside the web component. But(!),
   due to the particulars of the flattened DOM and SlotMatroska, the `slotchange` events from the
   chained `<slot>` elements *will* pass by the host node. Thus, we are using the extremely strange
   behavior of `slotchange` events to replace it, turning a big weakness into a boon. 
   This is so clever I am falling of the chair, blowing my own mind and feeling very good about 
   myself right now! :)
4. As the `slottables-changed` event is fired on the host node, it is accessible both from the
   lightDOM and shadowDOM.
5. As the `slottables-changed` event doesn't bubble, it is quite safe and will not be susceptible for
   SlotchangeNipSlip-like problems nor SlotchangeSurprises.
6. At startup, the mixin will need to sort the list of childNodes into `slot`->`name` groups.
7. Whenever the `slottables-changed` event arises, the mixin will need check which `slot`->`name` group(s)
   where affected by the change. When the MutationObserver triggers, this will require a full check of 
   the childNodes. When the slotchange event triggers, this will require the check of the `<slot>` 
   elements among those children.
8. Before dispatching the `slottables-changed` event, the mixin will try to find a `<slot>` element in 
   the shadowDOM matching the given `slot`->`name` group. 
   * If it does, it will put that slot as part of the `slottables-changed` event detail.
   * If it does not, it will instead add a Slottables object which has methods for 
     `assignedNodes({flatten: true})` and `.childNodes`.
9. The `slottables-changed` event does **not depend on the web component having a shadowDOM**.
   It is practically independent (only relies on MutationObserver and slotchange events themselves).

```javascript
class Slottables {
  constructor(name, assignables) {
    this.name = name;
    this.assignables = assignables || [];
  }

  assignedNodes(opt) {
    if (!opt || !opt.flatten)
      return this.assignables;
    let res = [];
    for (let n of this.assignables) {
      if (n.tagName === "SLOT") {
        const flat = n.assignedNodes({flatten: true}).length;
        flat.length ? res = res.concat(flat) : res.push(flat);
      } else
        res.push(n);
    }
    return res;
  }
}

function notNipSlip(composedPath, host) {
  for (let node of composedPath) {
    if (node.tagName !== "SLOT")
      return null;
    if (node.parentNode === host)
      return node;
  }
  return null;
}

function mapNodesBySlotAttribute(nodes) {
  const res = {};
  for (let n of nodes) {
    let name = n.getAttribute ? (n.getAttribute("slot") || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function getSlotIfAny(el, name) {
  const q = name === "" ? 'slot:not([name]), slot[name=""]' : 'slot[name="' + name + '"]';
  return el.shadowRoot ? el.shadowRoot.querySelector(q): undefined;
}

function dispatchSlottablesEvent(el, name) {
  const slot = getSlotIfAny(el, name) || new Slottables(name, el[nameNodesMap][name]);
  const event = new CustomEvent("slottables-changed", {composed: false, bubbles: false, detail: {slot}});
  el.dispatchEvent(event);
}

function checkSlotchange(slotchange) {
  const slot = notNipSlip(slotchange.composedPath(), this);
  const slotName = slot.getAttribute("slot") || "";
  slot && dispatchSlottablesEvent(this, slotName);
}

function childListsAreTheSame(oldList, newList) {
  if (!oldList || !newList || newList.length !== oldList.length)
    return false;
  for (let i = 0; i < newList.length; i++) {
    if (newList[i] !== oldList[i])
      return false;
  }
  return true;
}

function compareSlotNameMaps (newMap, oldMap) {
  if (!oldMap)
    return Object.keys(newMap);
  // if (!newMap)
  //   return Object.keys(oldMap);
  const res = [];
  for (let key of Object.keys(newMap)) {
    if (!childListsAreTheSame(newMap[key], oldMap[key]))
      res.push(key);
  }
  for (let key of Object.keys(oldMap)) {
    if (!newMap[key])
      res.push(key);
  }
  return res;
}

function childNodesChanged(el) {
  const newMap = mapNodesBySlotAttribute(el.childNodes);
  const diffs = compareSlotNameMaps(newMap, el[nameNodesMap]);
  el[nameNodesMap] = newMap;
  for (let slotName of diffs)
    dispatchSlottablesEvent(el, slotName);
}

function childNodesChangedObserver(data) {
  for (let d of data)
    childNodesChanged(d.target);
}

const childNodesObs = new MutationObserver(childNodesChangedObserver);

function setupNow(el) {
  childNodesObs.observe(el, {childList: true});
  el.addEventListener("slotchange", checkSlotchange.bind(el));
  childNodesChanged(el);
}


function setup(el) {
  Promise.resolve().then(function () {
    Promise.resolve().then(function () {
      setupNow(el);
    });
  });
}

if (document.readyState === "loading") {
  const que = [];
  const cachedSetup = setup;
  setup = function (el) {
    que.push(el);
  };
  document.addEventListener("DOMContentLoaded", function () {
    setup = cachedSetup;
    for (let el of que)
      setupNow(el);
  });
}

const nameNodesMap = Symbol("nameNodesMap");

export function SlottablesEvent(base) {
  return class SlottablesEvent extends base {

    constructor() {
      super();
      setup(this);
      this[nameNodesMap] = {};       //slotNameString -> [nonFlattenNodes]
    }
  }
}
```

## Demo: SlottablesEvent

```html
<template>
  <style>
    div { border: 4px solid green; }
  </style>
  <div>
    <slot>Hello sunshine</slot>
  </div>
</template>

<script type="module">

  import {SlottablesEvent} from "../../src/slot/SlottablesEvent.js";

  class GreenFrame extends SlottablesEvent(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const templ = document.querySelector("template").content.cloneNode(true);
      this.shadowRoot.appendChild(templ);
      this.addEventListener("slottables-changed", function(e){
        console.log(this.id, e.detail, e);
      }.bind(this));
    }
  }

  customElements.define("green-frame", GreenFrame);

  setTimeout(function () {
    const two = document.querySelector("#two");
    two.innerHTML = "";
    const one = document.querySelector("#one");
    one.innerHTML = "<green-frame id=\"four\"></green-frame>";
  }, 1000);
</script>
<green-frame id="one"></green-frame>
<green-frame id="two"><h1>hello sunshine</h1>¯\_(ツ)_/¯</green-frame>
<green-frame id="three"><h1>hello sunshine</h1><h2 slot="nowYouSeeMe"></h2>¯\_(ツ)_/¯</green-frame>

<pre>
two {slot: slot}
three {slot: slot} 
three {slot: Slottables} 
two {slot: slot} 
one {slot: slot} 
//it doesn't print #four, nor "one, because there never are any slottables being added.
</pre>
```

`slottables-changed` event does not alert the developer:
1. when the element starts with its fallback nodes, it doesn't handle the initial fallback nodes state.
2. when a slot element is dynamically added to the shadowRoot after setup, *and* this `<slot>` uses
   its fallback nodes by default.
3. when the childNodes of a slot element in fallbackMode is dynamically altered.

`slottables-changed` event only handles the outer changes.

## References

 * 
