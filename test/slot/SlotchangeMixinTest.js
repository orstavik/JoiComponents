const runSlotchangeMixinTest = function (SlotchangeMixin) {
  describe(SlotchangeMixin.name, function () {

    const name = SlotchangeMixin.name.toLowerCase();

    class Slot1 extends SlotchangeMixin(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = "<slot></slot>";
      }

      slotchangedCallback(slotName, newChildren, oldChildren) {
        this.testValue = this.testValue || [];
        this.testValue.push({slotName, newChildren, oldChildren});
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

      slotchangedCallback(slotName, newChildren, oldChildren) {
        this.testValue = this.testValue || [];
        this.testValue.push({slotName, newChildren, oldChildren});
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

      slotchangedCallback(slotName, newChildren, oldChildren) {
        this.testValue = this.testValue || [];
        this.testValue.push({slotName, newChildren, oldChildren});
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
    customElements.define(name + "-grandpa-slot", GrandpaSlot);
    customElements.define(name + "-chained-slot", SlotWrapper);
    customElements.define(name + "-test-one", Slot1);

    it("extend HTMLElement class correctly and make an element", function () {
      const el = new Slot1();
      let proto = el.constructor;
      expect(proto.name).to.be.equal("Slot1");
      proto = Object.getPrototypeOf(proto);
      expect(proto.name).to.be.equal(SlotchangeMixin.name);
      proto = Object.getPrototypeOf(proto);
      expect(proto.name).to.be.equal("HTMLElement");
    });

    it("SlotchangeMixin add DIV imperative and trigger slotchangedCallback", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));
      document.querySelector("body").appendChild(el);
      //MutationObserver (is the same true for slotchange Event??)is not triggered immediately,
      //but is added to the end of the microtask que.
      //Therefor, the check of tests must be added after it in the micro task que.
      Promise.resolve().then(() => {
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].newChildren.length).to.be.equal(1);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        document.querySelector("body").removeChild(el);
        done();
      });
    });

    it("Unassigned slots are ignored", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));
      el.appendChild(document.createElement("slot"));
      document.querySelector("body").appendChild(el);
      Promise.resolve().then(() => {
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].newChildren.length).to.be.equal(1);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        done();
      });
    });


    // add this test for ShadowSlotchangeMixin
    // it("SlotchangeMixin add SLOT imperative and trigger slotchangedCallback", function (done) {
    //   const Subclass = class Subclass extends SlotchangeMixin(HTMLElement) {
    //     slotchangedCallback(slot, newChildren, oldChildren) {
    //       expect(oldChildren).to.deep.equal([]);
    //       // expect(oldChildren).to.be.equal(undefined);
    //       expect(newChildren.length).to.be.equal(0);
    //       done();
    //     }
    //   };
    //   customElements.define("children-changed-slot-added", Subclass);
    //   const el = new Subclass();
    //   el.appendChild(document.createElement("slot"));
    //   document.querySelector("body").appendChild(el);
    //   Promise.resolve().then(()=> document.querySelector("body").removeChild(el));
    // });

    it("chained slot test", function (done) {
      const el = new SlotWrapper();
      const inner = el.shadowRoot.children[0];
      el.appendChild(document.createElement("div"));
      document.querySelector("body").appendChild(el);         //things are not slotted until something is added to the DOM
      setTimeout(() => {
      // Promise.resolve().then(() => {
        expect(inner.testValue[0].oldChildren).to.be.equal(undefined);
        expect(inner.testValue[0].newChildren.length).to.be.equal(3);
        expect(inner.testValue[0].newChildren[1].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        done();
      // });
      }, 50);
    });

    it("not listening for slotChange on slots that are not a direct child", function (done) {
      const el = new ChainedSlotsGrandpaError();
      const inner = el.shadowRoot.children[0];
      document.querySelector("body").appendChild(el);
      el.appendChild(document.createElement("p"));
      Promise.resolve().then(() => {
        expect(inner.testValue[0].oldChildren).to.be.equal(undefined);
        expect(inner.testValue[0].newChildren.length).to.be.equal(3);
        expect(inner.testValue[0].newChildren[1].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        done();
      });
    });

    it("two slotchange calls", function (done) {
      const el = new SlotWrapper();
      const inner = el.shadowRoot.children[0];
      document.querySelector("body").appendChild(el);
      Promise.resolve().then(() => {
        expect(inner.testValue[0].oldChildren).to.be.equal(undefined);
        expect(inner.testValue[0].newChildren.length).to.be.equal(2);
        expect(inner.testValue[0].slotName).to.be.equal("");
        el.appendChild(document.createElement("p"));
        Promise.resolve().then(() => {
          expect(inner.testValue[1].oldChildren.length).to.be.equal(2);
          expect(inner.testValue[1].newChildren.length).to.be.equal(3);
          expect(inner.testValue[1].newChildren[1].nodeName).to.be.equal("P");
          expect(inner.testValue[1].slotName).to.be.equal("");
          document.querySelector("body").removeChild(el);
          done();
        });
      });
    });

    it("connected-disconnected-connected. + MutationObserver only called once when micro task queued.", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchange event is flagged
      document.querySelector("body").removeChild(el);   //disconnect
      el.appendChild(document.createElement("div"));    //is not triggered.
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      Promise.resolve().then(() => {
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].newChildren.length).to.be.equal(3);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].newChildren[1].nodeName).to.be.equal("DIV");
        expect(el.testValue[0].newChildren[2].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        done();
      });
    });

    it("connected-wait-disconnected-connected.", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));    //slotchangedCallback added to the microque
      document.querySelector("body").appendChild(el);   //todo i shouldn't need to connect the child for this thing to activate, I only need that for Safari??
      Promise.resolve().then(() => {
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].newChildren.length).to.be.equal(1);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
      });
      setTimeout(() => {
        el.appendChild(document.createElement("div"));    //slotchangedCallback will be checked at end of microtasks
        el.appendChild(document.createElement("div"));
        document.querySelector("body").appendChild(el);   //todo unnecessary
        Promise.resolve().then(() => {
          expect(el.testValue[1].oldChildren).to.be.equal(el.testValue[0].newChildren);
          expect(el.testValue[1].newChildren.length).to.be.equal(3);
          expect(el.testValue[1].newChildren[0].nodeName).to.be.equal("DIV");
          expect(el.testValue[1].newChildren[1].nodeName).to.be.equal("DIV");
          expect(el.testValue[1].newChildren[2].nodeName).to.be.equal("DIV");
          document.querySelector("body").removeChild(el);   //disconnect
          done();
        });
      }, 50);
    });

    it("Grandpa-slot-test. Simple.", function (done) {
      const el = new GrandpaSlot();
      const grandChild = el.shadowRoot.children[0].shadowRoot.children[0];
      el.appendChild(document.createElement("div"));    //slotchangedCallback added to the microque
      document.querySelector("body").appendChild(el);   //todo i shouldn't need to connect the child for this thing to activate, I only need that for Safari??
      Promise.resolve().then(() => {
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].newChildren.length).to.be.equal(1);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        expect(grandChild.testValue[0].newChildren.length).to.be.equal(5);
        expect(grandChild.testValue[0].newChildren[2].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        done();
      });
    });

    it("GrandGrand-slot-test. Simple.", function (done) {
      const el = new GrandGrandSlot();
      const child = el.shadowRoot.children[0];
      const grandGrandChild = el.shadowRoot.children[0].shadowRoot.children[0].shadowRoot.children[0];
      el.appendChild(document.createElement("div"));    //slotchangedCallback added to the microque
      document.querySelector("body").appendChild(el);   //todo i shouldn't need to connect the child for this thing to activate, I only need that for Safari??
      Promise.resolve().then(() => {
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].newChildren.length).to.be.equal(1);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        expect(child.testValue[0].newChildren.length).to.be.equal(3);
        expect(child.testValue[0].newChildren[1].nodeName).to.be.equal("DIV");
        expect(grandGrandChild.testValue[0].newChildren.length).to.be.equal(7);
        expect(grandGrandChild.testValue[0].newChildren[3].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        done();
      });
    });
  });
};
import {SlotchangeMixin} from "../../src/SlotchangeMixin.js";
import {ShadowSlotchangeMixin} from "../../src/ShadowSlotchangeMixin.js";

runSlotchangeMixinTest(ShadowSlotchangeMixin);
runSlotchangeMixinTest(SlotchangeMixin);
