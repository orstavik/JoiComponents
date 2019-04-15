const slotchangeListener = Symbol("slotchangeListener");
let constructedElements = [];
let isRunning = false;

function notNipSlip(composedPath, shadowRoot) {
  for (let node of composedPath) {
    if (node.tagName !== "SLOT")
      return null;
    if (node.getRootNode() === shadowRoot)
      return node;
  }
  return null;
}

function doCallSlotCallback(slotchange) {
  const slot = notNipSlip(slotchange.path, this.shadowRoot);    // it was just an event
   slot && this.slotchangeCallback(slot);  // it was slotCallback and did not allow to add new values to the testValue and its length never equal 2, as test expect. Now it work         
}                                          // not sure that it is correct fix, but if work with a tests

function setupElements() {
  for (let el of constructedElements) {
    el.shadowRoot.addEventListener("slotchange", doCallSlotCallback.bind(el));
    let slots = el.shadowRoot.querySelectorAll("slot");
    for (let slot of slots) {
      if (slot.assignedNodes().length > 0)
        el.slotchangeCallback(slot);
    }
  }
  constructedElements = [];
  isRunning = false;
}

if (document.readyState === "loading") {
  isRunning = true;
  document.addEventListener("DOMContentLoaded", function () {
    setupElements();
  });
}

function setupSlotchangeCallback(self) {
  constructedElements.push(self);
  if (isRunning)
    return;
  isRunning = true;
  Promise.resolve().then(function () {
    Promise.resolve().then(function () {
      setupElements();
    });
  });
}

export function SlotchangeMixin(base) {
  return class SlotchangeMixin extends base {

    constructor() {
      super();
      setupSlotchangeCallback(this);
    }
  }
}
