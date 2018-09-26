/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

const init = Symbol("init");
const processSlotchangeEvent = Symbol("processSlotchangeEvent");
const microTaskRegister = Symbol("microTaskRegister");

function onlyOncePerMicroTaskCycle(register, key) {
  if (register.has(key)){
    console.log("abourt");
    return false;
  }
  register.add(key);
  Promise.resolve().then(() => {
    register.delete(key);
  });
  return true;
}

export function ShadowSlotchangeMixin(Base) {
  return class ShadowSlotchangeMixin extends Base {

    constructor() {
      super();
      this[microTaskRegister] = new WeakSet();
      requestAnimationFrame(() => this[init]());
    }

    [init]() {
      this.shadowRoot.addEventListener("slotchange", e => this[processSlotchangeEvent](e));
      const slots = this.shadowRoot.querySelectorAll("slot");
      if (!slots)
        return;
      for (let i = 0; i < slots.length; i++)
        this.slotCallback(slots[i]);
    }

    /**
     * There is a bug in either the spec or Chrome in how slotchange events are processed that require handling:
     * Sometimes you get multiple `slotchange` events for the same change of assignedNodes, sometimes you don't.
     *
     * When the slotchange event is triggered, it might also trigger from with the .target property
     * being a chained <slot> and not the slot that is located within the shadowRoot of the element in which you
     * listen for slotchange events.
     *
     * This problem means the following. When you get a slotchange event in,
     * you need to ensure/find the slot that is from this shadowRoot.
     * When you find this slot, you need to:
     * 1. register this slot as processed,
     * 2. process the slotchange event viewed from that slot perspective, and
     * 3. after the microtask que has finished, mark the slot as ready to be processed again.
     *
     * @param e the slotchange event
     */
    [processSlotchangeEvent](e) {
      // debugger;
      //removes the GrandpaError slot
      let path = e.composedPath();
      let activeSlot;
      for (let node of path) {
        if (node.tagName === "SLOT")
          activeSlot = node;
        else
          break;
      }
      if (activeSlot.getRootNode() !== this.shadowRoot){
        // console.log("REMOVE", path);
        return;
      }
      // const slot = e.composedPath().find(n => n.tagName === "SLOT" && n.getRootNode() === this.shadowRoot);
      //todo check if I need this after initialization
      //if (onlyOncePerMicroTaskCycle(this[microTaskRegister], activeSlot))
      this.slotCallback(activeSlot);
    }
  }
}