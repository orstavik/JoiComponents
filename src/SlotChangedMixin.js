/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

import {flattenedChildren} from "./flattenedChildren.js";

const slotchangeListener = Symbol("slotchangeListener");
const triggerSlotchangeCallback = Symbol("triggerSlotchangeCallback");
const slots = Symbol("slots");
const hostFlattenedChildren = Symbol("hostFlattenedChildren");

/**
 * The `SlotChangedMixin(Base)` will trigger a `slotChangedCallback(event)`
 * every time a `slotchange` event is fired inside the shadowDOM.
 * As `slotchange` events are {composed: true},
 * this will also catch chained `<slots>` events.
 * The event passed as arguments is the triggering slotchange event.
 *
 * @param Base class that extends HTMLElement
 * @returns {SlotChangedMixin} class that extends HTMLElement
 */
function getNecessarySlots(el) {
  const slots = el.querySelectorAll("slot");
  const res = [];
  for (let i = 0; i < slots.length; i++) {
    let slot = slots[i];
    let name = slot.getAttribute("name");
    if (!name || name === "")
      return [slot];
    res.push(slot);
  }
  return res;
}

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function SlotChangeMixin(Base) {
  return class SlotChangeMixin extends Base {

    constructor() {
      super();
      this[slotchangeListener] = (e) => this[triggerSlotchangeCallback](e);
      this[slots] = [];
      this[hostFlattenedChildren] = undefined;
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addSlotListeners();
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeSlotListeners();
    }

    updateSlotListeners() {                                         //[2]
      this.removeSlotListeners();
      this.addSlotListeners();
    }

    addSlotListeners() {
      this[slots] = getNecessarySlots(this.shadowRoot);
      for (let slot of this[slots])
        slot.addEventListener("slotchange", this[slotchangeListener]);
      this[triggerSlotchangeCallback]();
    }

    removeSlotListeners() {
      for (let slot of this[slots])
        slot.removeEventListener("slotchange", this[slotchangeListener]);
      this[slots] = [];
    }

    [triggerSlotchangeCallback](e) {
      const old = this[hostFlattenedChildren];
      const nevv = flattenedChildren(this);
      if (arrayEquals(old, nevv))
        return;
      this[hostFlattenedChildren] = nevv;
      this.slotchangeCallback(nevv, old, e);
    }
  }
};