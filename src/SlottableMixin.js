/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

function flattenNodes(nodes) {
  let res = [];
  for (let n of nodes) {
    if (n.tagName === "SLOT")  //if(node instanceof HTMLSlotElement) does not work in polyfill.
      res = res.concat(n.assignedNodes({flatten: true}));
    else
      res.push(n);
  }
  return res;
}

function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
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
const hostSlotchange = Symbol("chainedSlotchangeEvent");
const init = Symbol("triggerAllSlotchangeCallbacks");
const slottables = Symbol("notFlatMap");
const microTaskRegister = Symbol("microTaskRegister");

class Slottables {
  constructor(name, assigneds) {
    this.name = name;
    this.assigneds = assigneds;
  }

  assignedNodes(config) {
    if (!(config && config.flatten === true))
      return this.assigneds;
    let res = [];
    for (let n of this.assigneds) {
      if (n.tagName === "SLOT") { //if(node instanceof HTMLSlotElement) does not work in polyfill.
        const flat = n.assignedNodes({flatten: true});
        res = res.concat(flat);
      } else
        res.push(n);
    }
    return res;
  }

  assignedElements(config) {
    return this.assignedNodes(config).filter(n => n.nodeType === Node.ELEMENT_NODE);
  }
}

export const SlotchangeMixin = function (Base) {
  return class SlotchangeMixin extends Base {

    constructor() {
      super();
      this[slottables] = {};
      this[microTaskRegister] = new WeakSet();
      requestAnimationFrame(() => this[init]());
    }

    [init]() {
      const mo = new MutationObserver(() => this[hostChildrenChanged]());
      mo.observe(this, {childList: true});
      this.addEventListener("slotchange", e => this[hostSlotchange](e));
      this[hostChildrenChanged]();
    }

    [hostSlotchange](e) {
      const slot = e.composedPath().find(n => n.tagName === "SLOT" && n.parentNode === this);
      if (!slot)    //a slotchange event of a grandchild in the lightdom, not for me
        return;
      //todo stop propagation here??
      if (!onlyOncePerMicroTaskCycle(this[microTaskRegister], slot))
        return;
      const slotName = slot.getAttribute("slot") || "";//todo test for this use of slotnames to guide the slot assigning
      this.slotCallback(new Slottables(slotName, this[slottables][slotName]));
    }

    [hostChildrenChanged]() {
      const children = mapNodesByAttributeValue(this.childNodes, "slot");
      for (let name in children) {
        if (arrayEquals(children[name], this[slottables][name]))
          continue;
        this[slottables][name] = children[name];
        this.slotCallback(new Slottables(name, this[slottables][name]));
      }
    }
  }
};
// [registered observers hold weak references/are automatically garbagecollected](https://dom.spec.whatwg.org/#garbage-collection)
