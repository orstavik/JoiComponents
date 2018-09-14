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

const slotToAssigned = Symbol("slotToAssigned");
const slotToChainedSlots = Symbol("slotToChainedSlots");
const slotToSecondaryListeners = Symbol("slotToSecondaryListeners");

const isInit = Symbol("isInit");
const init = Symbol("init");

const primarySlotchange = Symbol("primarySlotchange");
const getSecondaryListener = Symbol("getSecondaryListener");
const addAndRemoveSecondaryListeners = Symbol("updateSecondaryListeners");

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function DeepShadowSlotchangeMixin(Base) {
  return class DeepShadowSlotchangeMixin extends Base {

    constructor() {
      super();
      this[isInit] = false;
      this[slotToSecondaryListeners] = new WeakMap();
      this[slotToAssigned] = new WeakMap();
      this[slotToChainedSlots] = new WeakMap();
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this[isInit] || (this[isInit] = true, this[init]());
    }

    [init]() {
      this.shadowRoot.addEventListener("slotchange", e => {
        debugger;
        this[primarySlotchange](e.target)
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
      if (slot.parentNode !== this.shadowRoot)
        debugger;
      const assignedNodes = slot.assignedNodes();
      const result = flattenNodes(assignedNodes);
      let newAssigned = result.result;
      let oldAssigned = this[slotToAssigned].get(slot);
      if (!arrayEquals(oldAssigned, newAssigned)) {
        this[slotToAssigned].set(slot, newAssigned);
        this.slotchangedCallback(slot.name, newAssigned, oldAssigned);
      }
      let newSlots = result.slots;
      let oldSlots = this[slotToChainedSlots].get(slot) || [];
      if (!arrayEquals(oldAssigned, newAssigned)) {
        this[slotToChainedSlots].set(slot, newSlots);
        const secondaryListener = this[getSecondaryListener](slot);
        this[addAndRemoveSecondaryListeners](secondaryListener, newSlots, oldSlots);
      }
    }

    [addAndRemoveSecondaryListeners](secondaryListener, newSlots, oldSlots) {
      const addedSlots = newSlots.filter(slot => oldSlots.indexOf(slot) < 0);
      for (let added of addedSlots)
        added.addEventListener("slotchange", secondaryListener);
      const removedSlots = oldSlots.filter(slot => newSlots.indexOf(slot) < 0);
      for (let removed of removedSlots)
        removed.removeEventListener("slotchange", secondaryListener);
    }

    [getSecondaryListener](slot) {
      let listener = this[slotToSecondaryListeners].get(slot);
      if (listener)
        return listener;
      listener = ev => this[primarySlotchange](slot);
      this[slotToSecondaryListeners].set(slot, listener);
      return listener;
    }
  }
}