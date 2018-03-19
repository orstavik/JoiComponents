const MO = Symbol("childListenerObserver");
const slotChildren = Symbol("slotChildren");
const slotChangeListener = Symbol("slotChangedListener");
const childListChanged = Symbol("lightChildrenChanged");
const checkVisibleChildrenChanged = Symbol("slotChildrenChanged");
const listenForSlotChanges = Symbol("listenForSlotChanges");
const onConnection = Symbol("onConnection");

export const ChildrenChangedMixin = function (Base) {
  /**
   * The ChildrenChangedMixin will trigger the .childrenChangedCallback(newVisibleChildren, oldVisibleChildren)
   * on any subclass / Mixin that defines this method.
   * The .childrenChangedCallback(newVisibleChildren, oldVisibleChildren) is a reactive function
   * that triggers a callback every time a child in the immediate list of children changes.
   *
   * .childrenChangedCallback(...) is very similar to .attributeChangedCallback(...) in that
   *   a) it triggers a reactive function whenever a certain type of mutation of the element's lightDOM changes, and
   *   b) gives a reactive API to a facility that is already provided on the platform through the MutationObserver API.
   *
   * Slotted children.
   * If a <slot> element is set as child of the element, the .childrenChangedCallback will also be
   * triggered everytime a new elements are slotted in that position or removed from that slot
   * (ie. whenever a "slotchange" event is triggered on that slotted child element).
   *
   * The private property ._visibleChildren is the flattened list of:
   *   a) all (first level) children, except slot,
   *   b) the slotted children of the excluded slots
   * It is recommended that subclasses handles the ._visibleChildren through the first parameter of the
   * .childrenChangedCallback(newVisibleChildren, oldVisibleChildren).
   *
   * Gold standard: https://github.com/webcomponents/gold-standard/wiki/
   * a) Detachment: ChildrenChangedMixin always starts observing when it is connected to the DOM and stops when it is disconnected.
   * b) Content assignment: changes to assignedNodes of slotted children are notified as if the change happened to a normal child.
   *
   * @param Base class extending HTMLElement
   * @returns {ChildrenChangedMixin}
   * @constructor
   */
  return class ChildrenChangedMixin extends Base {

    /**
     * This is the reactive life cycle function that is added to the HTMLElement.
     * Triggers when the list of visible children changes,
     * due to changes in list of children or a slotchange event of a child slot.
     * Is always triggered on connectedCallback.
     *
     * @param newChildList the current list of visible children
     * @param oldChildList the previous list of visible children
     */
    childrenChangedCallback(newChildList, oldChildList) {
      if (super.childrenChangedCallback) super.childrenChangedCallback(newChildList, oldChildList);
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
      const oldChildList = this._visibleChildren;
      const newChildList = ChildrenChangedMixin.getVisibleChildren(this);
      if (ChildrenChangedMixin.arrayEquals(oldChildList, newChildList))
        return;
      this._visibleChildren = newChildList;
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

    static getVisibleChildren(el) {
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