/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
/**
 * Filters away <slot> elements that are placed as grandchildren or lower of this custom element.
 */
function processSlotchange(e, el) {
  const path = e.composedPath();
  if (path[0].getRootNode() === el.shadowRoot){
    e.stopPropagation();
    el.slotCallback(path[0]);
    return;
  }
  for (let i = 0; i < path.length; i++) {
    if (path[i].tagName !== "SLOT")
      return;
    if (path[i].parentNode === el && path[i+1].getRootNode() === el.shadowRoot) {
      e.stopPropagation();
      el.slotCallback(path[i+1]);
      return;
    }
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