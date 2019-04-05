class Slottables {
  constructor(name, assignables) {
    this.name = name;
    this.assignables = assignables || [];
  }

  assignedNodes(opt) {
    if (!opt || !opt.flatten)
      return this.assignables;
    let res = [];
    for (let n of this.assignables) {
      if (n.tagName === "SLOT") {
        const flat = n.assignedNodes({flatten: true}).length;
        flat.length ? res = res.concat(flat) : res.push(flat);
      } else
        res.push(n);
    }
    return res;
  }
}

function notNipSlip(composedPath, host) {
  for (let node of composedPath) {
    if (node.tagName !== "SLOT")
      return null;
    if (node.parentNode === host)
      return node;
  }
  return null;
}

function mapNodesBySlotAttribute(nodes) {
  const res = {};
  for (let n of nodes) {
    let name = n.getAttribute ? (n.getAttribute("slot") || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function getSlotIfAny(el, name) {
  const q = name === "" ? 'slot:not([name]), slot[name=""]' : 'slot[name="' + name + '"]';
  return el.shadowRoot ? el.shadowRoot.querySelector(q): undefined;
}

function dispatchSlottablesEvent(el, name) {
  const slot = getSlotIfAny(el, name) || new Slottables(name, el[nameNodesMap][name]);
  const event = new CustomEvent("slottables-changed", {composed: false, bubbles: false, detail: {slot}});
  el.dispatchEvent(event);
}

function checkSlotchange(slotchange) {
  const slot = notNipSlip(slotchange.composedPath(), this);
  const slotName = slot.getAttribute("slot") || "";
  slot && dispatchSlottablesEvent(this, slotName);
}

function childListsAreTheSame(oldList, newList) {
  if (!oldList || !newList || newList.length !== oldList.length)
    return false;
  for (let i = 0; i < newList.length; i++) {
    if (newList[i] !== oldList[i])
      return false;
  }
  return true;
}

function compareSlotNameMaps (newMap, oldMap) {
  if (!oldMap)
    return Object.keys(newMap);
  // if (!newMap)
  //   return Object.keys(oldMap);
  const res = [];
  for (let key of Object.keys(newMap)) {
    if (!childListsAreTheSame(newMap[key], oldMap[key]))
      res.push(key);
  }
  for (let key of Object.keys(oldMap)) {
    if (!newMap[key])
      res.push(key);
  }
  return res;
}

function childNodesChanged(el) {
  const newMap = mapNodesBySlotAttribute(el.childNodes);
  const diffs = compareSlotNameMaps(newMap, el[nameNodesMap]);
  el[nameNodesMap] = newMap;
  for (let slotName of diffs)
    dispatchSlottablesEvent(el, slotName);
}

function childNodesChangedObserver(data) {
  for (let d of data)
    childNodesChanged(d.target);
}

const childNodesObs = new MutationObserver(childNodesChangedObserver);

function setupNow(el) {
  childNodesObs.observe(el, {childList: true});
  el.addEventListener("slotchange", checkSlotchange.bind(el));
  childNodesChanged(el);
}


function setup(el) {
  Promise.resolve().then(function () {
    Promise.resolve().then(function () {
      setupNow(el);
    });
  });
}

if (document.readyState === "loading") {
  const que = [];
  const cachedSetup = setup;
  setup = function (el) {
    que.push(el);
  };
  document.addEventListener("DOMContentLoaded", function () {
    setup = cachedSetup;
    for (let el of que)
      setupNow(el);
  });
}

const nameNodesMap = Symbol("nameNodesMap");

export function SlottablesEvent(base) {
  return class SlottablesEvent extends base {

    constructor() {
      super();
      setup(this);
      this[nameNodesMap] = {};       //slotNameString -> [nonFlattenNodes]
    }
  }
}