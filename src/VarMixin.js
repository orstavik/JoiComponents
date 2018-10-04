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
  if (res.length === 0 && slot.childNodes) {
    for (let i = 0; i < slot.childNodes.length; i++) {
      let child = slot.childNodes[i];
      res.push(child);
    }
  }
  return res;
}

function triggerChainedSlotCallbacks(slot) {
  while (slot) {
    let parent = slot.parentNode;
    if (!parent)
      break;
    let slotName = slot.getAttribute("slot") || "";
    if (parent[outerAssigned] && parent.slotCallback) {
      parent.slotCallback(new Slottables(slotName, parent[outerAssigned][slotName]));
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
  constructor(name, externalAssigneds, internalAssigneds) {
    this.name = name;
    this.assigneds = externalAssigneds;
    this.fallback = internalAssigneds;
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
    if (this.assigneds) {
      for (let n of this.assigneds) {
        if (n.tagName === "SLOT") //if(node instanceof HTMLSlotElement) does not work in polyfill.
          res = res.concat(flattenAssignedNodesVar(n));
        else
          res.push(n);
      }
    }
    if (res.length === 0 && this.fallback) {
      for (let i = 0; i < this.fallback.length; i++)
        res.push(this.fallback[i]);
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
const externalChange = Symbol("externalChange");
const internalChange = Symbol("internalChangeAddedRemovedSlot");
const updateInternalAssignedValue = Symbol("updateInternalAssignedValue");
const outerAssigned = Symbol("outerAssigned");
const innerAssigned = Symbol("innerAssigned");
const innerSlots = Symbol("innerSlots");
const init = Symbol("init");

export const VarMixin = function (Base) {
  return class VarMixin extends Base {

    constructor() {
      super();
      this[outerAssigned] = null;
      this[innerAssigned] = {};
      this[innerSlots] = [];
      requestAnimationFrame(() => {
        const mo = new MutationObserver(() => this[externalChange]());      //todo make MO MixinSingleton?
        mo.observe(this, {childList: true});
        this[init]();
      });
    }

    [updateInternalAssignedValue](name, childNodes, first) {
      if (childNodes === undefined)
        delete this[innerAssigned][name];
      else
        this[innerAssigned][name] = Array.from(childNodes);
      if (this[outerAssigned][name])
        return;
      if (first)
        return;
      this.slotCallback(new Slottables(name, undefined, this[innerAssigned][name]));
      if (this.shadowRoot) {
        const relevantSlot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
        triggerChainedSlotCallbacks(relevantSlot);
      }
    }

    [internalChange](first) {
      const newSlots = Array.from(this.shadowRoot.querySelectorAll("slot"));
      //added slots
      const addedNames = [];
      for (let newSlot of newSlots) {
        let name = newSlot.name;
        if (addedNames.indexOf(name) !== -1)
          throw new Error("No SLOT element can be added with the same 'name' attribute under the same shadowRoot. (VAR).");
        addedNames.push(name);
        if (this[innerSlots].indexOf(newSlot) === -1)
          this[updateInternalAssignedValue](newSlot.name, newSlot.childNodes, first);
      }
      //removed slots
      for (let oldSlot of this[innerSlots]) {
        if (newSlots.indexOf(oldSlot) === -1)
          this[updateInternalAssignedValue](oldSlot.name, undefined, first);
      }
      this[innerSlots] = newSlots;
      requestAnimationFrame(() => this[internalChange]());
    }

    [init]() {
      this[outerAssigned] = mapNodesByAttributeValue(this.childNodes, "slot");
      this[internalChange](true); // => this[innerAssigned]
      const outerOverwritesInnerChildren = Object.assign({}, this[innerAssigned], this[outerAssigned]);
      for (let name in outerOverwritesInnerChildren)
        this.slotCallback(new Slottables(name, this[outerAssigned][name], this[innerAssigned][name]));
      //an empty slotCallback("", undefined) is made if no assignable nodes are registered.
      if (Object.keys(outerOverwritesInnerChildren).length === 0)
        this.slotCallback(new Slottables("", undefined, undefined));
    }

    [externalChange]() {
      const children = mapNodesByAttributeValue(this.childNodes, "slot");
      let diffs = arrayDiff(this[outerAssigned], children);
      for (let name of diffs) {
        this.slotCallback(new Slottables(name, children[name], this[innerAssigned][name]));
        if (this.shadowRoot) {
          const relevantSlot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
          triggerChainedSlotCallbacks(relevantSlot);
        }
      }
      this[outerAssigned] = children;
    }
  }
};