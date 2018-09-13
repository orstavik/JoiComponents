/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */
function flattenNodes(nodes) {
  return pushAllAssigned(nodes, [], []);
}

function pushAllAssigned(nodes, result, slots) {
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    if (n.tagName === "SLOT") {  //if(node instanceof HTMLSlotElement) does not work in polyfill.
      pushAllAssigned(n.assignedNodes(), result, slots);
      slots.push(n)
    } else
      result.push(n);
  }
  return {result, slots};
}

const slotchangeListener = Symbol("slotchangeListener");
const triggerSlotchangeCB = Symbol("triggerSlotchangeCB");
const slots = Symbol("slots");
const assigneds = Symbol("assigneds");
const assignedSlots = Symbol("assignedSlots");

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function ShadowSlotchangeMixin(Base) {
  return class ShadowSlotchangeMixin extends Base {

    constructor() {
      super();
      this[slotchangeListener] = (e) => this[triggerSlotchangeCB](e.target);
      this[assigneds] = new WeakMap();
      this[assignedSlots] = new WeakMap();
      this.slotListeners = new WeakMap();
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.firstSlotchangeTriggered || (this.firstSlotchangeTriggered = true, this.triggerSlotchangeManually());
      this.shadowRoot.addEventListener("slotchange", this[slotchangeListener]);
    }

    triggerSlotchangeManually() {
      const slots = this.shadowRoot.querySelectorAll("slot");
      if (slots) {
        for (let i = 0; i < slots.length; i++) {
          this[triggerSlotchangeCB](slots[i]);
        }
      }
    }

    [triggerSlotchangeCB](slot) {
      const result = flattenNodes(slot.assignedNodes());
      let newAssigned = result.result;
      let oldAssigned = this[assigneds].get(slot);
      if(!arrayEquals(oldAssigned, newAssigned)){
        this[assigneds].set(slot, newAssigned);
        this.slotchangedCallback(slot.name, newAssigned, oldAssigned);
      }
      let newSlots = result.slots;
      let oldSlots = this[assignedSlots].get(slot);
      if (!arrayEquals(oldAssigned, newAssigned)){
        this[assignedSlots].set(slot, newSlots);
        this.updateSecondarySlotListeners(slot, newSlots, oldSlots);
      }
    }

    updateSecondarySlotListeners(slot, newSlots, oldSlots){
      const addedSlots = newSlots.filter(slot => oldSlots.indexOf(slot) < 0);
      const removedSlots = oldSlots.filter(slot => newSlots.indexOf(slot) < 0);
      for (let removed of removedSlots)
        removed.removeEventListener("slotchange", this.getSlotListener(slot));
      for (let added of addedSlots)
        added.addEventListener("slotchange", this.getSlotListener(slot));
    }

    getSlotListener(slot){
      let listener = this.slotListeners.get(slot);
      if (listener)
        return listener;
      listener = (ev) => this[triggerSlotchangeCB](slot);
      this.slotListeners.set(slot, listener);
      return listener;
    }
  }
}