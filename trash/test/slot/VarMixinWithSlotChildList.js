/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

export function flattenAssignedNodesVar(slot) {
  let res = [];
  for (let n of slot.assignedNodes()) {
    if (n.tagName === "SLOT") { //if(node instanceof HTMLSlotElement) does not work in polyfill.
      const flat = flattenAssignedNodesVar(n);
      res = res.concat(flat);
    } else
      res.push(n);
  }
  if (res.length === 0) {
    for (let i = 0; i < slot.childNodes.length; i++) {
      let child = slot.childNodes[i];
      res.push(child);
    }
  }
  return res;
}

function triggerChainedSlotCallbacks(slot) {
  while (slot) {
    let parent = slot.parentNode;
    if (!parent)
      break;
    let slotName = slot.getAttribute("slot") || "";
    if (parent[outerAssigned] && parent.slotCallback) {
      parent.slotCallback(new Slottables(slotName, parent[outerAssigned][slotName]));
    }
    let shadow = parent.shadowRoot;
    if (!shadow)
      return;
    slot = shadow.querySelector(`slot[name="${slotName}"]`);
  }
}

function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
  }
  return res;
}

function mapSlotChildrenByNameRedundantThrowError(slots) {
  var res = {};
  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    var name = slot.name || "";
    if (res[name])
      throw new Error("No SLOT element can be added with the same 'name' attribute under the same shadowRoot. (VAR).");
    res[name] = slot.children;
  }
  return res;
}

function arrayDiff(dictA, dictB) {
  let allKeys = Object.keys(Object.assign({}, dictA, dictB));
  let res = [];
  for (let key of allKeys) {
    if (!arrayEquals(dictA[key], dictB[key]))
      res.push(key);
  }
  return res;
}

function arrayEquals(a, b) {
  return b && a && a.length === b.length && a.every((v, i) => v === b[i]);
}

class Slottables {
  constructor(name, assigneds) {
    this.name = name;
    this.assigneds = assigneds;
  }

  assignedNodes(config) {
    if (!(config && config.flatten === true))
      return this.assigneds;
    let res = [];
    if (!this.assigneds)
      return res;
    for (let n of this.assigneds) {
      if (n.tagName === "SLOT" && n.getRootNode().host) { //if(node instanceof HTMLSlotElement) does not work in polyfill.
        const flat = n.assignedNodes(config);
        res = res.concat(flat);
      } else
        res.push(n);
    }
    return res;
  }

  varAssignedNodes(config) {
    if (!(config && config.flatten === true))
      return this.assigneds;
    let res = [];
    for (let n of this.assigneds) {
      if (n.tagName === "SLOT") //if(node instanceof HTMLSlotElement) does not work in polyfill.
        res = res.concat(flattenAssignedNodesVar(n));
      else
        res.push(n);
    }
    if (res.length === 0) {
      for (let i = 0; i < this.childNodes.length; i++)
        res.push(this.childNodes[i]);
    }
    return res;
  }

  assignedElements(config) {
    return this.assignedNodes(config).filter(n => n.nodeType === Node.ELEMENT_NODE);
  }
}

/**
 * SlottableMixin adds a reactive lifecycle hook .slotCallback(...) to its subclasses.
 * SlottableMixin does not require neither a `<slot>` nor a shadowRoot to be present on the custom element,
 * it will trigger regardless.
 *
 * This lifecycle hook is triggered every time a potentially slottable nodes for the element changes.
 * .slotCallback(...) is initialized and triggers at .
 * Then .slotCallback(...) is triggered whenever the childList of the host node changes, or
 * .
 *
 * .slotCallback(slottables) is triggered:
 *  1) the first requestAnimationFrame after the element is constructed,
 *  2) whenever the childNodes of the host element changes, and
 *  3) whenever the assigned nodes of a <slot> node that is a child of the host element changes.
 *
 * Gold standard: https://github.com/webcomponents/gold-standard/wiki/
 * a) Content assignment: changes to assignedNodes of slotted children are notified as if the change happened to a normal child.
 *
 * @param Base class that extends HTMLElement
 * @returns {SlottableMixin} class that extends HTMLElement
 */
const externalChange = Symbol("externalChange");
const internalChangeAddedRemovedSlot = Symbol("internalChangeAddedRemovedSlot");
const internalChangeContentChange = Symbol("internalChangeContentChange");
const updateInternalContentChangeListeners = Symbol("updateInternalContentChangeListeners");
const updateInternalAssignedValue = Symbol("updateInternalAssignedValue");
const outerAssigned = Symbol("outerAssigned");
const innerAssigned = Symbol("innerAssigned");
const innerSlots = Symbol("innerSlots");
const innerObserver = Symbol("innerObserver");
const init = Symbol("init");

export const VarMixin = function (Base) {
  return class VarMixin extends Base {

    //todo make both MO MixinGlobals?
    constructor() {
      super();
      this[outerAssigned] = null;
      this[innerAssigned] = null;
      this[innerSlots] = [];
      this[innerObserver] = new MutationObserver(changeList => this[internalChangeContentChange](changeList));
      requestAnimationFrame(() => {
        const mo = new MutationObserver(() => this[externalChange]());
        mo.observe(this, {childList: true});
        this[init]();
      });
    }

    [internalChangeContentChange](changeList) {
      const change = changeList[changeList.length - 1];
      const slot = change.target;
      this[updateInternalAssignedValue](slot.name, slot.childNodes);
    }

    [updateInternalAssignedValue](name, childNodes) {
      const nodes = Array.from(childNodes);
      this[innerAssigned][name] = nodes;
      if (this[outerAssigned][name])
        return;
      this.slotCallback(new Slottables(name, nodes));
      if (this.shadowRoot) {
        const relevantSlot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
        triggerChainedSlotCallbacks(relevantSlot);
      }
    }

    [updateInternalContentChangeListeners](newSlots) {
      let added = [];
      let removed = [];
      for (let i = 0; i < newSlots.length; i++) {
        let newSlot = newSlots[i];
        if (this[innerSlots].indexOf(newSlot) === -1) {
          this[innerObserver].observe(newSlot, {childList: true});
          added.push(newSlot);
        }
      }
      for (let i = 0; i < this[innerSlots].length; i++) {
        let oldSlot = this[innerSlots][i];
        if (newSlots.indexOf(oldSlot) === -1) {
          this[innerObserver].disconnect(oldSlot);
          removed.push(oldSlot);
        }
      }
      this[innerSlots] = newSlots;
      this[innerAssigned] = mapSlotChildrenByNameRedundantThrowError(this[innerSlots]);
      return [added, removed];
    }

    [internalChangeAddedRemovedSlot](first) {
      const slots = this.shadowRoot.querySelectorAll("slot");
      const [added, removed] = this[updateInternalContentChangeListeners](slots);
      if (!first) {
        for (let i = 0; i < added.length; i++) {
          let newSlot = added[i];
          this[updateInternalAssignedValue](newSlot.name, newSlot.childNodes);
        }
        for (let i = 0; i < removed.length; i++) {
          let oldSlot = removed[i];
          this[updateInternalAssignedValue](oldSlot.name, undefined);
        }
      }
      requestAnimationFrame(() => this[internalChangeAddedRemovedSlot]());
      return added;
    }

    [init]() {
      this[internalChangeAddedRemovedSlot](true);   //will set up this[innerAssigned]
      this[outerAssigned] = mapNodesByAttributeValue(this.childNodes, "slot");
      const outerOverwritesInnerChildren = Object.assign({"": []}, this[innerAssigned], this[outerAssigned]);  //A) should the default "" empty-string slotname always be triggered at init time, like this:
      // const outerOverwritesInnerChildren = Object.assign(innerChildren, outerChildren);                     //B) or only triggered if there is absolutely no slots triggered? like this
      //if (Object.keys(outerOverwritesInnerChildren).length === 0) outerOverwritesInnerChildren[""] = [];     //=> A is conceptually simpler. I go with A).
      for (let name in outerOverwritesInnerChildren)
        this.slotCallback(new Slottables(name, outerOverwritesInnerChildren[name]));

      //todo now I also need to monitor the content of my innerChildren. There is are two things that can happen:
      //todo 1) a change in the makeup of the shadowRoot dom changes which inner slot is the assignable one.
      //todo    a) a new slot/var node with the same name is added in front.
      //todo    b) a slot/var node with a name is removed, thus leaving a blank space or opening up for a second redundant slot.
      //todo    c) or a slot is moved up or down in the tree order, thus changing which slot/var node with the same name
      //todo       is the redundant one, and which is the active one.
      //todo    r) I think 1c) should be solved by making it illegal to connect a slot node with the same name as another
      //todo       in the shadowDOM. This will throw an Error, and the VAR/slot element will not connect itself. Yes!
      //todo    s) mapSlotChildrenByNameRedundantThrowError checks that no nodes slot/var nodes use the same name attribute within the shadowRoot.
      //todo    x) 1a and 1b) should be solved using connectedCallback and disconnectedCallback on the VAR element.
      //todo       Whenever a VAR element connects or disconnects, they alert their .getRootNode().host and
      //todo       that triggers an update of the innerAssigneds and potentially a varCallback().
      //todo    y) this can only be implemented using a rAF poll in the demo I think.
      //todo
      //todo 2) the childList of a slot/var node changes. This would cause the changed event, obviously.
      //todo    x) this can be solved by adding a childList event listener on the slot/var element.
      //todo    y) this can be implemented using a rAF poller in demo, or as adding MutationObserver for all the slot.childNodes.

      //todo thus, one needs a check of all the slots inside to trigger slotchange callbacks that were not triggered.
      //todo this also means that the slots (or the VAR) elements in the shadowRoot must alert their hostNode when their children changes.
      //todo but this is not an event, this is a direct call to .getRootNode().host that new Slottables(slot/var.name, slot/var.children)
      //todo It is a question if these events should fire if the slot/VAR has other nodes assigned to it. If so,
      //todo this underlying change will not take effect. I think then it should not cause a callback, as this would be confusing.
      //todo this innerTriggered callback only applies if the VAR already has an external value assigned to it.
      //todo this means that the innerAssigneds and the outerAssigneds should be stored separately, so that they can be tested separately.
      //todo NICE! This is good. At startup, we make the two maps. The outerAssigneds and the innerAssigneds.
      //todo at startup we also trigger one callback per name, where the outerAssigned override the innerAssigneds.
      //todo then we react to changes. If the child list changes, then we do a change of the outerAssigneds. We find which ones that have triggered,
      //todo and call them. If something is removed, then that will get the value of the innerAssigned as fallback.
      //todo If an innerAssigned has changed, then we check if 1) that is not a redundant slot
      //let activeSlotIsRelevant = slotchangeEvent.slot === this.shadowRoot.querySelector("slot[name='slotchangeEvent.name']) //with tests for "" and checking that you are working against the correct slot in the slotchange.composedPath()
      //todo if activeSlotIsRelevant, then we update the innerAssigneds values.
      //todo then, we check if there is an outerValue for that name. If it is, we do nothing, if it is not, then we call the varCallback().
    }

    [externalChange]() {
      const children = mapNodesByAttributeValue(this.childNodes, "slot");
      let diffs = arrayDiff(this[outerAssigned], children);
      for (let name of diffs) {
        this.slotCallback(new Slottables(name, children[name]));
        if (this.shadowRoot) {
          const relevantSlot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
          triggerChainedSlotCallbacks(relevantSlot);
        }
      }
      this[outerAssigned] = children;
    }
  }
};