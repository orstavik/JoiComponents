/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

import {flattenNodes} from "./flattenNodes.js";

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

const assignedNodesCache = new WeakMap();

const slotToFlatAssigned = new WeakMap();
const slotToFlatAssignedSlots = new WeakMap();
const assignedSlotToTriggerSlot = new WeakMap();

function processPrimarySlot(slot) {
  //step 1, (as quickly as possible) make sure it is not a redundant call
  const newAssigned = slot.assignedNodes();
  if (arrayEquals(newAssigned, assignedNodesCache.get(slot)))
    return;
  assignedNodesCache.set(slot, newAssigned);

  //step 2, make them flat
  const newFlatAssigned = flattenNodes(slot.assignedNodes());
  if (arrayEquals(newFlatAssigned, slotToFlatAssigned.get(slot)))
    return;
  slotToFlatAssigned.set(slot, newFlatAssigned);

  //step 3, add mediary trigger to any child slots
  //this mediary trigger must callback the "owner" of this slot,
  //but this mediary trigger must also add its own slots to the mix.

}

//when a mediary slotchange occurs, I only need to alert my parent(s), and let them process themselves again

function processSlot(triggerSlot) {
  //step 1, check the flatAssigned
  const newFlatAssigned = flattenNodes(triggerSlot.assignedNodes());
  if (arrayEquals(newFlatAssigned, slotToFlatAssigned.get(triggerSlot)))
    return;
  slotToFlatAssigned.set(triggerSlot, newFlatAssigned);

  //step 2,
  const newFlatSlots = newFlatAssigned.filter(n => n.tagName && n.tagName === "SLOT");
  const oldFlatSlots = slotToFlatAssignedSlots.get(triggerSlot);
  if (!arrayEquals(newFlatSlots, oldFlatSlots)) {

    addTriggerSlotToChildSlot(triggerSlot, newFlatSlots, oldFlatSlots);
    //this is two weakmaps, one from triggerSlot ->[assignedSlots] (this is stamped in and out)
    //one from assignedSlot -> [triggerSlot1, triggerSlot2] (this is gradually produced)
    //this needs to be updated, and if the assignedSlot -> [] empty array, then the event listener for that slot must be removed
  }
  
}

export function ShadowSlotchangeMixin(Base) {
  return class ShadowSlotchangeMixin extends Base {

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.shadowRoot.addEventListener("slotchange", ev => processPrimarySlot(ev.target));
      this.firstSlotchangeTriggered || (this.firstSlotchangeTriggered = true, this.triggerSlotchangeManually());
    }

    //todo check if we need this in Safari when slots are added dynamically too
    triggerSlotchangeManually() {
      const slots = this.shadowRoot.querySelectorAll("slot");
      if (slots) {
        for (let i = 0; i < slots.length; i++) {
          processPrimarySlot(slots[i]);
        }
      }
    }
  }
}