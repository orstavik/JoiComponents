function makeTestClass(name, shadowString, mixin, slotCallback) {
  return class extends mixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = shadowString;
      this.testValue = [];
    }

    [slotCallback](slot, indirectness, ev) {
      if (this._stop) throw new Error("Bug in test: Lingering slotCallback");
      this.testValue.push({
        slotName: slot.name,
        value: slot.assignedNodes({flatten: true}),
        slot,
        indirectness,
        ev
      });
    }

    stop() {
      this._stop = true;
    }
  }
}

function testAssignedValues(actuals, expecteds) {
  expect(actuals.length === expecteds.length);
  for (let i = 0; i < expecteds.length; i++) {
    let exp = expecteds[i];
    let act = actuals[i];
    expect(act.slot.name).to.be.equal(exp.name);
    let assigned = act.value.map(n => n.nodeName ? n.nodeName : "#text");
    expect(assigned).to.deep.equal(exp.flattened);
  }
}

const runSlotchangeMixinTest = function (SlotchangeMixinType, slotCallback) {
  describe(SlotchangeMixinType.name, function () {

    const name = SlotchangeMixinType.name.toLowerCase();

    const Slot1Shadow = "<slot></slot>";

    const GrandpaSlotShadow = `
          <${name}-chained-slot>
            <slot></slot>
          </${name}-chained-slot>`;

    const GrandpaSlotWithSlotnameShadow = `
          <${name}-chained-slot>
            <slot name="a"></slot>
          </${name}-chained-slot>`;

    const GrandGrandSlotShadow = `
          <${name}-grandpa-slot>
            <slot></slot>
          </${name}-grandpa-slot>`;

    const ChainedSlotsGrandpaErrorShadow = `
          <${name}-test-one>
            <div>
              <slot></slot>
            </div>
          </${name}-test-one>`;


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

    const Slot1 = makeTestClass("Slot1", Slot1Shadow, SlotchangeMixinType, slotCallback);
    const GrandpaSlot = makeTestClass("GrandpaSlot", GrandpaSlotShadow, SlotchangeMixinType, slotCallback);
    const GrandpaSlotWithSlotname = makeTestClass("GrandpaSlotWithName", GrandpaSlotWithSlotnameShadow, SlotchangeMixinType, slotCallback);
    const GrandGrandSlot = makeTestClass("GrandGrandSlot", GrandGrandSlotShadow, SlotchangeMixinType, slotCallback);
    const ChainedSlotsGrandpaError = makeTestClass("ChainedSlotsGrandpaError", ChainedSlotsGrandpaErrorShadow, SlotchangeMixinType, slotCallback);

    customElements.define(name + "-chained-slot-error", ChainedSlotsGrandpaError);
    customElements.define(name + "-grand-grand-slot", GrandGrandSlot);
    customElements.define(name + "-grandpa-slot-with-name", GrandpaSlotWithSlotname);
    customElements.define(name + "-grandpa-slot", GrandpaSlot);
    customElements.define(name + "-chained-slot", SlotWrapper);
    customElements.define(name + "-test-one", Slot1);

    it("extend HTMLElement class correctly and make an element", function () {
      class SlotTestClass extends SlotchangeMixinType(HTMLElement) {
        constructor() {
          super();
          this.attachShadow({mode: "open"});
        }

        [slotCallback]() {
        }
      }

      customElements.define(name + "-slot-test-class", SlotTestClass);
      const el = new SlotTestClass();
      let proto = el.constructor;
      expect(proto.name).to.be.equal("SlotTestClass");
      proto = Object.getPrototypeOf(proto);
      expect(proto.name).to.be.equal(SlotchangeMixinType.name);
      proto = Object.getPrototypeOf(proto);
      expect(proto.name).to.be.equal("HTMLElement");
    });

    it("SlottableMixin add DIV imperative and trigger slotchangedCallback", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));
      requestAnimationFrame(() => {
        const elExpected = [
          {name: "", flattened: ["DIV"]}
        ];
        testAssignedValues(el.testValue, elExpected);
        el.stop();
        done();
      });
    });

    it("chained slot test", function (done) {
      const el = new SlotWrapper();
      const inner = el.shadowRoot.children[0];
      el.appendChild(document.createElement("div"));
      requestAnimationFrame(() => {
        const elExpected = [
          {name: "", flattened: ["#text", "DIV", "#text"]}
        ];
        testAssignedValues(inner.testValue, elExpected);
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
      expect(el.testValue).to.deep.equal([]);
      requestAnimationFrame(() => {
        const test = [{slotName: "", value: ["DIV", "DIV", "DIV"]}];
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

    it("slottables also trigger callbacks in SlottableMixin and VarMixin", function (done) {
      const el = new Slot1();
      el.innerHTML = "<div id='a'></div><div id='b' slot='something'></div>";
      requestAnimationFrame(() => {
        if (SlotchangeMixin === SlotchangeMixinType)
          return done();
        expect(el.testValue.length).to.be.equal(2);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].id).to.be.equal("a");
        expect(el.testValue[1].slotName).to.be.equal("something");
        expect(el.testValue[1].value.length).to.be.equal(1);
        expect(el.testValue[1].value[0].id).to.be.equal("b");
        el.stop();
        done();
      });
    });

    it("removing elements also trigger callbacks", function (done) {
      const el = new Slot1();
      el.innerHTML = "<div id='a'></div>";
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].id).to.be.equal("a");
        el.children[0].remove();
        requestAnimationFrame(() => {
          expect(el.testValue.length).to.be.equal(2);
          expect(el.testValue[1].slotName).to.be.equal("");
          expect(el.testValue[1].value.length).to.be.equal(0);
          el.stop();
          done();
        });
      });
    });

    it("removing elements also trigger callbacks, slottables", function (done) {
      const el = new Slot1();
      el.innerHTML = "<div id='a'></div><div id='b' slot='something'></div>";
      requestAnimationFrame(() => {
        if (SlotchangeMixin === SlotchangeMixinType)
          return done();
        expect(el.testValue.length).to.be.equal(2);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].id).to.be.equal("a");
        expect(el.testValue[1].slotName).to.be.equal("something");
        expect(el.testValue[1].value.length).to.be.equal(1);
        expect(el.testValue[1].value[0].id).to.be.equal("b");
        el.children[1].remove();
        requestAnimationFrame(() => {
          expect(el.testValue.length).to.be.equal(3);
          expect(el.testValue[2].slotName).to.be.equal("something");
          expect(el.testValue[2].value.length).to.be.equal(0);
          el.children[0].remove();
          requestAnimationFrame(() => {
            expect(el.testValue.length).to.be.equal(4);
            expect(el.testValue[3].slotName).to.be.equal("");
            expect(el.testValue[3].value.length).to.be.equal(0);
            el.stop();
            done();
          });
        });
      });
    });

    it("removing elements also trigger callbacks, slottables, two at the same time", function (done) {
      const el = new Slot1();
      el.innerHTML = "<div id='a'></div><div id='b' slot='something'></div>";
      requestAnimationFrame(() => {
        if (SlotchangeMixin === SlotchangeMixinType)
          return done();
        expect(el.testValue.length).to.be.equal(2);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].id).to.be.equal("a");
        expect(el.testValue[1].slotName).to.be.equal("something");
        expect(el.testValue[1].value.length).to.be.equal(1);
        expect(el.testValue[1].value[0].id).to.be.equal("b");
        el.children[0].remove();
        el.children[0].remove();
        requestAnimationFrame(() => {
          expect(el.testValue.length).to.be.equal(4);
          expect(el.testValue[2].slotName).to.be.equal("");
          expect(el.testValue[2].value.length).to.be.equal(0);
          expect(el.testValue[3].slotName).to.be.equal("something");
          expect(el.testValue[3].value.length).to.be.equal(0);
          el.stop();
          done();
        });
      });
    });

    //todo add test for the empty initial child still gets a callback
    //todo test for fallback slot nodes

  });
};
import {SlotchangeMixin} from "../../src/slot/SlotchangeMixin.js";
import {SlottableMixin} from "../../src/slot/SlottableMixin.js";
import {VarMixin, flattenAssignedNodesVar} from "../../src/slot/VarMixin.js";

runSlotchangeMixinTest(SlotchangeMixin, "slotchangeCallback");
runSlotchangeMixinTest(SlottableMixin, "slotCallback");
runSlotchangeMixinTest(VarMixin, "slotCallback");