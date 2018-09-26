/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

function mapNodesByAttributeValue(nodes, attributeName) {
  var res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = n.getAttribute ? (n.getAttribute(attributeName) || "") : "";
    (res[name] || (res[name] = [])).push(n);
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
    for (let n of this.assigneds) {
      //todo here I need to add the rule that if it is not part of a shadowDom, then it should just be pushed as it is
      if (n.tagName === "SLOT") { //if(node instanceof HTMLSlotElement) does not work in polyfill.
        const flat = n.assignedNodes({flatten: true});
        res = res.concat(flat);
      } else
        res.push(n);
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
const hostChildrenChanged = Symbol("hostChildrenChanged");
const hostSlotchange = Symbol("chainedSlotchangeEvent");
const slottables = Symbol("notFlatMap");

export const SlottableMixin = function (Base) {
  return class SlottableMixin extends Base {

    constructor() {
      super();
      this[slottables] = {};
      requestAnimationFrame(() => {
        const mo = new MutationObserver(() => this[hostChildrenChanged]());
        mo.observe(this, {childList: true});
        this.addEventListener("slotchange", e => this[hostSlotchange](e));
        this[hostChildrenChanged]();
      });
    }

    [hostSlotchange](e) {
      //todo I need to filter grandparents with illegal slot names too, right??
      const slot = e.composedPath().find(n => n.tagName === "SLOT" && n.parentNode === this);
      if (!slot)    //a slotchange event of a grandchild in the lightdom, not for me
        return;
      e.stopPropagation();
      const slotName = slot.getAttribute("slot") || "";//todo test for this use of slotnames to guide the slot assigning
      this.slotCallback(new Slottables(slotName, this[slottables][slotName]));
    }

    [hostChildrenChanged]() {
      const children = mapNodesByAttributeValue(this.childNodes, "slot");
      for (let name in children) {
        if (!arrayEquals(children[name], this[slottables][name]))
          this.slotCallback(new Slottables(name, this[slottables][name] = children[name]));
      }
    }
  }
};
// [registered observers hold weak references/are automatically garbagecollected](https://dom.spec.whatwg.org/#garbage-collection)
