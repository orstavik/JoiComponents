/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
import {flattenNodes} from "./flattenNodes.js";

const isInit = Symbol("isInit");
const init = Symbol("init");
const primarySlotchange = Symbol("primarySlotchange");
const slotToAssigned = Symbol("slotToAssigned");
const isProcessed = Symbol("slotToAssigned");

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function DeepShadowSlotchangeMixin(Base) {
  return class DeepShadowSlotchangeMixin extends Base {

    constructor() {
      super();
      this[isInit] = false;
      this[isProcessed] = new WeakSet();
      this[slotToAssigned] = new WeakMap();
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this[isInit] || (this[isInit] = true, this[init]());
    }

    [init]() {
      this.shadowRoot.addEventListener("slotchange", e => {
        //todo chained slots trigger "the same" slotchange events multiple times for their grand parents in Chrome.
        //todo to filter this bug, you need to ensure that the only slotchange event you listen for, are
        //todo the slotchange events that is coming from within the shadowRoot.

        //todo but this does NOT happen when you have only a single parent.
        //todo this behavior is confusing!!

        //todo the solution. Find the slot which has this.shadowRoot as its getRootNode()
        //

        const mySlot = e.path.find(n => n.tagName === "SLOT" && n.getRootNode() === this.shadowRoot);
        if (this[isProcessed].has(mySlot))
          return;
        this[isProcessed].add(mySlot);
        Promise.resolve().then(() => {
          this[isProcessed].delete(mySlot);
        });
        this[primarySlotchange](mySlot);
      });
      Promise.resolve().then(() => {
        const slots = this.shadowRoot.querySelectorAll("slot");
        if (!slots)
          return;
        if (this[slotToAssigned].has(slots[0]))           //abort operation if browser has
          return;                                         //already run slotchange event (correctly)
        for (let i = 0; i < slots.length; i++)
          this[primarySlotchange](slots[i]);
      });
    }

    //todo I think this method needs to be called after adding a slot in the shadowDOM because
    //todo Safari does not trigger an initial slotchange event
    triggerSlotchangeCallback(slot) {
      Promise.resolve().then(() => this[primarySlotchange](slot));
    }

    [primarySlotchange](slot) {
      let newAssigned = flattenNodes(slot.assignedNodes());
      let oldAssigned = this[slotToAssigned].get(slot);
      if (!arrayEquals(oldAssigned, newAssigned)) {
        this[slotToAssigned].set(slot, newAssigned);
        this.slotchangedCallback(slot.name, newAssigned, oldAssigned);
      }
    }
  }
}