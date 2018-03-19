const MO = Symbol("childListenerObserver");
const slotChildren = Symbol("slotChildren");
const slotChangeListener = Symbol("slotChangedListener");
const childListChanged = Symbol("lightChildrenChanged");
const checkVisibleChildrenChanged = Symbol("slotChildrenChanged");
const listenForSlotChanges = Symbol("listenForSlotChanges");
const onConnection = Symbol("onConnection");
const visibleChildren = Symbol("visibleChildren");

export const ChildrenChangedMixin = function (Base) {
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
   * @param Base class extending HTMLElement
   * @returns {ChildrenChangedMixin}
   * @constructor
   */
  return class ChildrenChangedMixin extends Base {

    /**
     * Triggers when the list of visible children changes,
     * due to changes in list of children or a slotchange event of a child slot.
     *
     * @param newChildList the current list of visible children
     * @param oldChildList the previous list of visible children
     */
    childrenChangedCallback(newChildList, oldChildList) {
      if (super.childrenChangedCallback) super.childrenChangedCallback(newChildList, oldChildList);
    }

    get visibleChildren() {
      return this[visibleChildren];
    }

    set visibleChildren(willThrowError) {
      throw new Error("Illegal setter. element.visibleChildren can only be read, not set.");
    }

    constructor() {
      super();
      this[MO] = new MutationObserver(() => this[childListChanged]());
      this[slotChildren] = [];
      this[slotChangeListener] = this[checkVisibleChildrenChanged].bind(this);
      if (this.isConnected)
        Promise.resolve().then(() => this[onConnection]());
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this[onConnection]();
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this[MO].disconnect();
    }

    [onConnection]() {
      this[MO].observe(this, {childList: true});
      // if (this.children && this.children.length !== 0)
      Promise.resolve().then(() => this[childListChanged]());
    }

    [childListChanged]() {
      this[listenForSlotChanges]();
      this[checkVisibleChildrenChanged]();
    }

    [checkVisibleChildrenChanged]() {
      const oldChildList = this[visibleChildren];
      const newChildList = ChildrenChangedMixin.flattenVisibleChildren(this);
      if (ChildrenChangedMixin.arrayEquals(oldChildList, newChildList))
        return;
      this[visibleChildren] = newChildList;
      this.childrenChangedCallback(newChildList, oldChildList);
    }

    [listenForSlotChanges]() {
      const newSlotChildren = ChildrenChangedMixin.slotChildren(this);      //or..  ChildrenChangedMixin.querySelectorAllHostSlot(this);
      for (let oldSlot of this[slotChildren]) {         //remove no longer used slotchange listeners
        if (newSlotChildren.indexOf(oldSlot) === -1)
          oldSlot.removeEventListener("slotchange", this[slotChangeListener]);
      }
      for (let newSlot of newSlotChildren) {            //add new slotchange listeners
        if (this[slotChildren].indexOf(newSlot) === -1)
          newSlot.addEventListener("slotchange", this[slotChangeListener]);
      }
      this[slotChildren] = newSlotChildren;
    }

    //todo is there anything like querySelectorAll(":host>slot")?
    static slotChildren(host) {
      return Array.from(host.children || []).filter((child) => child.constructor.name === "HTMLSlotElement");
    }

    static flattenVisibleChildren(el) {
      let res = [];
      for (let i = 0; i < el.children.length; i++) {
        let child = el.children[i];
        if (child.constructor.name === "HTMLSlotElement") {
          let assignedNodes = child.assignedNodes();
          for (let j = 0; j < assignedNodes.length; j++)
            res.push(assignedNodes[j]);
        } else
          res.push(child);
      }
      return res;
    }

    static arrayEquals(a, b) {
      return a && a.length === b.length && a.every((v, i) => v === b[i]);
    }
  }
};