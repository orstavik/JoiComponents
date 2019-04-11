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

function checkNoFallout(el, slot) {
  const isHidden = slot.classList.contains("__falloutFixHide__");
  const empty = emptyButNotEmpty(slot);
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