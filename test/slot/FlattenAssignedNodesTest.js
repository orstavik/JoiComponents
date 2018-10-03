function flattenAssignedNodesJOIimpl(slot) {
  let res = [];
  for (let n of slot.assignedNodes()) {
    if (n.tagName === "SLOT") { //if(node instanceof HTMLSlotElement) does not work in polyfill.
      const flat = flattenAssignedNodesJOIimpl(n);
      res = res.concat(flat);
    } else
      res.push(n);
  }
  return res;
}

function addFlattenAssignedNodes2(slot) {
  if (slot.varAssignedNodes)
    return;
  slot.varAssignedNodes = function () {
    return flattenAssignedNodesJOIimpl(this);
  }.bind(slot);
}

const runSlotchangeMixinTest = function (SlotchangeMixinType) {
  describe(SlotchangeMixinType.name, function () {

    const name = SlotchangeMixinType.name.toLowerCase() + 2;

    class Slot1 extends SlotchangeMixinType(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = "<slot></slot>";
      }

      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        addFlattenAssignedNodes2(slot);
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true}),
          varAssignedNodes: slot.varAssignedNodes({flatten: true})
        });
      }

      stop() {
        this._stop = true;
      }
    }

    class SlotWrapper extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <${name}-test-one>
            <slot></slot>
          </${name}-test-one>`;
      }
    }

    class GrandpaSlot extends SlotchangeMixinType(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <${name}-chained-slot>
            <slot></slot>
          </${name}-chained-slot>`;
      }

      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        addFlattenAssignedNodes2(slot);
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true}),
          varAssignedNodes: slot.varAssignedNodes({flatten: true})
        });
      }

      stop() {
        this._stop = true;
      }
    }

    customElements.define(name + "-grandpa-slot", GrandpaSlot);
    customElements.define(name + "-chained-slot", SlotWrapper);
    customElements.define(name + "-test-one", Slot1);

    it("Slot without shadowRoot is added.", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));
      el.appendChild(document.createElement("slot"));
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(2);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].value[1].nodeName).to.be.equal("SLOT");
        expect(el.testValue[0].varAssignedNodes.length).to.be.equal(1);
        expect(el.testValue[0].varAssignedNodes[0].nodeName).to.be.equal("DIV");
        el.stop();
        done();
      });
    });

    it("Slot without shadowRoot is added: GrandPa.", function (done) {
      const el = new GrandpaSlot();
      const grandChild = el.shadowRoot.children[0].shadowRoot.children[0];
      el.appendChild(document.createElement("div"));
      el.appendChild(document.createElement("slot"));
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(2);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].value[1].nodeName).to.be.equal("SLOT");
        expect(el.testValue[0].varAssignedNodes.length).to.be.equal(1);
        expect(el.testValue[0].varAssignedNodes[0].nodeName).to.be.equal("DIV");
        expect(grandChild.testValue.length).to.be.equal(1);
        expect(grandChild.testValue[0].value.length).to.be.equal(6);
        expect(grandChild.testValue[0].value[2].nodeName).to.be.equal("DIV");
        expect(grandChild.testValue[0].value[3].nodeName).to.be.equal("SLOT");
        expect(grandChild.testValue[0].varAssignedNodes.length).to.be.equal(5);
        expect(grandChild.testValue[0].varAssignedNodes[2].nodeName).to.be.equal("DIV");
        el.stop();
        done();
      });
    });
  });
};
import {SlotchangeMixin} from "../../src/SlotchangeMixin.js";
import {SlottableMixin} from "../../src/SlottableMixin.js";
import {VarMixin} from "../../src/VarMixin.js";

runSlotchangeMixinTest(SlotchangeMixin);
runSlotchangeMixinTest(SlottableMixin);
runSlotchangeMixinTest(VarMixin);
