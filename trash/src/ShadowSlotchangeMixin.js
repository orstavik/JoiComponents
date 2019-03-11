/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

import {flattenNodes} from "./flattenNodes.js";

const slotchangeListener = Symbol("slotchangeListener");
const triggerSlotchangeCB = Symbol("triggerSlotchangeCB");
const slots = Symbol("slots");
const assigneds = Symbol("assigneds");

//MAP A: wM(element => sM(slot => {assignedNodes: [], assignedSlots: []}))
//MAP B: wM(slot => element)

//Two things happen.
//A new element+slot+assignedNodes is detected.
//if the array is the same as before, return
//else
//set it to the first property, and you should trigger the slotchange on this slot element
//find the assignedSlots in it
//if it is the same as before, return
//else
//add it/remove element from MAP B
//


//function A+ addElement+Slot=AssignedList(element, slot, listOfAssignedNodes) => element + slot yields a list of assigned
//            return true if that entry changes, false if it was the exact same as before
//function A- addElement+Slot=AssignedList(element, slot). just delete that entry from the middle map

//function B+ addElement+Slot=chainedSlots(element, slot, chainedSlots)
//            only run this if A+ is true
//            add eventListener to these slot elements, that triggers the reactive function for the slot listeners.

//function B- addElement+Slot=chainedSlots(element, slot). just delete that entry from the middle map


//If adding a slot+element, then adding slot -> element and element -> slot, no problem.
//If removing a slot+element, then the same, get the list of the slot -> element, and then remove element from this list, the same with element -> slot
//when I remove an element, I remove it whole-sale. That means that I remove the whole list, and then remove the element from the slot one by one.

//when a slotchange occurs, then just call the callback on all the registered elements.

//problem 2: how can we remember the assignedNodes without storing them..
//we want the assignedNodes.
//solution 2: When this element is garbageCollected, then that should trigger the garbageCollection of the rest.
//if we put everything in WeakMaps, then shouldn't that work?
//i think it should

const chainedSlots = new WeakMap(); //WeakMap(slot -> array of elements with this mixin that currently has it inside))
//every time a slotchange occurs on a slot, iterate elements that has this slot active, and run it
//problem....
//then

function composedSlotchange(slotchangeEvent){
  slotchangeEvent.target.dispatchEvent(new CustomEvent("slotchange-composed", {bubbles: true, composed: true}));
}

//todo I can make it so that every slot that is assigned listens to a

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function ShadowSlotchangeMixin(Base) {
  return class ShadowSlotchangeMixin extends Base {

    constructor() {
      super();
      this[slotchangeListener] = (e) => this[triggerSlotchangeCB](e.target);
      this[slots] = [];
      this[assigneds] = new WeakMap();
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.shadowRoot.addEventListener("slotchange", this[slotchangeListener]);
      const slots = this.shadowRoot.querySelectorAll("slot");
      if (!slots) return;
      for (let i = 0; i < slots.length; i++)
        this[triggerSlotchangeCB](slots[i]);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.shadowRoot.removeEventListener("slotchange", this[slotchangeListener]);
    }

    [triggerSlotchangeCB](slot) {
      let newAssigned = flattenNodes(slot.assignedNodes());
      let oldAssigned = this[assigneds].get(slot);
      if (arrayEquals(oldAssigned, newAssigned))
        return;
      this[assigneds].set(slot, newAssigned);
      const newAssignedSlots = newAssigned.filter(node => node.tagName && node.tagName === "SLOT");
      const oldAssignedSlots = this[assignedSlots].get(slot);
      this.addChainedSlotListeners(newAssignedSlots, oldAssignedSlots, slot);
      this.slotchangedCallback(slot.name, newAssigned, oldAssigned);
    }

    addChainedSlotListeners(newAssignedSlots, oldAssignedSlots, key) {
      const addedSlots = newAssignedSlots.filter(slot => !oldAssignedSlots.has(slot));
      for (let addedSlot of addedSlots)
        addedSlot.addEventListener("slotchange", this[slotchangeListener]);
      const removedSlots = oldAssignedSlots.filter(slot => !newAssignedSlots.has(slot));
      for (let removedSlot of removedSlots)
        removedSlot.removeEventListener("slotchange", this[slotchangeListener]);
      this[assignedSlots].set(slot, newAssigned);
    }
  }
}