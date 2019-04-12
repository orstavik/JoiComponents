import {SlottablesEvent} from "./SlottablesEvent.js";

function isEmptyButNotEmpty(slot) {
  const assigned = slot.assignedNodes();
  const slots = [];
  for (let node of assigned) {
    if (node.nodeType === 3 && !/[^\t\n\r ]/.test(node.textContent)) //ignore whitespace
      continue;
    if (!node.tagName || node.tagName !== "SLOT") //not a slot
      return false;
    if (node.childNodes.length !== 0)             //not empty slot
      return false;
    slots.push(node);
  }
  if (slots.length === 0)                       //it was whitespace only
    return false;
  for (let slot of slots) {                     //we delay recursive testing for performance
    if (slot.assignedNodes().length && !isEmptyButNotEmpty(slot))
      return false;
  }
  return true;
}

function checkNoFallout(el, slot) {
  const isHidden = slot.classList.contains("__falloutFixHide__");
  const empty = isEmptyButNotEmpty(slot);
  if (empty && !isHidden) {
    const hider = document.createElement("slot");
    hider.classList.add("__falloutFixHide__");
    hider.setAttribute("name", slot.name);
    hider.style.display = "none";
    el.shadowRoot.prepend(hider);
  } else if (!empty && isHidden) {
    slot.remove();
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