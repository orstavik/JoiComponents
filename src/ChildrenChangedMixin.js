/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenedChildren as flatten} from "./flattenedChildren.js";

export const flattenedChildren = flatten;

/**
 * returns
 * 1. an array with a single no-name slot if that is amongst the .children, or
 * 2. an array of all the named slots [slotNameOne, slotNameTwo, ...] amongst the .children, or
 * 3. null.
 *
 * would be similar to something like this css-ish
 * el.querySelectorAll(":either(:only-first(:origin > :either(slot:not([name]), :origin > slot([name='']), :origin > slot");
 */
function getSlotList(el) {
  const res = [];
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (!child instanceof HTMLSlotElement)
      continue;
    const name = child.getAttribute("name");
    if (!name || name === "")
      return [child];
    res.push(child);
  }
  return res.length ? res : null;
}

function arrayEquals(a, b) {
  return a && a.length === b.length && a.every((v, i) => v === b[i]);
}


const hostChildrenObserver = Symbol("hostChildrenObserver");
const slotchangeListener = Symbol("slotChangedListener");
const hostChildrenChanged = Symbol("hostChildrenChanged");
const addSlotListeners = Symbol("addSlotListeners");
const removeSlotListeners = Symbol("removeSlotListeners");
const testCallback = Symbol("testTriggerCallback");
const hostChildrenSlots = Symbol("hostChildrenSlots");
const hostFlattenedChildren = Symbol("hostChildrenSlots");

/**
 * ChildrenChangedMixin adds a reactive lifecycle hook .childrenChangedCallback(...) to its subclasses.
 * .childrenChangedCallback(newFlattenedChildren, oldFlattenedChildren, isSlotChange) is triggered:
 *  1) whenever the slotted content of an element changes and
 *  2) every time the element is connected to the DOM.
 *
 * .childrenChangedCallback(...) is not triggered if there are no differences between the content of the
 * newFlattenedChildren and the oldFlattenedChildren.
 *
 * ChildrenChangedMixin exposes the `.flattenedChildren(el)` function.
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

    /**
     * @param oldChildList
     * @param newChildList
     * @param isSlotChange true if the children changed is due to a slotchange event
     */
    // childrenChangedCallback(oldChildList, newChildList, isSlotChange) {
    // }

    constructor() {
      super();
      this[hostChildrenObserver] = new MutationObserver(() => this[hostChildrenChanged]());//=== function(changes){changes[0].target[hostChildrenChanged]();}
      this[slotchangeListener] = () => this[testCallback](true);
      this[hostChildrenSlots] = undefined;
      this[hostFlattenedChildren] = [];
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this[hostChildrenObserver].observe(this, {childList: true});
      Promise.resolve().then(() => this[hostChildrenChanged]());
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this[removeSlotListeners]();
      this[hostChildrenObserver].disconnect();
    }

    [addSlotListeners]() {
      this[hostChildrenSlots] = getSlotList(this);
      if (!this[hostChildrenSlots])
        return;
      for (let i = 0; i < this[hostChildrenSlots].length; i++)
        this[hostChildrenSlots][i].addEventListener("slotchange", this[slotchangeListener]);
    }

    [removeSlotListeners]() {
      if (!this[hostChildrenSlots])
        return;
      for (let i = 0; i < this[hostChildrenSlots].length; i++)
        this[hostChildrenSlots][i].removeEventListener("slotchange", this[slotchangeListener]);
      this[hostChildrenSlots] = undefined;
    }

    [testCallback](isSlotChange) {
      let newFlatChildren = flattenedChildren(this);
      if (arrayEquals(newFlatChildren, this[hostFlattenedChildren]))
        return;
      let old = this[hostFlattenedChildren];
      this[hostFlattenedChildren] = newFlatChildren;
      this.childrenChangedCallback(old, newFlatChildren, isSlotChange);
    }

    [hostChildrenChanged]() {
      this[removeSlotListeners]();
      this[addSlotListeners]();
      this[testCallback](false);
    }
  }
};