/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

import {flattenNodes} from "./flattenNodes.js";

const parentSlotToSlot = new WeakMap();
const slotToChainedSlots = new WeakMap();
const slotToAssignedNodes = new WeakMap();
const slotToFlattenedNodes = new WeakMap();

function processSlotchangeEvent(ev) {
  processSlot(ev.target);
}

function addChainedSlotsRecursively(removedParentSlots, addedParentSlots, slot) {
  //the chained slots have changed, then we need to listen for slot changes on those elements
  //and we need to remember chainHolder slot of the slot that is assigned to it.
  for (let parent of removedParentSlots) {
    //todo here I also actually need to process children slots recursively
    if (parentSlotToSlot.has(parent))
      parent.removeEventListener("slotchange", processSlotchangeEvent);
    parentSlotToSlot.delete(parent);
  }
  for (let parent of addedParentSlots) {
    if (!parentSlotToSlot.has(parent))
      parent.addEventListener("slotchange", processSlotchangeEvent);
    parentSlotToSlot.set(parent, slot);
    //todo here I also actually need to process children slots recursively
  }
}

function getOnlyAddedAndRemovedChainedSlots (newAssigned, slot) {
  const newChainedSlots = newAssigned.filter(n => n.tagName && n.tagName === "SLOT");
  const oldChainedSlots = slotToChainedSlots.get(slot);
  if (arrayEquals(newChainedSlots, oldChainedSlots))
    return null;
  slotToChainedSlots.set(slot, newChainedSlots);
  return {
    removedParentSlots: oldChainedSlots.filter(slot => !newChainedSlots.contains(slot)),  //todo contains method does not exist
    addedParentSlots: newChainedSlots.filter(slot => !oldChainedSlots.contains(slot))
  };
}

function getOnlyChangedAssignedNodes(slot) {
  const newAssigned = slot.assignedNodes();
  const oldAssigned = slotToAssignedNodes.get(slot);
  if (arrayEquals(newAssigned, oldAssigned))      //this might actually be possible to verify with a dirty check.. don't know how Safari does this, it the array is new all the time, if they reuse the array, etc.
    return null;
  slotToAssignedNodes.set(slot, newAssigned);
  return newAssigned;
}

function triggerSlotchangeCallbackRecursively(slot) {
  //todo this need to check if the slot has been removed, if there are no longer any parent nodes for this slot.
  //todo if there is not, then remove its listener.
  for (let slot = slot; slot; slot = parentSlotToSlot.get(slot)) {
    const node = slot.getRootNode().parentNode;
    if (!node || !node.isConnected || !node.slotchangedCallback)
      continue;
    const flattenedNodes = flattenNodes(slot);//make a new better method for this?? that caches intermediary results.. but do i want that caching, as it may break gc??
    const oldFlattenedNodes = slotToFlattenedNodes.get(slot);
    slotToFlattenedNodes.set(slot, flattenedNodes);

    if (!arrayEquals(flattenedNodes, oldFlattenedNodes))    //this might not be true if only a blank slot was added triggering an empty change
      node.slotchangedCallback(slot.name, flattenedNodes, oldFlattenedNodes);
  }
}

function processSlot2(triggerSlot){
  const newFlattened = flattenNodes(triggerSlot.assignedNodes());
  if (newFlattened === oldFlattened.get(triggerSlot))
    return;
  const newChainedSlots = newFlattened.filter(n => n.tagName && n.tagName === "SLOT");
  if (newChainedSlots !== oldFlattenedSlots.get(triggerSlot))
    addTriggerSlotToChildSlot(triggerSlot, newChainedSlots, oldChainedSlots);
    //this is two weakmaps, one from triggerSlot ->[assignedSlots] (this is stamped in and out)
    //one from assignedSlot -> [triggerSlot1, triggerSlot2] (this is gradually produced)
    //run on this current slot and all the triggerSlots
}

function processSlot(slot) {
  //get flattened assigned nodes.
  //If this list hasn't changed, do nothing.

  //add event listeners for potential newcomers (it is problematic to remove)
  //I filter the list for SLOT elements.
  //If this list has changed, I find the added slots, and add event listeners for them.
  //each of these slots gets a pointer to the triggerSlot
  //The added I need to add listeners for, the removed I need to remove listeners for.
  //Do I need to keep a map of these listeners? I think not.
  //in this callback, i test to see if it is a SLOT, and then if it will

  //I get all the flattenedNodes and all the
  //I register the flattenedNodes on the element.
  //Then I get all the flattenedSlots
  //I register the flattenedSlots on the element.
  //If there are any added flattenedSlots, I register slot listeners on them.
  //If there are any removed slotListeners, I remove slot listeners on them.
  //I keep a weak set of all the slots with slot listeners, so I am sure they are not added twice.
  //I keep a reverse top to down of chained slots, this must be done in a
  const newAssigned = getOnlyChangedAssignedNodes(slot);
  if (!newAssigned)
    return;
  const obj = getOnlyAddedAndRemovedChainedSlots(newAssigned, slot);
  if (obj)
    addChainedSlotsRecursively(obj.removedParentSlots, obj.addedParentSlots, slot);
  triggerSlotchangeCallbackRecursively(slot);
}

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function ShadowSlotchangeMixin(Base) {
  return class ShadowSlotchangeMixin extends Base {

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.shadowRoot.addEventListener("slotchange", processSlotchangeEvent);
      this.firstSlotchangeTriggered || (this.firstSlotchangeTriggered = true, this.triggerSlotchangeManually());
    }

    //todo check if we need this in Safari when slots are added dynamically too
    triggerSlotchangeManually() {
      const slots = this.shadowRoot.querySelectorAll("slot");
      if (slots) {
        for (let i = 0; i < slots.length; i++) {
          processSlot(slots[i]);
        }
      }
    }
  }
}