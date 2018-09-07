/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenNodes} from "./flattenNodes.js";

function nodeListToMap(nodes, attr){
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attr) || ""): "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function flattenMap(nodeMap){
  var res = {};
  var keys = Object.keys(nodeMap);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    res[key] = flattenNodes(nodeMap[key]);
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
const triggerSingleSlotchangeCallback = Symbol("triggerSingleSlotchangeCallback");
const triggerAllSlotchangeCallbacks = Symbol("triggerAllSlotchangeCallbacks");
const triggerCallback = Symbol("triggerCallback");
const map = Symbol("map");
const notFlatMap = Symbol("notFlatMap");
const flatMap = Symbol("flatMap");

/**
 * SlotchangeMixin adds a reactive lifecycle hook .slotchangedCallback(...) to its subclasses.
 * This lifecycle hook is triggered every time a potentially assignable node for the element changes.
 * .slotchangedCallback(...) triggers manually every time the element is attached to the DOM and
 * whenever the a slotchange event would occur inside it.
 * The callback does not require neither a `<slot>` nor a shadowRoot to be present on the custom element,
 * it will trigger regardless.
 *
 * .slotchangedCallback(slotname, newAssignedNodes, oldAssignedNodes) is triggered every time:
 *  1) the element is connected to the DOM and
 *  2) whenever the slotted content of an element changes.
 *
 * .slotchangedCallback(slotname, newAssignedNodes, oldAssignedNodes) is never triggered
 * when the content of newAssignedNodes and oldAssignedNodes are equal.
 *
 * Gold standard: https://github.com/webcomponents/gold-standard/wiki/
 * a) Detachment: SlotchangeMixin always starts observing when it is connected to the DOM and stops when it is disconnected.
 * b) Content assignment: changes to assignedNodes of slotted children are notified as if the change happened to a normal child.
 *
 * @param Base class that extends HTMLElement
 * @returns {SlotchangeMixin} class that extends HTMLElement
 */
export const SlotchangeMixin = function (Base) {
  return class SlotchangeMixin extends Base {

    // slotchangedCallback(slotName, newNodeList, oldNodeList) {}

    constructor() {
      super();
      this[hostChildrenObserver] = new MutationObserver(() => this[hostChildrenChanged]());
      this[slotchangeListener] = (e) => this[triggerSingleSlotchangeCallback](e.currentTarget.name);
      this[map] = {};
      this[hostChildrenSlots] = [];
      this[notFlatMap] = {};
      this[flatMap] = {};
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

    [triggerAllSlotchangeCallbacks]() {
      let newFlatMap = flattenMap(this[notFlatMap]);
      for (let slotName in newFlatMap)
        this[triggerCallback](slotName, newFlatMap[slotName], this[flatMap][slotName]);
      this[flatMap] = newFlatMap;
    }

    [triggerSingleSlotchangeCallback](slotName) {
      let newFlatNodeList = flattenNodes(this[notFlatMap][slotName]);
      this[triggerCallback](slotName, newFlatNodeList, this[flatMap][slotName]);
      this[flatMap][slotName] = newFlatNodeList;
    }

    [triggerCallback](slotName, newAssignedNodes, oldAssignedNodes) {
      if (!arrayEquals(newAssignedNodes, oldAssignedNodes))
        this.slotchangedCallback(slotName, newAssignedNodes, oldAssignedNodes);
    }

    [hostChildrenChanged]() {
      if (!this.isConnected)            //if the element is first connected and then disconnected again before the JS stack empties.
        return;
      this[removeSlotListeners]();
      this[addSlotListeners]();
      this[notFlatMap] = nodeListToMap(this.childNodes, "slot");
      Promise.resolve().then(() => this[triggerAllSlotchangeCallbacks]());
      //Above is the extra trigger needed to fix the missing initial-`slotchange`-event in Safari.
      //We can await this in the microtask que, so that normal slotchange events in Chrome is triggered normally.
      //However, if we don't do this, the calls could be batched, making the Mixin slightly more efficient.
    }
  }
};