/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenNodes} from "./flattenedChildren.js";

//todo this also "fixes" the feature that you can have `<slot name="xyz" slot="abc">` described in named-slots chapter..
//todo should we do that, or should we throw an error (no, because the browsers don't do that),
//todo or should we push it to the unnamed slot (no, because I don't think the browsers do that), 
//todo or should we drop it (maybe yes, because I think the browsers maybe do that)?
//todo test this
function flatMap(element, includeOnlySlotNamed) {
  const res = {"": []};
  for (var i = 0; i < element.childNodes.length; i++) {
    var child = element.childNodes[i];

    //todo `<slot name="xyz" slot="abc">`
    //todo, here I will get the "slot" attribute also for slot elements!!
    //todo so, if the parser includes this thing, then this thing should work..
    var slotName = child.getAttribute ? (child.getAttribute("slot") || "") : "";

    if (includeOnlySlotNamed && slotName !== includeOnlySlotNamed)
      continue;
    if (child.tagName === "SLOT")
      res[slotName] = (res[slotName] || []).concat(flattenNodes(child.assignedNodes()));
    else
      (res[slotName] || (res[slotName] = [])).push(child);
  }
  return res;
}

function arrayEquals(a, b) {
  return b && a && a.length === b.length && a.every((v, i) => v === b[i]);
}

const hostChildrenObserver = Symbol("hostChildrenObserver");
const slotchangeListener = Symbol("slotChangedListener");
const hostChildrenChanged = Symbol("hostChildrenChanged");
const addSlotListeners = Symbol("addSlotListeners");
const removeSlotListeners = Symbol("removeSlotListeners");
const hostChildrenSlots = Symbol("hostChildrenSlots");

/**
 * ChildrenChangedMixin adds a reactive lifecycle hook .childrenChangedCallback(...) to its subclasses.
 * This lifecycle hook is triggered every time a potentially assignable node for the element changes,
 * ie. whenever the content of `<slot>.assignedNodes()` would change, regardless of whether or not the
 * element has a shadowRoot or a generic slot in that shadowRoot.
 *
 * .childrenChangedCallback(newFlattenedChildren, oldFlattenedChildren, isSlotChange) is triggered:
 *  1) whenever the slotted content of an element changes and
 *  2) every time the element is connected to the DOM.
 *
 * .childrenChangedCallback(...) is not triggered if there are no differences between the content of the
 * newFlattenedChildren and the oldFlattenedChildren.
 *
 * Gold standard: https://github.com/webcomponents/gold-standard/wiki/
 * a) Detachment: ChildrenChangedMixin always starts observing when it is connected to the DOM and stops when it is disconnected.
 * b) Content assignment: changes to assignedNodes of slotted children are notified as if the change happened to a normal child.
 *
 * @param Base class that extends HTMLElement
 * @returns {ChildrenChangedMixin} class that extends HTMLElement
 */
export const ChildrenChangedMixin = function (Base) {
  return class ChildrenChangedMixin extends Base {

    // slotchangedCallback(slotName, newNodeList, oldNodeList) {}

    constructor() {
      super();
      this[hostChildrenObserver] = new MutationObserver(() => this[hostChildrenChanged]());
      this[slotchangeListener] = (e) => this._triggerSingleSlotchangedCallback(e.currentTarget.name);
      this._assignedMap = {};
      this[hostChildrenSlots] = [];
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this[hostChildrenObserver].observe(this, {childList: true});
      this[hostChildrenChanged]();
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this[removeSlotListeners]();
      this[hostChildrenObserver].disconnect();
    }

    [addSlotListeners]() {
      this[hostChildrenSlots] = [].filter.call(this.children, function (c) {
        return c.tagName === "SLOT";
      });
      for (let i = 0; i < this[hostChildrenSlots].length; i++)
        this[hostChildrenSlots][i].addEventListener("slotchange", this[slotchangeListener]);
    }

    [removeSlotListeners]() {
      for (let i = 0; i < this[hostChildrenSlots].length; i++)
        this[hostChildrenSlots][i].removeEventListener("slotchange", this[slotchangeListener]);
      this[hostChildrenSlots] = [];
    }

    _triggerAllSlotchangedCallbacks() {
      let assignedMap = flatMap(this);
      for (let slotName in assignedMap)
        this._triggerCallback(slotName, assignedMap[slotName], this._assignedMap[slotName]);
      this._assignedMap = assignedMap;
    }

    _triggerSingleSlotchangedCallback(slotName) {
      let assignedMap = flatMap(this, slotName);
      this._triggerCallback(slotName, assignedMap[slotName], this._assignedMap[slotName]);
      this._assignedMap[slotName] = assignedMap[slotName];
    }

    _triggerCallback(slotName, newAssignedNodes, oldAssignedNodes) {
      if (!arrayEquals(newAssignedNodes, oldAssignedNodes))
        this.slotchangedCallback(slotName, newAssignedNodes, oldAssignedNodes);
    }

    [hostChildrenChanged]() {
      if (!this.isConnected)            //if the element is first connected and then disconnected again before the JS stack empties.
        return;
      this[removeSlotListeners]();
      this[addSlotListeners]();
      Promise.resolve().then(() => this._triggerAllSlotchangedCallbacks());
      //Above is the extra trigger needed to fix the missing initial-`slotchange`-event in Safari.
      //We can await this in the microtask que, so that normal slotchange events in Chrome is triggered normally.
      //However, if we don't do this, the calls could be batched, making the Mixin slightly more efficient.
    }
  }
};