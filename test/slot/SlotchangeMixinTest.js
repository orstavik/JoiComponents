const runSlotchangeMixinTest = function (SlotchangeMixinType) {
  describe(SlotchangeMixinType.name, function () {

    const name = SlotchangeMixinType.name.toLowerCase();

    class Slot1 extends SlotchangeMixinType(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = "<slot></slot>";
      }

      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true})
          , slot
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
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true})
          , slot
        });
      }

      stop() {
        this._stop = true;
      }
    }

    class GrandpaSlotWithSlotname extends SlotchangeMixinType(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <${name}-chained-slot>
            <slot name="a"></slot>
          </${name}-chained-slot>`;
      }

      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true})
          , slot
        });
      }

      stop() {
        this._stop = true;
      }
    }

    class GrandGrandSlot extends SlotchangeMixinType(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <${name}-grandpa-slot>
            <slot></slot>
          </${name}-grandpa-slot>`;
      }

      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true})
          , slot
        });
      }

      stop() {
        this._stop = true;
      }
    }

    class ChainedSlotsGrandpaError extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <${name}-test-one>
            <div>
              <slot></slot>
            </div>
          </${name}-test-one>`;
      }
    }

    customElements.define(name + "-chained-slot-error", ChainedSlotsGrandpaError);
    customElements.define(name + "-grand-grand-slot", GrandGrandSlot);
    customElements.define(name + "-grandpa-slot-with-name", GrandpaSlotWithSlotname);
    customElements.define(name + "-grandpa-slot", GrandpaSlot);
    customElements.define(name + "-chained-slot", SlotWrapper);
    customElements.define(name + "-test-one", Slot1);

    it("extend HTMLElement class correctly and make an element", function () {
      const el = new Slot1();
      let proto = el.constructor;
      el.id = "boo";
      expect(proto.name).to.be.equal("Slot1");
      proto = Object.getPrototypeOf(proto);
      expect(proto.name).to.be.equal(SlotchangeMixinType.name);
      proto = Object.getPrototypeOf(proto);
      expect(proto.name).to.be.equal("HTMLElement");
    });

    it("SlottableMixin add DIV imperative and trigger slotchangedCallback", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        el.stop();
        done();
      });
    });

    it("chained slot test", function (done) {
      const el = new SlotWrapper();
      const inner = el.shadowRoot.children[0];
      el.appendChild(document.createElement("div"));
      requestAnimationFrame(() => {
        expect(inner.testValue.length).to.be.equal(1);
        expect(inner.testValue[0].slotName).to.be.equal("");
        expect(inner.testValue[0].value.length).to.be.equal(3);
        expect(inner.testValue[0].value[1].nodeName).to.be.equal("DIV");
        inner.stop();
        done();
      });
    });

    it("chained slot test: two slotCallbacks", function (done) {
      const el = new SlotWrapper();
      const inner = el.shadowRoot.children[0];
      requestAnimationFrame(() => {
        expect(inner.testValue.length).to.be.equal(1);
        expect(inner.testValue[0].slotName).to.be.equal("");
        expect(inner.testValue[0].value.length).to.be.equal(2);
        el.appendChild(document.createElement("p"));
        Promise.resolve().then(() => {                //we must wait for the slotchange event which is run at the end of microtask que
          if (name === "varmixin")         //not called, as SlotWrapper doesn't implement VarMixin, but only has a regular slot. Therefore, the top, initial callback doesn't trigger.
            return done();
          expect(inner.testValue.length).to.be.equal(2);
          expect(inner.testValue[1].slotName).to.be.equal("");
          expect(inner.testValue[1].value.length).to.be.equal(3);
          expect(inner.testValue[1].value[1].nodeName).to.be.equal("P");
          inner.stop();
          done();
        });
      });
    });

    //the .composedPath() of the slotchange event looks like this:
    //[slot, div, slot, document-fragment, shadowslotchangemixinarnold-test-one, document-fragment]
    //here, the "div" between the two slots indicate that the direct children of the slot has not changed,
    //only a grandchild. Such grandchild slotchange events should not trigger slotchange.
    it("not listening for slotChange on slots that are not a direct child", function (done) {
      const el = new ChainedSlotsGrandpaError();
      const inner = el.shadowRoot.children[0];
      el.appendChild(document.createElement("p"));
      requestAnimationFrame(() => {
        expect(inner.testValue.length).to.be.equal(1);
        expect(inner.testValue[0].value.length).to.be.equal(3);
        expect(inner.testValue[0].value[1].nodeName).to.be.equal("DIV");
        el.appendChild(document.createElement("p"));
        expect(inner.testValue.length).to.be.equal(1);
        inner.stop();
        done();
      });
    });

    it("connected-disconnected is irrelevant. rAF is what counts.", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchange event is flagged
      document.querySelector("body").removeChild(el);   //disconnect
      el.appendChild(document.createElement("div"));    //is not triggered.
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      expect(el.testValue).to.be.equal(undefined);
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(3);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].value[1].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].value[2].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        el.stop();
        done();
      });
    });

    it("connected-wait-disconnected-connected.", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));    //slotchangedCallback added to the microque
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        el.appendChild(document.createElement("div"));    //slotchangedCallback will be checked at end of microtasks
        el.appendChild(document.createElement("div"));
        Promise.resolve().then(() => {
          expect(el.testValue.length).to.be.equal(2);
          expect(el.testValue[1].value.length).to.be.equal(3);
          expect(el.testValue[1].value[0].nodeName).to.be.equal("DIV");
          expect(el.testValue[1].value[1].nodeName).to.be.equal("DIV");
          expect(el.testValue[1].value[2].nodeName).to.be.equal("DIV");
          el.stop();
          done();
        });
      });
    });

    it("Grandpa-slot-test. Simple.", function (done) {
      const el = new GrandpaSlot();
      const grandChild = el.shadowRoot.children[0].shadowRoot.children[0];
      el.appendChild(document.createElement("div"));    //slotchangedCallback added to the microque
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        expect(grandChild.testValue[0].value.length).to.be.equal(5);
        expect(grandChild.testValue[0].value[2].nodeName).to.be.equal("DIV");
        el.stop();
        grandChild.stop();
        done();
      });
    });

    it("GrandGrand-slot-test. Simple.", function (done) {
      const el = new GrandGrandSlot();
      const child = el.shadowRoot.children[0];
      const grandGrandChild = el.shadowRoot.children[0].shadowRoot.children[0].shadowRoot.children[0];
      el.appendChild(document.createElement("div"));    //slotchangedCallback added to the microque
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        expect(child.testValue[0].value.length).to.be.equal(3);
        expect(child.testValue[0].value[1].nodeName).to.be.equal("DIV");
        expect(grandGrandChild.testValue[0].value.length).to.be.equal(7);
        expect(grandGrandChild.testValue[0].value[3].nodeName).to.be.equal("DIV");
        el.stop();
        child.stop();
        grandGrandChild.stop();
        done();
      });
    });

    it("Grandpa-slot-test with different slot names.", function (done) {
      const el = new GrandpaSlotWithSlotname();
      const grandChild = el.shadowRoot.children[0].shadowRoot.children[0];
      el.innerHTML = "<div slot='a'></div>";  //slotchangedCallback added to the microque
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].slotName).to.be.equal("a");
        expect(grandChild.testValue[0].value.length).to.be.equal(5);
        expect(grandChild.testValue[0].value[2].nodeName).to.be.equal("DIV");
        expect(grandChild.testValue[0].slotName).to.be.equal("");
        el.appendChild(document.createElement("span"));    //slotchangedCallback added to the microque
        Promise.resolve().then(() => {
          if (SlotchangeMixinType === SlotchangeMixin) {
            expect(el.testValue.length).to.be.equal(1);
            expect(grandChild.testValue.length).to.be.equal(1);
          }
          else if (SlotchangeMixinType === SlottableMixin) {
            expect(grandChild.testValue.length).to.be.equal(1);
            expect(el.testValue.length).to.be.equal(2);
            expect(el.testValue[1].slotName).to.be.equal("");
            expect(el.testValue[1].value.length).to.be.equal(1);
            expect(el.testValue[1].value[0].nodeName).to.be.equal("SPAN");
          }
          el.stop();
          grandChild.stop();
          done();
        });
      });
    });

    it("chained slot with different name test.", function (done) {
      const el = new SlotWrapper();
      const child = el.shadowRoot.children[0];
      const div = document.createElement("div");
      div.setAttribute("slot", "offside");
      child.appendChild(div);
      requestAnimationFrame(() => {
        if (SlotchangeMixinType === SlotchangeMixin) {
          expect(child.testValue.length).to.be.equal(1);
          expect(child.testValue[0].value.length).to.be.equal(2);
          expect(child.testValue[0].value[0].nodeName).to.be.equal("#text");
          expect(child.testValue[0].value[1].nodeName).to.be.equal("#text");
        } else if (SlotchangeMixinType === SlottableMixin) {
          expect(child.testValue.length).to.be.equal(2);
          expect(child.testValue[0].slotName).to.be.equal("");
          expect(child.testValue[0].value.length).to.be.equal(2);
          expect(child.testValue[0].value[0].nodeName).to.be.equal("#text");
          expect(child.testValue[0].value[1].nodeName).to.be.equal("#text");
          expect(child.testValue[1].slotName).to.be.equal("offside");
          expect(child.testValue[1].value.length).to.be.equal(1);
          expect(child.testValue[1].value[0].nodeName).to.be.equal("DIV");
        }
        child.stop();
        done();
      });
    });

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
        let alternateFlattened = flattenAssignedNodesVar(el.testValue[0].slot);
        expect(alternateFlattened.length).to.be.equal(1);
        expect(alternateFlattened[0].nodeName).to.be.equal("DIV");
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
        let alternateFlattened = flattenAssignedNodesVar(el.testValue[0].slot);
        expect(alternateFlattened.length).to.be.equal(1);
        expect(alternateFlattened[0].nodeName).to.be.equal("DIV");
        expect(grandChild.testValue.length).to.be.equal(1);
        expect(grandChild.testValue[0].value.length).to.be.equal(6);
        expect(grandChild.testValue[0].value[2].nodeName).to.be.equal("DIV");
        expect(grandChild.testValue[0].value[3].nodeName).to.be.equal("SLOT");
        alternateFlattened = flattenAssignedNodesVar(grandChild.testValue[0].slot);
        expect(alternateFlattened.length).to.be.equal(5);
        expect(alternateFlattened[2].nodeName).to.be.equal("DIV");
        el.stop();
        done();
      });
    });

  });
};
import {SlotchangeMixin} from "../../src/SlotchangeMixin.js";
import {SlottableMixin} from "../../src/SlottableMixin.js";
import {VarMixin, flattenAssignedNodesVar} from "../../src/VarMixin.js";

runSlotchangeMixinTest(SlotchangeMixin);
runSlotchangeMixinTest(SlottableMixin);
runSlotchangeMixinTest(VarMixin);