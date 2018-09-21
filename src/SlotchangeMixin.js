/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenNodes} from "./flattenNodes.js";

function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function flattenMap(notFlat) {
  var flat = {};
  for (let key in notFlat)
    flat[key] = flattenNodes(notFlat[key]);
  return flat;
}

function arrayEquals(a, b) {
  return b && a && a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * SlotchangeMixin adds a reactive lifecycle hook .slotchangedCallback(...) to its subclasses.
 * This lifecycle hook is triggered every time a potentially assignable node for the element changes.
 * .slotchangedCallback(...) triggers manually every time the element is attached to the DOM and
 * whenever the a slotchange event would occur inside it.
 * The callback does not require neither a `<slot>` nor a shadowRoot to be present on the custom element,
 * it will trigger regardless.
 *
 * .slotchangedCallback(slotname, newAssignedNodes, oldAssignedNodes) is triggered every time:
 *  1) the element is connected to the DOM,
 *  2) whenever the slotted content of an element changes, but
 *  3) except when the content of newAssignedNodes and oldAssignedNodes are equal.
 *
 * Gold standard: https://github.com/webcomponents/gold-standard/wiki/
 * a) Detachment: SlotchangeMixin always starts observing when it is connected to the DOM and stops when it is disconnected.
 * b) Content assignment: changes to assignedNodes of slotted children are notified as if the change happened to a normal child.
 *
 * @param Base class that extends HTMLElement
 * @returns {SlotchangeMixin} class that extends HTMLElement
 *
 * todo when the childListChanges, I need a WeakMap that hold references to the previous values.
 * todo This map is setup so that it is triggered created the first time the element is connected, but to the content
 */
function onlyOncePerMicroTaskCycle(register, key) {
  if (register.has(key))
    return false;
  register.add(key);
  Promise.resolve().then(() => {
    register.delete(key);
  });
  return true;
}

const hostChildrenChanged = Symbol("hostChildrenChanged");
const chainedSlotchangeEvent = Symbol("chainedSlotchangeEvent");
const triggerAllSlotchangeCallbacks = Symbol("triggerAllSlotchangeCallbacks");
const triggerCallback = Symbol("triggerCallback");
const notFlatMap = Symbol("notFlatMap");
const flatMap = Symbol("flatMap");
const microTaskRegister = Symbol("microTaskRegister");

export const SlotchangeMixin = function (Base) {
  return class SlotchangeMixin extends Base {

    constructor() {
      super();
      this[notFlatMap] = null;
      this[flatMap] = {};
      this[microTaskRegister] = new WeakSet();
      const mo = new MutationObserver(() => this[hostChildrenChanged]());
      mo.observe(this, {childList: true});
      this.addEventListener("slotchange", e => this[chainedSlotchangeEvent](e));
      Promise.resolve().then(() => this[hostChildrenChanged]());
      //todo triggering this in the constructor might be a problem..
      //todo connectedCallback() might not have been run yet.. I should write a test for that.
    }

    [chainedSlotchangeEvent](e) {
      //slotchange from chained slot triggered before the observer has run its childrenChangedAlgorithm. Just skip it, the hostChildren will regardlessly run the same logic.
      if (!this[notFlatMap])
        return;
      const slot = e.path.find(n => n.tagName === "SLOT" && n.parentNode === this);
      if (!slot)    //a slotchange event of a grandchild in the lightdom, not for me
        return;
      if (!onlyOncePerMicroTaskCycle(this[microTaskRegister], slot))
        return;
      const slotName = slot.getAttribute("slot") || "";//todo test for this use of slotnames to guide the slot assigning
      let newFlatNodeList = flattenNodes(this[notFlatMap][slotName]);
      this[triggerCallback](slotName, newFlatNodeList, this[flatMap][slotName]);
    }

    [triggerCallback](slotName, newAssignedNodes, oldAssignedNodes) {
      if (arrayEquals(newAssignedNodes, oldAssignedNodes))
        return;
      this.slotchangedCallback(slotName, newAssignedNodes, oldAssignedNodes);
      this[flatMap][slotName] = newAssignedNodes;
    }

    [hostChildrenChanged]() {
      this[notFlatMap] = mapNodesByAttributeValue(this.childNodes, "slot");
      let newFlatMap = flattenMap(this[notFlatMap]);
      for (let slotName in newFlatMap) {
        this[triggerCallback](slotName, newFlatMap[slotName], this[flatMap][slotName]);
      }
    }
  }
};
// [registered observers hold weak references/are automatically garbagecollected](https://dom.spec.whatwg.org/#garbage-collection)
