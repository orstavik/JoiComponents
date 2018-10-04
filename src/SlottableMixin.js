/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

//pure function to find the last in toRun, that !hasRun
function findLastNotChecked(toRun, hasRun){
  for (let i = toRun.length - 1; i >= 0; i--){
    let el = toRun[i];
    if (hasRun.indexOf(el) < 0)
      return el;
  }
  return null;
}

//Ques for batched tasks
let startedQue =[];
let completed = [];
let isStarted = false;

//First, block flushing of the que until DCL, and on DCL, open the que and try to flush it
let dcl = document.readyState === "complete" || document.readyState === "loaded";
dcl || window.addEventListener("DOMContentLoaded", function() {dcl = true; flushQue();});

//process for flushing que
function flushQue(){
  //step 1: check that dcl is ready.
  if (!dcl) return;
  //step 2: all elements started has been processed? reset and end
  const fnel = findLastNotChecked(startedQue, completed);
  if (!fnel) {
    startedQue =[];
    completed = [];
    return;
  }
  //step 3: run function, add the element to the completed list, and run again with TCO
  fnel[0](fnel[1]);
  completed.push(fnel);
  flushQue();
}

function batchedConstructorCallback(fn, el){
  startedQue.push([fn,el]);
  if (!isStarted){
    isStarted = true;
    Promise.resolve().then(()=>{
      flushQue();
      isStarted = false;
    });
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

const initFn = function(el){
  const mo = new MutationObserver(() => el[hostChildrenChanged]());
  mo.observe(el, {childList: true});
  el[init]();
  Promise.resolve().then(()=>{
    el.addEventListener("slotchange", e => el[hostSlotchange](e));
  });
}

export const SlottableMixin = function (Base) {
  return class SlottableMixin extends Base {

    constructor() {
      super();
      this[slottables] = null;
      batchedConstructorCallback(initFn, this);
    }

    [hostSlotchange](e) {
      for (let slot of e.composedPath()) {
        if (slot.tagName !== "SLOT")
          return;
        if (slot.parentNode === this){
          e.stopPropagation();
          const slotName = slot.getAttribute("slot") || "";
          this.slotCallback(new Slottables(slotName, this[slottables][slotName]));
          return;
        }
      }
    }

    [init]() {
      this[slottables] = mapNodesByAttributeValue(this.childNodes, "slot");
      if (Object.keys(this[slottables]).length === 0) this[slottables][""] = [];
      for (let name in this[slottables])
        this.slotCallback(new Slottables(name, this[slottables][name]));
    }

    [hostChildrenChanged]() {
      const children = mapNodesByAttributeValue(this.childNodes, "slot");
      let diffs = arrayDiff(this[slottables], children);
      for (let name of diffs)
        this.slotCallback(new Slottables(name, children[name]));
      this[slottables] = children;
    }
  }
};