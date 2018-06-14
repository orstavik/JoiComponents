/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

import {flattenNodes} from "./flattenedChildren.js";

const slotchangeListener = Symbol("slotchangeListener");
const triggerSlotchangeCallback = Symbol("triggerSlotchangeCallback");
const slots = Symbol("slots");
const assigneds = Symbol("assigneds");

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

function slotMap(slotList) {
  const dict = {};
  for (let i = slotList.length - 1; i >= 0; i--) {
    let slot = slotList[i];
    if (!dict[slot.name])
      dict[slot.name] = slot;
  }
  return dict;
}

export function SlotChangeMixin(Base) {
  return class SlotChangeMixin extends Base {

    constructor() {
      super();
      this[slotchangeListener] = (e) => this[triggerSlotchangeCallback](e);
      this[slots] = {};
      this[assigneds] = {};
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addSlotListeners();
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeSlotListeners();
    }

    updateSlotListeners() {
      this.removeSlotListeners();
      this.addSlotListeners();
    }

    addSlotListeners() {
      this[slots] = slotMap(this.shadowRoot.querySelectorAll("slot"));
      for (let slot of Object.values(this[slots]))
        slot.addEventListener("slotchange", this[slotchangeListener]);
      this[triggerSlotchangeCallback](null);
    }

    removeSlotListeners() {
      for (let slot of Object.values(this[slots]))
        slot.removeEventListener("slotchange", this[slotchangeListener]);
      this[slots] = {};
    }

    [triggerSlotchangeCallback](e) {
      for (let slotName of Object.keys(this[slots])) {
        let slot = this[slots][slotName];
        let newAssigned = flattenNodes(slot.assignedNodes());
        let oldAssigned = this[assigneds][slotName];
        if (arrayEquals(oldAssigned, newAssigned))
          continue;
        this[assigneds][slotName] = newAssigned;
        this.slotchangeCallback(slot, newAssigned, oldAssigned);
      }
    }
  }
};