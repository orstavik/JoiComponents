/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

export function flattenAssignedNodesVar(slot) {
  let res = [];
  for (let n of slot.assignedNodes()) {
    if (n.tagName === "SLOT") { //if(node instanceof HTMLSlotElement) does not work in polyfill.
      const flat = flattenAssignedNodesVar(n);
      res = res.concat(flat);
    } else
      res.push(n);
  }
  return res;
}

function triggerChainedSlotCallbacks(slot) {
  while (slot) {
    let parent = slot.parentNode;
    if (!parent)
      break;
    let slotName = slot.getAttribute("slot") || "";
    if (parent[slottables] && parent.slotCallback) {
      parent.slotCallback(new Slottables(slotName, parent[slottables][slotName]));
    }
    let shadow = parent.shadowRoot;
    if (!shadow)
      return;
    slot = shadow.querySelector(`slot[name="${slotName}"]`);
  }
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

function arrayDiff(dictA, dictB) {
  let allKeys = Object.keys(Object.assign({}, dictA, dictB));
  let res = [];
  for (let key of allKeys) {
    if (!arrayEquals(dictA[key], dictB[key]))
      res.push(key);
  }
  return res;
}

function arrayEquals(a, b) {
  return b && a && a.length === b.length && a.every((v, i) => v === b[i]);
}

class Slottables {
  constructor(name, assigneds) {
    this.name = name;
    this.assigneds = assigneds;
  }

  assignedNodes(config) {
    if (!(config && config.flatten === true))
      return this.assigneds;
    let res = [];
    if (!this.assigneds)
      return res;
    for (let n of this.assigneds) {
      if (n.tagName === "SLOT" && n.getRootNode().host) { //if(node instanceof HTMLSlotElement) does not work in polyfill.
        const flat = n.assignedNodes(config);
        res = res.concat(flat);
      } else
        res.push(n);
    }
    return res;
  }

  varAssignedNodes(config) {
    if (!(config && config.flatten === true))
      return this.assigneds;
    let res = [];
    for (let n of this.assigneds) {
      if (n.tagName === "SLOT") //if(node instanceof HTMLSlotElement) does not work in polyfill.
        res = res.concat(flattenAssignedNodesVar(n));
      else
        res.push(n);
    }
    return res;
  }

  assignedElements(config) {
    return this.assignedNodes(config).filter(n => n.nodeType === Node.ELEMENT_NODE);
  }
}

/**
 * SlottableMixin adds a reactive lifecycle hook .slotCallback(...) to its subclasses.
 * SlottableMixin does not require neither a `<slot>` nor a shadowRoot to be present on the custom element,
 * it will trigger regardless.
 *
 * This lifecycle hook is triggered every time a potentially slottable nodes for the element changes.
 * .slotCallback(...) is initialized and triggers at .
 * Then .slotCallback(...) is triggered whenever the childList of the host node changes, or
 * .
 *
 * .slotCallback(slottables) is triggered:
 *  1) the first requestAnimationFrame after the element is constructed,
 *  2) whenever the childNodes of the host element changes, and
 *  3) whenever the assigned nodes of a <slot> node that is a child of the host element changes.
 *
 * Gold standard: https://github.com/webcomponents/gold-standard/wiki/
 * a) Content assignment: changes to assignedNodes of slotted children are notified as if the change happened to a normal child.
 *
 * @param Base class that extends HTMLElement
 * @returns {SlottableMixin} class that extends HTMLElement
 */
const hostChildrenChanged = Symbol("hostChildrenChanged");
const hostSlotchange = Symbol("chainedSlotchangeEvent");
const slottables = Symbol("notFlatMap");
const init = Symbol("init");

export const VarMixin = function (Base) {
  return class VarMixin extends Base {

    constructor() {
      super();
      this[slottables] = null;
      requestAnimationFrame(() => {
        const mo = new MutationObserver(() => this[hostChildrenChanged]());
        mo.observe(this, {childList: true});
        this[init]();
      });
    }

    [hostSlotchange](e) {
      for (let slot of e.composedPath()) {
        if (slot.tagName !== "SLOT")
          return;
        if (slot.parentNode === this) {
          e.stopPropagation();
          const slotName = slot.getAttribute("slot") || "";
          this.slotCallback(new Slottables(slotName, this[slottables][slotName]));
          return;
        }
      }
    }

    [init]() {
      const children = mapNodesByAttributeValue(this.childNodes, "slot");
      if (children.length === 0) children[""] = [];
      for (let name in children)
        this.slotCallback(new Slottables(name, children[name]));
      this[slottables] = children;
    }

    [hostChildrenChanged]() {
      const children = mapNodesByAttributeValue(this.childNodes, "slot");
      let diffs = arrayDiff(this[slottables], children);
      for (let name of diffs) {
        this.slotCallback(new Slottables(name, children[name]));
        if (this.shadowRoot) {
          const relevantSlot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
          triggerChainedSlotCallbacks(relevantSlot);
        }
      }
      this[slottables] = children;
    }
  }
};