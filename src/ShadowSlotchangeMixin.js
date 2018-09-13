/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

import {flattenNodes} from "./flattenNodes.js";

const firstConnected = new WeakSet();

const slotchangeListener = Symbol("slotchangeListener");
const triggerSlotchangeCB = Symbol("triggerSlotchangeCB");
const slots = Symbol("slots");
const assigneds = Symbol("assigneds");

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function ShadowSlotchangeMixin(Base) {
  return class ShadowSlotchangeMixin extends Base {

    constructor() {
      super();
      this[slotchangeListener] = (e) => this[triggerSlotchangeCB](e.currentTarget);
      this[slots] = [];
      this[assigneds] = new WeakMap();
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      if (firstConnected.has(this))
        return;
      firstConnected.add(this);
      this.shadowRoot.addEventListener("slotchange", this[slotchangeListener]);
      const slots = this.shadowRoot.querySelector("slot");
      if (!slots) return;
      for (let i = 0; i < slots.length; i++)
        this[triggerSlotchangeCB](slot);
    }

    // disconnectedCallback() {
    //   if (super.disconnectedCallback) super.disconnectedCallback();
    //   this.shadowRoot.removeEventListener("slotchange", this[slotchangeListener]);
    // }

    [triggerSlotchangeCB](slot) {
      let newAssigned = flattenNodes(slot.assignedNodes());
      let oldAssigned = this[assigneds].get(slot);
      if (arrayEquals(oldAssigned, newAssigned))
        return;
      this[assigneds].set(slot, newAssigned);
      this.slotchangedCallback(slot.name, newAssigned, oldAssigned);
    }
  }
}