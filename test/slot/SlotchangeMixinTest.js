const needsChromeFix = function () {
  customElements.define("needs-chrome-fix-bug", class extends HTMLElement {
  });
  const div = document.createElement("needs-chrome-fix-bug");
  const slot = document.createElement("slot");
  const slot2 = document.createElement("slot");
  div.appendChild(slot);
  div.attachShadow({mode: "open"});
  div.shadowRoot.appendChild(slot2);
  return slot2.assignedNodes({flatten: true}).length === 1;
}();
const fixChromeAssignedNodesBug = needsChromeFix ?
  function (slot) {
    const original = slot.assignedNodes;
    slot.assignedNodes = a => original.call(slot, a).filter(n => n.tagName !== "SLOT");
    return slot;
  } :
  function (slot) {
    return slot
  };

const runSlotchangeMixinTest = function (SlotchangeMixin) {
  describe(SlotchangeMixin.name, function () {

    const name = SlotchangeMixin.name.toLowerCase();

    class Slot1 extends SlotchangeMixin(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = "<slot></slot>";
      }

      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        slot = fixChromeAssignedNodesBug(slot);
        this.testValue = this.testValue || [];
        const flat = slot.assignedNodes({flatten: true});
        this.testValue.push({
          slotName: slot.name,
          value: flat
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

    class GrandpaSlot extends SlotchangeMixin(HTMLElement) {
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
        slot = fixChromeAssignedNodesBug(slot);
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true})
        });
      }

      stop() {
        this._stop = true;
      }
    }

    class GrandpaSlotWithSlotname extends SlotchangeMixin(HTMLElement) {
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
        slot = fixChromeAssignedNodesBug(slot);
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true})
        });
      }

      stop() {
        this._stop = true;
      }
    }

    class GrandGrandSlot extends SlotchangeMixin(HTMLElement) {
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
        slot = fixChromeAssignedNodesBug(slot);
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true})
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
      expect(proto.name).to.be.equal(SlotchangeMixin.name);
      proto = Object.getPrototypeOf(proto);
      expect(proto.name).to.be.equal("HTMLElement");
    });

    it("SlotchangeMixin add DIV imperative and trigger slotchangedCallback", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));
      document.body.appendChild(el);
      //MutationObserver (is the same true for slotchange Event??)is not triggered immediately,
      //but is added to the end of the microtask que.
      //Therefor, the check of tests must be added after it in the micro task que.
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("DIV");
        el.stop();
        done();
      });
    });

    it("Unassigned slots is not printed", function (done) {
      const el = new Slot1();
      el.innerHTML = "<div></div><slot></slot>";
      // el.appendChild(document.createElement("div"));
      // el.appendChild(document.createElement("slot"));
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
          if (SlotchangeMixin === ShadowSlotchangeMixin) {
            expect(el.testValue.length).to.be.equal(1);
            expect(grandChild.testValue.length).to.be.equal(1);
          }
          else if (SlotchangeMixin === SlotchangeMixin) {
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
      el.innerHTML = "<div slot='offside'>boo</div>";   //slotchangedCallback added to the microque
      requestAnimationFrame(() => {
        if (SlotchangeMixin === ShadowSlotchangeMixin) {
          expect(child.testValue.length).to.be.equal(1);
          expect(child.testValue[0].oldChildren).to.be.equal(undefined);
          expect(child.testValue[0].value.length).to.be.equal(2);
          expect(child.testValue[0].value[0].nodeName).to.be.equal("#text");
          expect(child.testValue[0].value[1].nodeName).to.be.equal("#text");
        } else if (SlotchangeMixin === SlotchangeMixin) {
          expect(child.testValue.length).to.be.equal(1);
          expect(child.testValue[0].oldChildren).to.be.equal(undefined);
          expect(child.testValue[0].value.length).to.be.equal(2);
          expect(child.testValue[0].value[0].nodeName).to.be.equal("#text");
          expect(child.testValue[0].value[1].nodeName).to.be.equal("#text");
        }
        child.stop();
        done();
      });
    });

  });
};
import {ShadowSlotchangeMixin} from "../../src/SlotchangeMixin.js";
import {SlotchangeMixin} from "../../src/SlottableMixin.js";

runSlotchangeMixinTest(ShadowSlotchangeMixin);
runSlotchangeMixinTest(SlotchangeMixin);
