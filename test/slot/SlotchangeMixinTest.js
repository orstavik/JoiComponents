const runSlotchangeMixinTest = function (SlotchangeMixin) {
  describe(SlotchangeMixin.name, function () {

    const innerSlot = SlotchangeMixin.name.toLowerCase() + "-test-one";

    class Slot1 extends SlotchangeMixin(HTMLElement) {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
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
          <${innerSlot}>
            <slot></slot>
          </${innerSlot}>`;
      }
    }

    class ChainedSlotsGrandpaError extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <${innerSlot}>
            <div>
              <slot></slot>
            </div>
          </${innerSlot}>`;
      }
    }

    customElements.define(SlotchangeMixin.name.toLowerCase() + "-chained-slot-error", ChainedSlotsGrandpaError);
    customElements.define(SlotchangeMixin.name.toLowerCase() + "-chained-slot", SlotWrapper);
    customElements.define(innerSlot, Slot1);

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
      Promise.resolve().then(() => {
        expect(inner.testValue[0].oldChildren).to.be.equal(undefined);
        expect(inner.testValue[0].newChildren.length).to.be.equal(3);
        expect(inner.testValue[0].newChildren[1].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);
        done();
      });
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

    it("connected-disconnected-connected. slotchangedCallback only triggered while connected + MutationObserver only called once when micro task queued.", function (done) {
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

    it("connected-wait-disconnected-connected. slotchangedCallback only triggered when connected.", function (done) {
      const el = new Slot1();
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      Promise.resolve().then(() => {
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].newChildren.length).to.be.equal(1);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);     //disconnect
      });
      setTimeout(() => {
        el.appendChild(document.createElement("div"));    //is not triggered.
        el.appendChild(document.createElement("div"));    //is not triggered.
        document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
        expect(el.testValue[0].oldChildren).to.be.equal(undefined);
        expect(el.testValue[0].newChildren.length).to.be.equal(1);
        expect(el.testValue[0].newChildren[0].nodeName).to.be.equal("DIV");
        Promise.resolve().then(() => {
          expect(el.testValue[1].oldChildren.length).to.be.equal(1);
          expect(el.testValue[1].newChildren.length).to.be.equal(3);
          expect(el.testValue[1].newChildren[0].nodeName).to.be.equal("DIV");
          expect(el.testValue[1].newChildren[1].nodeName).to.be.equal("DIV");
          expect(el.testValue[1].newChildren[2].nodeName).to.be.equal("DIV");
          document.querySelector("body").removeChild(el);   //disconnect
          done();
        });
      }, 50);
    });
  });
};
import {SlotchangeMixin} from "../../src/SlotchangeMixin.js";
// import {ShadowSlotchangeMixin} from "../../src/ShadowSlotchangeMixin.js";


runSlotchangeMixinTest(SlotchangeMixin);
// runSlotchangeMixinTest(ShadowSlotchangeMixin);