

const runSlotchangeMixinTest = function (SlotchangeMixinType) {
  describe(SlotchangeMixinType.name, function () {

    const name = SlotchangeMixinType.name.toLowerCase();

    class Inner extends SlotchangeMixinType(HTMLElement) {
      constructor(){
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML= `
<style>
  * { 
    color: blue;
    font-weight: bold;
    border-bottom: 5px solid lightblue; 
  }
</style>
-><slot><span>inner fallback title</span></slot>
`;
      }
      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true}),
          slot
        });
      }

      stop() {
        this._stop = true;
      }
    }

    class MiddleMom extends SlotchangeMixinType(HTMLElement) {
      constructor(){
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML= `
<style>
  * { 
    color: red;
    font-style: italic;
    border-right: 5px solid pink; 
  }
</style>
<${innerTag}><slot></slot></${innerTag}>
`;
      }
      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true}),
          slot
        });
      }

      stop() {
        this._stop = true;
      }
    }
    class MiddlePap extends SlotchangeMixinType(HTMLElement) {
      constructor(){
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML= `
<style>
  * { 
    color: red;
    font-style: italic;
    border-right: 5px solid pink; 
  }
</style>
<${innerTag}><slot><span>middle fallback title</span></slot></${innerTag}>
`;
      }
      slotCallback(slot) {
        if (this._stop)
          throw new Error("Bug in test: Lingering slotCallback");
        this.testValue = this.testValue || [];
        this.testValue.push({
          slotName: slot.name,
          value: slot.assignedNodes({flatten: true}),
          slot
        });
      }

      stop() {
        this._stop = true;
      }
    }

    const innerTag = name + "-inner-el";
    const momTag = name + "-middle-mom";
    const papTag = name + "-middle-pap";
    customElements.define(innerTag, Inner);
    customElements.define(momTag, MiddleMom);
    customElements.define(papTag, MiddlePap);

    it("1: inner empty <inner-el></inner-el>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${innerTag}></${innerTag}>`;
      const el = div.children[0];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(0);
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("inner fallback title");
        el.stop();
        done();
      });
    });

    it("2: inner with span <inner-el><span>top span</span></inner-el>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${innerTag}><span>top span</span></${innerTag}>`;
      const el = div.children[0];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("SPAN");
        expect(el.testValue[0].value[0].innerText).to.be.equal("top span");
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("top span");
        el.stop();
        done();
      });
    });

    it("3: inner with slot-span <inner-el><slot><span>top slot span</span></slot></inner-el>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${innerTag}><slot><span>top slot span</span></slot></${innerTag}>`;
      const el = div.children[0];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("SLOT");
        // expect(el.testValue[0].value[0].innerText).to.be.equal("top span");
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("top slot span");
        el.stop();
        done();
      });
    });

    it("4: gentlemom empty: <middle-mom></middle-mom>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${momTag}></${momTag}>`;
      const el = div.children[0];
      const child = el.shadowRoot.children[1];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(0);
        expect(child.testValue.length).to.be.equal(1);
        expect(child.testValue[0].slotName).to.be.equal("");
        expect(child.testValue[0].value.length).to.be.equal(0);
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(0);

        const childVarTest = child.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(childVarTest.length).to.be.equal(1);
        expect(childVarTest[0].nodeName).to.be.equal("SPAN");
        expect(childVarTest[0].innerText).to.be.equal("inner fallback title");

        el.stop();
        done();
      });
    });

    it("5: gentlemom top span: <middle-mom><span>top span</span></middle-mom>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${momTag}><span>top span</span></${momTag}>`;
      const el = div.children[0];
      const child = el.shadowRoot.children[1];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("SPAN");
        expect(el.testValue[0].value[0].innerText).to.be.equal("top span");
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("top span");

        expect(child.testValue.length).to.be.equal(1);
        expect(child.testValue[0].slotName).to.be.equal("");
        expect(child.testValue[0].value.length).to.be.equal(1);
        expect(child.testValue[0].value[0].nodeName).to.be.equal("SPAN");
        expect(child.testValue[0].value[0].innerText).to.be.equal("top span");
        const childVarTest = child.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(childVarTest.length).to.be.equal(1);
        expect(childVarTest[0].nodeName).to.be.equal("SPAN");
        expect(childVarTest[0].innerText).to.be.equal("top span");
        el.stop();
        done();
      });
    });

    it("6: gentlemom top slot span: <middle-mom><slot><span>top slot span</span></slot></middle-mom>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${momTag}><slot><span>top span</span></slot></${momTag}>`;
      const el = div.children[0];
      const child = el.shadowRoot.children[1];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("SLOT");
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("top span");

        expect(child.testValue.length).to.be.equal(1);
        expect(child.testValue[0].slotName).to.be.equal("");
        expect(child.testValue[0].value.length).to.be.equal(1);
        expect(child.testValue[0].value[0].nodeName).to.be.equal("SLOT");
        const childVarTest = child.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(childVarTest.length).to.be.equal(1);
        expect(childVarTest[0].nodeName).to.be.equal("SPAN");
        expect(childVarTest[0].innerText).to.be.equal("top span");
        el.stop();
        done();
      });
    });


    it("7: gentlepap empty: <middle-pap></middle-pap>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${papTag}></${papTag}>`;
      const el = div.children[0];
      const child = el.shadowRoot.children[1];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(0);
        expect(child.testValue.length).to.be.equal(1);
        expect(child.testValue[0].slotName).to.be.equal("");
        expect(child.testValue[0].value.length).to.be.equal(1);
        expect(child.testValue[0].value[0].nodeName).to.be.equal("SPAN");
        expect(child.testValue[0].value[0].innerText).to.be.equal("middle fallback title");

        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("middle fallback title");

        const childVarTest = child.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(childVarTest.length).to.be.equal(1);
        expect(childVarTest[0].nodeName).to.be.equal("SPAN");
        expect(childVarTest[0].innerText).to.be.equal("middle fallback title");

        el.stop();
        done();
      });
    });

    it("8: gentlepap top span: <middle-pap><span>top span</span></middle-pap>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${papTag}><span>top span</span></${papTag}>`;
      const el = div.children[0];
      const child = el.shadowRoot.children[1];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("SPAN");
        expect(el.testValue[0].value[0].innerText).to.be.equal("top span");
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("top span");

        expect(child.testValue.length).to.be.equal(1);
        expect(child.testValue[0].slotName).to.be.equal("");
        expect(child.testValue[0].value.length).to.be.equal(1);
        expect(child.testValue[0].value[0].nodeName).to.be.equal("SPAN");
        expect(child.testValue[0].value[0].innerText).to.be.equal("top span");
        const childVarTest = child.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(childVarTest.length).to.be.equal(1);
        expect(childVarTest[0].nodeName).to.be.equal("SPAN");
        expect(childVarTest[0].innerText).to.be.equal("top span");
        el.stop();
        done();
      });
    });

    it("9: gentlepap top slot span: <middle-pap><slot><span>top slot span</span></slot></middle-pap>", function (done) {
      const div = document.createElement("div");
      div.innerHTML = `<${papTag}><slot><span>top span</span></slot></${papTag}>`;
      const el = div.children[0];
      const child = el.shadowRoot.children[1];
      requestAnimationFrame(() => {
        expect(el.testValue.length).to.be.equal(1);
        expect(el.testValue[0].slotName).to.be.equal("");
        expect(el.testValue[0].value.length).to.be.equal(1);
        expect(el.testValue[0].value[0].nodeName).to.be.equal("SLOT");
        const varTest = el.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(varTest.length).to.be.equal(1);
        expect(varTest[0].nodeName).to.be.equal("SPAN");
        expect(varTest[0].innerText).to.be.equal("top span");

        expect(child.testValue.length).to.be.equal(1);
        expect(child.testValue[0].slotName).to.be.equal("");
        expect(child.testValue[0].value.length).to.be.equal(1);
        expect(child.testValue[0].value[0].nodeName).to.be.equal("SLOT");
        const childVarTest = child.testValue[0].slot.varAssignedNodes({flatten: true});
        expect(childVarTest.length).to.be.equal(1);
        expect(childVarTest[0].nodeName).to.be.equal("SPAN");
        expect(childVarTest[0].innerText).to.be.equal("top span");
        el.stop();
        done();
      });
    });

  });
};
// import {SlotchangeMixin} from "../../src/SlotchangeMixin.js";
// import {SlottableMixin} from "../../src/SlottableMixin.js";
import {VarMixin} from "../../src/slot/VarMixin.js";

// runSlotchangeMixinTest(SlotchangeMixin);
// runSlotchangeMixinTest(SlottableMixin);
runSlotchangeMixinTest(VarMixin);