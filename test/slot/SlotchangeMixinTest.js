import {SlotchangeMixin} from "../../src/SlotchangeMixin.js";

function testElementNodeListTagAndID(nodes, ar) {
  let tagIds = nodes.map(n => {
    if (n.tagName)
      return n.tagName.toLowerCase() + (n.id ? "#" + n.id : "");
    else
      return "text";
  });
  expect(tagIds).to.deep.equal(ar);
}

describe('SlotchangeMixin', function () {

  class Slot1 extends SlotchangeMixin(HTMLElement) {
    slotchangedCallback(slotName, newChildren, oldChildren) {
      this.testValue = {slotName, newChildren, oldChildren};
    }
  }

  class SlotWrapper extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
          <test-one>
            <slot></slot>
          </test-one>`;
    }
  }

  class ChainedSlotsGrandpaError extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
          <test-one>
            <div>
              <slot></slot>
            </div>
          </test-one>`;
    }
  }

  customElements.define("chained-slot-error", ChainedSlotsGrandpaError);
  customElements.define("chained-slot", SlotWrapper);
  customElements.define("test-one", Slot1);

  it("extend HTMLElement class correctly and make an element", function () {
    const el = new Slot1();
    let proto = el.constructor;
    expect(proto.name).to.be.equal("Slot1");
    proto = Object.getPrototypeOf(proto);
    expect(proto.name).to.be.equal("SlotchangeMixin");
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
      expect(el.testValue.slotName).to.be.equal("");
      expect(el.testValue.newChildren.length).to.be.equal(1);
      expect(el.testValue.newChildren[0].nodeName).to.be.equal("DIV");
      expect(el.testValue.oldChildren).to.be.equal(undefined);
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
      expect(el.testValue.slotName).to.be.equal("");
      expect(el.testValue.oldChildren).to.be.equal(undefined);
      expect(el.testValue.newChildren.length).to.be.equal(1);
      expect(el.testValue.newChildren[0].nodeName).to.be.equal("DIV");
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
      expect(inner.testValue.oldChildren).to.be.equal(undefined);
      expect(inner.testValue.newChildren.length).to.be.equal(3);
      expect(inner.testValue.newChildren[1].nodeName).to.be.equal("DIV");
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
      expect(inner.testValue.oldChildren).to.be.equal(undefined);
      expect(inner.testValue.newChildren.length).to.be.equal(3);
      expect(inner.testValue.newChildren[1].nodeName).to.be.equal("DIV");
      document.querySelector("body").removeChild(el);
      done();
    });
  });

  it("two slotchange calls", function (done) {
    const el = new SlotWrapper();
    const inner = el.shadowRoot.children[0];
    // debugger;
    document.querySelector("body").appendChild(el);
    Promise.resolve().then(() => {
      expect(inner.testValue.oldChildren).to.be.equal(undefined);
      expect(inner.testValue.newChildren.length).to.be.equal(2);
      expect(inner.testValue.slotName).to.be.equal("");
      el.appendChild(document.createElement("p"));
      Promise.resolve().then(() => {
        expect(inner.testValue.oldChildren.length).to.be.equal(2);
        expect(inner.testValue.newChildren.length).to.be.equal(3);
        expect(inner.testValue.newChildren[1].nodeName).to.be.equal("P");
        expect(inner.testValue.slotName).to.be.equal("");
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
      expect(el.testValue.oldChildren).to.be.equal(undefined);
      expect(el.testValue.newChildren.length).to.be.equal(3);
      expect(el.testValue.newChildren[0].nodeName).to.be.equal("DIV");
      expect(el.testValue.newChildren[1].nodeName).to.be.equal("DIV");
      expect(el.testValue.newChildren[2].nodeName).to.be.equal("DIV");
      document.querySelector("body").removeChild(el);
      done();
    });
  });

  it("connected-wait-disconnected-connected. slotchangedCallback only triggered when connected.", function (done) {
    const el = new Slot1();
    el.appendChild(document.createElement("div"));    //is not triggered.
    document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
    Promise.resolve().then(() => {
      expect(el.testValue.oldChildren).to.be.equal(undefined);
      expect(el.testValue.newChildren.length).to.be.equal(1);
      expect(el.testValue.newChildren[0].nodeName).to.be.equal("DIV");
      document.querySelector("body").removeChild(el);     //disconnect
    });
    setTimeout(() => {
      el.appendChild(document.createElement("div"));    //is not triggered.
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      expect(el.testValue.oldChildren).to.be.equal(undefined);
      expect(el.testValue.newChildren.length).to.be.equal(1);
      expect(el.testValue.newChildren[0].nodeName).to.be.equal("DIV");
      Promise.resolve().then(() => {
        expect(el.testValue.oldChildren.length).to.be.equal(1);
        expect(el.testValue.newChildren.length).to.be.equal(3);
        expect(el.testValue.newChildren[0].nodeName).to.be.equal("DIV");
        expect(el.testValue.newChildren[1].nodeName).to.be.equal("DIV");
        expect(el.testValue.newChildren[2].nodeName).to.be.equal("DIV");
        document.querySelector("body").removeChild(el);   //disconnect
        done();
      });
    }, 50);
  });

  it("blue-frame.", function (done) {

    var counter = 0;

    class BlueFrame extends SlotchangeMixin(HTMLElement) {

      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML =
          `<style>
          :host {
            display: inline-block;                                  
            border: 10px solid blue;
          }
          #sold {
            display: none;
            background: red;
            border-radius: 50%;
            width: 10px;
            height: 10px;
            position: absolute;
            bottom: 5px;
            right: 5px;
          }
          :host([sold]) #sold {
            display: block;
          }
        </style>
        <passe-partout>
          <slot name="label" slot="label"></slot>  
          <slot></slot>
          <div id="sold"></div>
        </passe-partout>
        `;
      }

      slotchangedCallback(slot, newNodes, oldNodes) {
        counter++;
        if (slot === "") {
          expect(oldNodes).to.be.equal(undefined);
          testElementNodeListTagAndID(newNodes, ["img"]);
        } else if (slot === "label") {
          expect(oldNodes).to.be.equal(undefined);
          testElementNodeListTagAndID(newNodes, ["span"]);
        } else {
          assert(false);
        }
        if (counter === 4)
          done();
      }
    }

    class PassePartout extends SlotchangeMixin(HTMLElement) {

      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML =
          `<style>
          :host {
            display: inline-block;
            position: relative;                                  
            background: white;
            padding: 12px;
          }
          div {
            text-align: center;
          }
        </style>
        <slot></slot>
        <div id="label">
          <slot name="label"></slot>
        </div>
        `;
      }

      slotchangedCallback(slot, newNodes, oldNodes) {
        counter++;
        if (slot === "") {
          expect(oldNodes).to.be.equal(undefined);
          testElementNodeListTagAndID(newNodes, ["text", "text", "img", "text", "div#sold", "text"]);
        } else if (slot === "label") {
          expect(oldNodes).to.be.equal(undefined);
          testElementNodeListTagAndID(newNodes, ["span"]);
        } else {
          assert(false);
        }
        if (counter === 4)
          done();
      }
    }

    customElements.define("passe-partout", PassePartout);
    customElements.define("blue-frame", BlueFrame);

    /*
    <blue-frame sold>
      <img>
      <span slot="label">Picture of the ocean</span>
    </blue-frame>
    */
    const el = new BlueFrame();
    el.appendChild(document.createElement("img"));    //is not triggered.
    let span = document.createElement("span");
    span.setAttribute("slot", "label");
    span.innerText = "Picture of the ocean";
    el.appendChild(span);                             //is not triggered.
    document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
  });

  //todo verify that eventListeners are removed when disconnected.
  //todo make some tests showing that it does not go outside of its realm.. don't know how
});