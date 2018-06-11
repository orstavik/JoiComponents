import {flattenedChildren} from "../../src/flattenedChildren.js";

function childrenDesc(els){
  return els.map(n => n.type + "#" + n.id);
}

describe('flattenedChildrenTest basics', function () {

  it("flattenedChildren() on single element", function () {
    const Subclass = class Subclass extends HTMLElement {
    };
    customElements.define("flattened-children-1", Subclass);
    const el = new Subclass();
    assert(flattenedChildren(el).length === 0);
    let child = document.createElement("div");
    el.appendChild(child);
    el.appendChild(document.createElement("slot"));
    assert(flattenedChildren(el).length === 1);
    el.removeChild(child);
    assert(flattenedChildren(el).length === 0);
  });

  it("The super inner-outer-slot test 1", function () {

    const InnerElementThatObserveChildren = class extends HTMLElement {
    };

    const OuterElementThatSlotsStuff = class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <inner-flattened-children>
            <slot></slot>
          </inner-flattened-children>
        `;
      }
    };

    customElements.define("inner-flattened-children", InnerElementThatObserveChildren);
    customElements.define("outer-flattened-children", OuterElementThatSlotsStuff);

    const outer = new OuterElementThatSlotsStuff();
    const inner = outer.shadowRoot.children[0];
    const innerSlot = inner.children[0];

    //no div added as child, all slots are empty
    assert(flattenedChildren(inner).length === 0);
    assert(innerSlot.assignedNodes().length === 0);

    //add a div to outer
    let slotted = document.createElement("div");
    outer.appendChild(slotted);
    assert(flattenedChildren(inner).length === 1);
    assert(innerSlot.assignedNodes().length === 1);
    inner.removeChild(innerSlot);
    assert(flattenedChildren(inner).length === 0);
    assert(innerSlot.assignedNodes().length === 0);
    inner.appendChild(innerSlot);
    assert(flattenedChildren(inner).length === 1);
    assert(innerSlot.assignedNodes().length === 1);
  });

  it("BucketList test", function () {
    class BucketList extends HTMLElement {

      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `<style id="sty">text-align: center;</style><slot></slot>`;
      }
    }

    customElements.define("bucket-list", BucketList);

    const topDocument = document.createElement("div");
    topDocument.innerHTML = `
      <bucket-list id="list"><div id="one">fix bike</div><div id="two">slice cucumbers</div></bucket-list>
    `;

    const list = topDocument.querySelector("#list");
    const listShadow = list.shadowRoot;
    const listShadowSlot = listShadow.children[1];

    expect(flattenedChildren(list).map(n => n.tagName + "#" + n.id)).to.deep.equal(["DIV#one", "DIV#two"]);
    expect(flattenedChildren(listShadow).map(n => n.tagName + "#" + n.id)).to.deep.equal(["STYLE#sty", "DIV#one", "DIV#two"]);
    expect(listShadowSlot.assignedNodes().map(n => n.tagName + "#" + n.id)).to.deep.equal(["DIV#one", "DIV#two"]);
    const one = topDocument.querySelector("#one");
    list.removeChild(one);
    expect(flattenedChildren(list).map(n => n.tagName + "#" + n.id)).to.deep.equal(["DIV#two"]);
    expect(flattenedChildren(listShadow).map(n => n.tagName + "#" + n.id)).to.deep.equal(["STYLE#sty", "DIV#two"]);
    expect(listShadowSlot.assignedNodes().map(n => n.tagName + "#" + n.id)).to.deep.equal(["DIV#two"]);
  });
});

