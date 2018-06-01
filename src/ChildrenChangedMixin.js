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
 * 3. empty Nodelist.
 */
function getSlotList(host){
  const noName = host.querySelector('> slot:not([name])') || host.querySelector('> slot:not([name=""])');
  return noName ? [noName] : host.querySelectorAll('> slot');
}

const MO = Symbol("childListenerObserver");
const slotIsActive = Symbol("slotChildren");
const slotChangeListener = Symbol("slotChangedListener");
const childListChanged = Symbol("lightChildrenChanged");
const checkVisibleChildrenChanged = Symbol("slotChildrenChanged");
const listenForSlotChanges = Symbol("listenForSlotChanges");
const lastNotifiedVisibleChildren = Symbol("lastNotifiedVisibleChildren");

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
    // childrenChangedCallback(newChildList, oldChildList, isSlotChange) {
    // }

    static hasSlotChildren(el) {
      if (!el.children)
        return false;
      for (let i = 0; i < el.children.length; i++) {
        if (el.children[i].constructor.name === "HTMLSlotElement")
          return true;
      }
      return false;
    }

    constructor() {
      super();
      this[MO] = new MutationObserver(() => this[childListChanged]());         //=== function(changes){changes[0].target[childListChanged]();}
      this[slotIsActive] = false;
      this[slotChangeListener] = () => this[checkVisibleChildrenChanged](true);
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this[MO].observe(this, {childList: true});
      // if (this.children && this.children.length !== 0)
      Promise.resolve().then(() => this[childListChanged]());
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this[MO].disconnect();
    }

    [childListChanged]() {
      this[listenForSlotChanges]();
      this[checkVisibleChildrenChanged](false);
    }

    [checkVisibleChildrenChanged](isSlotChange) {
      const oldChildList = this[lastNotifiedVisibleChildren];
      const newChildList = flatten(this);
      if (!isSlotChange && ChildrenChangedMixin.arrayEquals(oldChildList, newChildList))
        return;
      this[lastNotifiedVisibleChildren] = newChildList;
      this.childrenChangedCallback(oldChildList, newChildList, isSlotChange);
    }

    [listenForSlotChanges]() {
      const hasSlot = ChildrenChangedMixin.hasSlotChildren(this);
      if (hasSlot && !this[slotIsActive]) {
        this[slotIsActive] = true;
        this.addEventListener("slotchange", this[slotChangeListener]);
      } else if (!hasSlot && this[slotIsActive]) {
        this[slotIsActive] = false;
        this.removeEventListener("slotchange", this[slotChangeListener]);
      }
    }

    static arrayEquals(a, b) {
      return a && a.length === b.length && a.every((v, i) => v === b[i]);
    }
  }
};