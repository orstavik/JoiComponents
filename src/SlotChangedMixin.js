/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

import {flattenNodes} from "./flattenedChildren.js";

const slotchangeListener = Symbol("slotchangeListener");
const triggerAllSlotchangeCB = Symbol("triggerSlotchangeCallback");
const triggerSlotchangeCB = Symbol("triggerSlotchangeCB");
const slots = Symbol("slots");
const assigneds = Symbol("assigneds");

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

function slotMap(slotList) {
  const dict = {};
  for (let i = slotList.length - 1; i >= 0; i--) {
    let slot = slotList[i];
    dict[slot.name] = slot;
  }
  return Object.values(dict);
}

export function SlotChangeMixin(Base) {
  return class SlotChangeMixin extends Base {

    constructor() {
      super();
      this[slotchangeListener] = (e) => this[triggerSlotchangeCB](e.currentTarget);
      this[slots] = [];
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

    //todo new updateSlotListeners is untested
    updateSlotListeners() {
      const newSlots = slotMap(this.shadowRoot.querySelectorAll("slot"));
      const oldSlots = this[slots];
      for (let newSlot of newSlots) {
        if (!oldSlots.indexOf(newSlot))
          newSlot.addEventListener("slotchange", this[slotchangeListener]);
      }
      for (let oldSlot of oldSlots) {
        if (!newSlots.indexOf(oldSlot))
          oldSlot.removeEventListener("slotchange", this[slotchangeListener]);
      }
      this[slots] = newSlots;
      this[triggerAllSlotchangeCB]();
    }

    addSlotListeners() {
      this[slots] = slotMap(this.shadowRoot.querySelectorAll("slot"));
      for (let slot of this[slots])
        slot.addEventListener("slotchange", this[slotchangeListener]);
      this[triggerAllSlotchangeCB]();
      //todo Should I wait for other microtasks before triggering the slotchangeUpdate??
      // Promise.resolve().then(() => this[triggerAllSlotchangeCB]());
    }

    removeSlotListeners() {
      for (let slot of this[slots])
        slot.removeEventListener("slotchange", this[slotchangeListener]);
      this[slots] = [];
    }

    [triggerAllSlotchangeCB]() {
      for (let slot of this[slots])
        this[triggerSlotchangeCB](slot);
    }

    [triggerSlotchangeCB](slot) {
      let slotName = slot.getAttribute("name");
      let newAssigned = flattenNodes(slot.assignedNodes());
      let oldAssigned = this[assigneds][slotName];
      if (arrayEquals(oldAssigned, newAssigned))
        return;
      this[assigneds][slotName] = newAssigned;
      //todo change the signature to use slotname, and not slot element as the first argument
      //todo think about this question
      this.slotchangeCallback(slot.name, newAssigned, oldAssigned);
    }
  }
};