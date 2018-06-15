/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenNodesMap} from "./flattenedChildren.js";

function arrayEquals(a, b) {
  return b && a && a.length === b.length && a.every((v, i) => v === b[i]);
}

const hostChildrenObserver = Symbol("hostChildrenObserver");
const slotchangeListener = Symbol("slotChangedListener");
const hostChildrenChanged = Symbol("hostChildrenChanged");
const addSlotListeners = Symbol("addSlotListeners");
const removeSlotListeners = Symbol("removeSlotListeners");
const hostChildrenSlots = Symbol("hostChildrenSlots");
const triggerSingleSlotchangedCallback = Symbol("triggerSingleSlotchangedCallback");
const triggerAllSlotchangedCallbacks = Symbol("triggerAllSlotchangedCallbacks");
const triggerCallback = Symbol("triggerCallback");
const map = Symbol("map");

/**
 * SlotchangedMixin adds a reactive lifecycle hook .slotchangedCallback(...) to its subclasses.
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
      this[slotchangeListener] = (e) => this[triggerSingleSlotchangedCallback](e.currentTarget.name);
      this[map] = {};
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

    [triggerAllSlotchangedCallbacks]() {
      //todo 2a. here I would then just flatten each entry in the map.
      let assignedMap = flattenNodesMap(this.childNodes);
      for (let slotName in assignedMap)
        this[triggerCallback](slotName, assignedMap[slotName], this[map][slotName]);
      this[map] = assignedMap;
    }

    [triggerSingleSlotchangedCallback](slotName) {
      //todo 2b. here I would then just flatten the selected entry in the map.
      let assignedMap = flattenNodesMap(this.childNodes, slotName);
      this[triggerCallback](slotName, assignedMap[slotName], this[map][slotName]);
      this[map][slotName] = assignedMap[slotName];
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
      //todo 1. here I can make a nonFlattenedList of the children. This sorts the host children on their `slot`attribute
      //todo this is slightly faster.
      Promise.resolve().then(() => this[triggerAllSlotchangedCallbacks]());
      //Above is the extra trigger needed to fix the missing initial-`slotchange`-event in Safari.
      //We can await this in the microtask que, so that normal slotchange events in Chrome is triggered normally.
      //However, if we don't do this, the calls could be batched, making the Mixin slightly more efficient.
    }
  }
};