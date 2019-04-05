/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

//pure function to find the last in toRun, that !hasRun
function findLastNotChecked(toRun, hasRun) {
  for (let i = toRun.length - 1; i >= 0; i--) {
    let el = toRun[i];
    if (hasRun.indexOf(el) < 0)
      return el;
  }
  return null;
}

//Ques for batched tasks
let startedQue = [];
let completed = [];
let isStarted = false;

//First, block flushing of the que until DCL, and on DCL, open the que and try to flush it
let dcl = document.readyState === "complete" || document.readyState === "loaded";
dcl || window.addEventListener("DOMContentLoaded", function () {
  dcl = true;
  flushQue();
});

//process for flushing que
function flushQue() {
  //step 1: check that dcl is ready.
  if (!dcl) return;
  //step 2: all elements started has been processed? reset and end
  const fnel = findLastNotChecked(startedQue, completed);
  if (!fnel) {
    startedQue = [];
    completed = [];
    return;
  }
  //step 3: run function, add the element to the completed list, and run again with TCO
  fnel[0](fnel[1]);
  completed.push(fnel);
  flushQue();
}

function batchedConstructorCallback(fn, el) {
  startedQue.push([fn, el]);
  if (!isStarted) {
    isStarted = true;
    Promise.resolve().then(() => {
      flushQue();
      isStarted = false;
    });
  }
}


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
// const externalChange = Symbol("externalChange");
// const init = Symbol("init");
const internalChange = Symbol("internalChangeAddedRemovedSlot");
const updateInternalAssignedValue = Symbol("updateInternalAssignedValue");
const outerAssigned = Symbol("outerAssigned");
const innerAssigned = Symbol("innerAssigned");
const innerSlots = Symbol("innerSlots");

function externalChange(changeList) {
  const change = changeList[changeList.length - 1];
  const el = change.target;
  const children = mapNodesByAttributeValue(el.childNodes, "slot");
  let diffs = arrayDiff(el[outerAssigned], children);
  for (let name of diffs) {
    el.slotCallback(new Slottables(name, children[name], el[innerAssigned][name]));
    if (el.shadowRoot) {
      const relevantSlot = el.shadowRoot.querySelector(`slot[name="${name}"]`);
      triggerChainedSlotCallbacks(relevantSlot);
    }
  }
  el[outerAssigned] = children;
}

const mo = new MutationObserver((changeList) => externalChange(changeList));

function init(el) {
  mo.observe(el, {childList: true});
  el[outerAssigned] = mapNodesByAttributeValue(el.childNodes, "slot");
  el[internalChange](true); // => this[innerAssigned]
  const outerOverwritesInnerChildren = Object.assign({}, el[innerAssigned], el[outerAssigned]);
  for (let name in outerOverwritesInnerChildren)
    el.slotCallback(new Slottables(name, el[outerAssigned][name], el[innerAssigned][name]));
  //an empty slotCallback("", undefined) is made if no assignable nodes are registered.
  if (Object.keys(outerOverwritesInnerChildren).length === 0)
    el.slotCallback(new Slottables("", undefined, undefined));
}

export const VarMixin = function (Base) {
  return class VarMixin extends Base {

    constructor() {
      super();
      this[outerAssigned] = null;
      this[innerAssigned] = {};
      this[innerSlots] = [];
      batchedConstructorCallback(init, this);
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
  }
};