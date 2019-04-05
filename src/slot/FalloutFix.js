import {SlottablesEvent} from "./SlottablesEvent.js";

function hasEmptyChainedSlot(slot) {
  let emptySlot = false;
  let ws = 0;
  for (let node of slot.assignedNodes()) {
    if (node.tagName && node.tagName === "SLOT") {
      if (node.childNodes.length !== 0)
        return false;
      emptySlot = true;
    } else if (node.nodeType !== 3 || /[^\t\n\r ]/.test(node.textContent)) {
      return false;
    } else {
      ws++;
    }
  }
  return ws;
}

function emptyButNotEmpty(slot) {
  let ws = hasEmptyChainedSlot(slot);
  if (ws === false)
    return false;
  const assignedNodesFlatten = slot.assignedNodes({flatten: true});
  for (let node of assignedNodesFlatten) {
    if (node.nodeType === 3 && !(/[^\t\n\r ]/.test(node.textContent)))
      ws--;
    else
      return false;
  }
  return ws === 0;
}

const suffix = "_EmptyButNotEmpty";

function checkNoFallout(el, slot) {
  const isSlot = slot instanceof HTMLElement;
  const empty = emptyButNotEmpty(slot);
  if (isSlot && empty) {               //hidden
    const q = name === "" ? 'slot:not([name]), slot[name=""]' : 'slot[name="' + name + '"]';
    const slots = el.shadowRoot.querySelectorAll(q);
    for (let slot of slots)
      slot.setAttribute("name", slot.name + suffix);
  } else if (!isSlot && !empty) {
    const slots = el.shadowRoot.querySelectorAll('slot[name="' + slot.name + suffix + '"]');
    for (let node of slots)
      node.setAttribute("name", slot.name);
  }
}

export function FalloutFix(base) {
  return class FalloutFix extends SlottablesEvent(base) {
    constructor() {
      super();
      this.addEventListener("slottables-changed", e => checkNoFallout(this, e.detail.slot));
    }
  }
}