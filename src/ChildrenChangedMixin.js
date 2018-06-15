/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenedChildren as flatten, pushAllAssigned} from "./flattenedChildren.js";

export const flattenedChildren = flatten;

//todo this also "fixes" the feature that you can have `<slot name="xyz" slot="abc">` described in named-slots chapter..
//todo should we do that, or should we throw an error (no, because the browsers don't do that),
//todo or should we push it to the unnamed slot (no, because I don't think the browsers do that), 
//todo or should we drop it (maybe yes, because I think the browsers maybe do that)?
//todo test this
function flatMap(element) {
  const res = {"": []};
  for (var i = 0; i < element.childNodes.length; i++) {
    var child = element.childNodes[i];
    debugger;
    var slotName = child.getAttribute("slot") || "";//todo check if this works for text nodes etc.
    var slotNameList = res[slotName] || (res[slotName] = []);
    if (child.tagName === "SLOT") //todo check if this works for text nodes etc.
    //todo, check if pushAllAssigned should try to fix this `<slot name="xyz" slot="abc">` too..
      pushAllAssigned(child, slotNameList);
    else
      slotNameList.push(child);
  }
}

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
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
 * ChildrenChangedMixin.js also exposes the `.flattenedChildren(el)` function.
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

    //todo update all the slotchangedCallback signatures in all the tests
    // slotchangedCallback(slotName, newNodeList, oldNodeList) {}

    constructor() {
      super();
      this[hostChildrenObserver] = new MutationObserver(() => this[hostChildrenChanged]());//=== function(changes){changes[0].target[hostChildrenChanged]();}
      this[slotchangeListener] = () => this[testCallback](true);
      //todo this[slotchangeListener] = (e) => this._triggerSlotchangedCallbackFromSlotchangeEvent(e);
      this[hostChildrenSlots] = [];
      this[hostFlattenedChildren] = undefined;
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
      this[hostChildrenSlots] = [].filter.call(this.children, function (c) {return c.tagName === "SLOT";});
      for (let i = 0; i < this[hostChildrenSlots].length; i++)
        this[hostChildrenSlots][i].addEventListener("slotchange", this[slotchangeListener]);
    }

    [removeSlotListeners]() {
      for (let i = 0; i < this[hostChildrenSlots].length; i++)
        this[hostChildrenSlots][i].removeEventListener("slotchange", this[slotchangeListener]);
      this[hostChildrenSlots] = [];
    }

    _triggerSlotchangedCallbackFromChildrenChanged() {
      let assignedMap = flatMap(this);
      for (var slotName in assignedMap) {
        var newAssignedNodes = assignedMap[slotName];
        var oldAssignedNodes = this._assignedMap[slotName];
        if (!arrayEquals(newAssignedNodes, oldAssignedNodes))
          this.slotchangedCallback(slotName, newAssignedNodes, oldAssignedNodes);
      }
      this._assignedMap = assignedMap;
    }

    _triggerSlotchangedCallbackFromSlotchangeEvent(slotchangeEvent) {
      for (var i = 0; i < this[hostChildrenSlots].length; i++) {
        var childNode = this[hostChildrenSlots][i];
        if (childNode === slotchangeEvent.currentTarget) {
          var newAssignedNodes = childNode.assignedNodes();
          var oldAssignedNodes = this._assignedMap[slotName];
          if (!arrayEquals(newAssignedNodes, oldAssignedNodes))
            this.slotchangedCallback(slotName, (this._assignedMap[slotName] = newAssignedNodes), oldAssignedNodes);
          return;
        }
      }
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
      if (!this.isConnected)            //if the element is first connected and then disconnected again before the JS stack empties.
        return;
      this[removeSlotListeners]();
      this[addSlotListeners]();
      this[testCallback](false);
      //todo this._triggerSlotchangedCallbackFromChildrenChanged();
    }
  }
};