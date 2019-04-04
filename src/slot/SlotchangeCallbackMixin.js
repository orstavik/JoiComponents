const slotchangeListener = Symbol("slotchangeListener");
let constructedElements = [];
let isRunning = false;

function notNipSlip(composedPath, shadowRoot) {
  for (let node of composedPath) {
    if (node.tagName !== "SLOT")
      return null;
    if (node.ownerDocument === shadowRoot)
      return node;
  }
  return null;
}

function doCallSlotCallback(slotchange) {
  const slot = notNipSlip(slotchange, this.shadowRoot);
  slot && this.slotCallback(slot);
}

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

export function SlotchangeCallbackMixin(base) {
  return class SlotchangeCallbackMixin extends base {

    constructor() {
      super();
      setupSlotchangeCallback(this);
    }
  }
}