/**
 * Acknowledgments
 */

const MO = Symbol("childListenerObserver");
const slotIsActive = Symbol("slotChildren");
const slotChangeListener = Symbol("slotChangedListener");
const childListChanged = Symbol("lightChildrenChanged");
const checkVisibleChildrenChanged = Symbol("slotChildrenChanged");
const listenForSlotChanges = Symbol("listenForSlotChanges");
const lastNotifiedVisibleChildren = Symbol("lastNotifiedVisibleChildren");

/**
 * ChildrenChangedMixin adds a reactive lifecycle hook .childrenChangedCallback(...) to its subclasses.
 * .childrenChangedCallback(...) is triggered every time
 *   1) a child changes or
 *   2) a slot that is a child changes.
 *
 * About 2) slotted children.
 * If a <slot> element is a direct child of the element, the .childrenChangedCallback is
 * triggered every time an element is either added or removed from the slot
 * (ie. whenever a "slotchange" event is triggered on a slotted child element).
 *
 * ChildrenChangedMixin also adds a property .visibleChildren to its subclasses.
 * .visibleChildren is the flattened list of:
 *   a) all (first level) children, except slot,
 *   b) the slotted children of the excluded slots
 * The new and old visibleChildren are passed as the parameters of the
 * .childrenChangedCallback(newVisibleChildren, oldVisibleChildren) method.
 *
 * Gold standard: https://github.com/webcomponents/gold-standard/wiki/
 * a) Detachment: ChildrenChangedMixin always starts observing when it is connected to the DOM and stops when it is disconnected.
 * b) Content assignment: changes to assignedNodes of slotted children are notified as if the change happened to a normal child.
 *
 * .childrenChangedCallback(...) is very similar to .attributeChangedCallback(...) in that
 *   a) it triggers a reactive function whenever a certain type of mutation of the element's lightDOM changes, and
 *   b) gives a reactive API to a facility that is already provided on the platform through the MutationObserver API.
 *
 * .childrenChangedCallback(...) is triggered when a change occurs while the element is connected to the DOM.
 * .childrenChangedCallback(...) is also called:
 *  1) when the element is reconnected (disconnected and then reconnected to the DOM),
 *  2) when the element is updated (when the constructor is called when the element has already been connected to the DOM).
 *
 * @param Base class that extends HTMLElement
 * @returns {ChildrenChangedMixin} class that extends HTMLElement
 */
export const ChildrenChangedMixin = function (Base) {
  return class ChildrenChangedMixin extends Base {

    /**
     * Override this method to do actions when children changes.
     * todo remove childrenChangedCallback?
     * todo This will cause an error when the developer uses ChildrenChangedMixin and forgets
     * todo to implement the childrenChangedCallback method.
     *
     * @param oldChildList
     * @param newChildList
     * @param isSlotChange true if the children changed is due to a slotchange event
     */
    childrenChangedCallback(oldChildList, newChildList, isSlotChange) {
      if (super.childrenChangedCallback) super.childrenChangedCallback(oldChildList, newChildList, isSlotChange);
    }

    getVisibleChildren() {
      let res = [];
      for (let i = 0; i < this.children.length; i++) {
        let child = this.children[i];
        if (child.constructor.name === "HTMLSlotElement") {
          let assignedNodes = child.assignedNodes();
          for (let j = 0; j < assignedNodes.length; j++)
            res.push(assignedNodes[j]);
        } else
          res.push(child);
      }
      return res;
    }

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
      this[MO] = new MutationObserver(() => this[childListChanged]());
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
      const newChildList = this.getVisibleChildren();
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