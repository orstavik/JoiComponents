/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

function processSlotchange(e, el) {
  for (let node of e.composedPath()) {
    if (node.tagName !== "SLOT")
      return;
    if (node.getRootNode() === el.shadowRoot)
      el.slotCallback(node);
  }
}

export function SlotchangeMixin(Base) {
  return class SlotchangeMixin extends Base {

    constructor() {
      super();
      requestAnimationFrame(() => {
        this.shadowRoot.addEventListener("slotchange", e => processSlotchange(e, this));
        for (let slot of Array.from(this.shadowRoot.querySelectorAll("slot")))
          this.slotCallback(slot);
      });
    }
  }
}