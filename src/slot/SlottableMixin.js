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
      Promise.resolve().then(() => {
        flushQue();
        isStarted = false;
      });
    });
  }
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

/**
 * SlottableMixin adds a reactive lifecycle hook .slottablesCallback(...) to its subclasses.
 * SlottableMixin does not require neither a `<slot>` nor a shadowRoot to be present on the custom element,
 * it will trigger regardless.
 *
 * This lifecycle hook is triggered every time a potentially slottable nodes for the element changes.
 * .slottablesCallback(...) is initialized and triggers at .
 * Then .slottablesCallback(...) is triggered whenever the childList of the host node changes, or
 * .
 *
 * .slottablesCallback(slottables) is triggered:
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
const slottables = Symbol("slottables");

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

function indirectSlottableMutation(el, ev) {
  let path = ev.composedPath();
  for (let i = 0; i < path.length; i++) {
    let slot = path[i];
    if (slot.tagName !== "SLOT")
      return;                                             //no eavesdropping
    if (slot.parentNode === el) {
      const slotName = slot.getAttribute("slot") || "";
      el.slottablesCallback(el[slottables][slotName], i + 1, ev);  //found the right slot and triggering callback
      return;
    }
  }
}

function directSlottableMutation(changes) {
  const el = changes[0].target;
  const newSlottables = mapNodesByAttributeValue(el.childNodes, "slot");
  for (let name in el[slottables]) {
    if (newSlottables[name] === undefined) {
      delete el[slottables][name];                           //deleted
      el.slottablesCallback(new Slottables(name, null));
    }
  }
  for (let name in newSlottables) {
    let nodes = newSlottables[name];
    if (!el[slottables][name])                               //added
      el.slottablesCallback(el[slottables][name] = new Slottables(name, nodes));
    if (!arrayEquals(nodes, el[slottables][name].assigneds)) //changed
      el.slottablesCallback(el[slottables][name] = new Slottables(name, nodes));
  }
}

const mo = new MutationObserver(directSlottableMutation);

function SlottableCallback (el) {
  mo.observe(el, {childList: true});
  el.addEventListener("slotchange", e => indirectSlottableMutation(el, e));

  const map = mapNodesByAttributeValue(el.childNodes, "slot");
  if (Object.keys(map).length === 0) map[""] = [];
  for (let name in map)
    el.slottablesCallback(el[slottables][name] = new Slottables(name, map[name]));
}

export const SlottableMixin = function (Base) {
  return class SlottableMixin extends Base {

    constructor() {
      super();
      this[slottables] = {};
      batchedConstructorCallback(SlottableCallback, this);
    }
  }
};