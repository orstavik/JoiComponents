/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenNodes} from "./flattenNodes.js";

const isInit = Symbol("isInit");
const init = Symbol("init");
const processSlotchangeEvent = Symbol("processSlotchangeEvent");
const processSlot = Symbol("processSlot");
const slotToAssigned = Symbol("slotToAssigned");
const microTaskRegister = Symbol("slotToAssigned");

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

function onlyOncePerMicroTaskCycle(register, key) {
  if (register.has(key))
    return false;
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
      this[isInit] = false;
      this[microTaskRegister] = new WeakSet();
      this[slotToAssigned] = new WeakMap();
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this[isInit] || (this[isInit] = true, this[init]());
    }

    [init]() {
      this.shadowRoot.addEventListener("slotchange", e => this[processSlotchangeEvent](e));
      Promise.resolve().then(() => {
        const slots = this.shadowRoot.querySelectorAll("slot");
        if (!slots)
          return;
        if (this[slotToAssigned].has(slots[0]))           //abort operation if browser has
          return;                                         //already run slotchange event (correctly)
        for (let i = 0; i < slots.length; i++)
          this[processSlot](slots[i]);
      });
    }

    /**
     * todo verify the presence of the bug and thus the need for this method.
     * This method is likely needing to be called when adding a new slot element to the shadowDOM
     * so to produce the initial slotchange event missing in Safari.
     *
     * @param slot the newly added slot in the shadowDOM which you wish to trigger the initial slotchange event on.
     */
    triggerSlotchangeCallbackManually(slot) {
      Promise.resolve().then(() => this[processSlot](slot));
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
      const slot = e.path.find(n => n.tagName === "SLOT" && n.getRootNode() === this.shadowRoot);
      if (onlyOncePerMicroTaskCycle(this[microTaskRegister], slot))
        this[processSlot](slot);
    }

    [processSlot](slot) {
      let newAssigned = flattenNodes(slot.assignedNodes());
      let oldAssigned = this[slotToAssigned].get(slot);
      if (!arrayEquals(oldAssigned, newAssigned)) {
        this[slotToAssigned].set(slot, newAssigned);
        this.slotchangedCallback(slot.name, newAssigned, oldAssigned);
      }
    }
  }
}