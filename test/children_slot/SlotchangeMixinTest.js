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

  it("extend HTMLElement class and make an element", function () {
    const ChildrenChangedElement = SlotchangeMixin(HTMLElement);
    customElements.define("must-use-custom-elements-define-to-enable-constructor", ChildrenChangedElement);
    const el = new ChildrenChangedElement();
    expect(el.constructor.name).to.be.equal("SlotchangeMixin");
  });

  it("subclass SlotchangeMixin", function () {
    const SubclassChildrenChangedElement = class SubclassChildrenChanged extends SlotchangeMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-children-changed", SubclassChildrenChangedElement);
    const el = new SubclassChildrenChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassChildrenChanged");
    expect(el.test()).to.be.equal("abc");
  });

  it("subclass SlotchangeMixin anonymous", function () {
    const SubclassChildrenChangedElement = class extends SlotchangeMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-children-changed-element", SubclassChildrenChangedElement);
    const el = new SubclassChildrenChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassChildrenChangedElement");
    expect(el.test()).to.be.equal("abc");
  });

  it("SlotchangeMixin add DIV imperative and trigger childrenChangedCallback", function (done) {
    const Subclass = class Subclass extends SlotchangeMixin(HTMLElement) {
      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(slotName).to.be.equal("");
        expect(newChildren.length).to.be.equal(1);
        expect(newChildren[0].nodeName).to.be.equal("DIV");
        expect(oldChildren).to.be.equal(undefined);
        done();
      }
    };
    customElements.define("children-changed-div-added", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("div"));
    document.querySelector("body").appendChild(el);
    Promise.resolve().then(() => document.querySelector("body").removeChild(el));
  });

  // WRONG TEST.. 
  // it("SlotchangeMixin add SLOT imperative and trigger childrenChangedCallback", function (done) {
  //   const Subclass = class Subclass extends SlotchangeMixin(HTMLElement) {
  //     childrenChangedCallback(oldChildren, newChildren) {
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

  it("SlotchangeMixin added DIV and then SLOT imperative and trigger childrenChangedCallback", function (done) {
    const Subclass = class Subclass extends SlotchangeMixin(HTMLElement) {
      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(slotName).to.be.equal("");
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(1);
        expect(newChildren[0].nodeName).to.be.equal("DIV");
        done();
      }
    };
    customElements.define("children-changed-div-and-slot-added", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("div"));
    el.appendChild(document.createElement("slot"));
    document.querySelector("body").appendChild(el);
    Promise.resolve().then(() => document.querySelector("body").removeChild(el));
  });

  it("SlotchangeMixin added DIV and then SLOT imperative and trigger childrenChangedCallback, mutation observer called between each invocation.", function (done) {
    const Subclass = class Subclass extends SlotchangeMixin(HTMLElement) {
      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(slotName).to.be.equal("");
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(1);
        expect(newChildren[0].nodeName).to.be.equal("DIV");
        done();
      }
    };
    customElements.define("children-changed-div-added-wait-and-then-slot-added", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("div"));
    el.appendChild(document.createElement("slot"));
    document.querySelector("body").appendChild(el);
    Promise.resolve().then(() => document.querySelector("body").removeChild(el));
  });

  it("The super inner-outer-slot test 2", function (done) {

    const InnerElementThatObserveChildren = class extends SlotchangeMixin(HTMLElement) {

      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(3);
        expect(newChildren[1].nodeName).to.be.equal("DIV");
        done();
      }
    };
    customElements.define("inner-component", InnerElementThatObserveChildren);

    const OuterElementThatSlotsStuff = class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <inner-component>
            <slot></slot>
          </inner-component>`;
      }
    };
    customElements.define("outer-component", OuterElementThatSlotsStuff);

    const el = new OuterElementThatSlotsStuff();
    //things are not slotted until something is added to the DOM
    document.querySelector("body").appendChild(el);
    el.appendChild(document.createElement("div"));
    Promise.resolve().then(() => document.querySelector("body").removeChild(el));
  });

  it("not listening for slotChange on slots that are not a direct child", function (done) {

    const InnerElementThatObserveChildren = class extends SlotchangeMixin(HTMLElement) {

      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(3);
        expect(newChildren[1].nodeName).to.be.equal("DIV");
        done();
      }
    };
    customElements.define("inner-listener", InnerElementThatObserveChildren);

    const OuterElementThatSlotsStuff = class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <inner-listener>
            <div>
              <slot></slot>
            </div>
          </inner-listener>`;
      }
    };
    customElements.define("outer-with-grandchild-slot", OuterElementThatSlotsStuff);

    const el = new OuterElementThatSlotsStuff();
    document.querySelector("body").appendChild(el);
    el.appendChild(document.createElement("p"));
    Promise.resolve().then(() => document.querySelector("body").removeChild(el));
  });

  it("slotName === ''", function (done) {

    let counter = 0;

    const InnerElementIsSlot = class extends SlotchangeMixin(HTMLElement) {

      slotchangedCallback(slotName, newChildren, oldChildren) {
        if (counter === 0) {
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(2);
          expect(slotName).to.be.equal("");
          counter++;
          return;
        }
        if (counter === 1) {
          expect(oldChildren.length).to.be.equal(2);
          expect(newChildren.length).to.be.equal(3);
          expect(newChildren[1].nodeName).to.be.equal("P");
          expect(slotName).to.be.equal("");
          done();
        }
      }
    };
    customElements.define("inner-is-slot", InnerElementIsSlot);

    const OuterElementIsSlot = class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <inner-is-slot>
            <slot></slot>
          </inner-is-slot>`;
      }
    };
    customElements.define("outer-is-slot", OuterElementIsSlot);

    const el = new OuterElementIsSlot();
    document.querySelector("body").appendChild(el);
    Promise.resolve().then(() => {
      el.appendChild(document.createElement("p"));
      Promise.resolve().then(() => {
        document.querySelector("body").removeChild(el);
      });
    });
  });

  it("connected-disconnected-connected. childrenChangedCallback only triggered when connected + MutationObserver only called once when micro task queued.", function (done) {
    const Subclass = class Subclass extends SlotchangeMixin(HTMLElement) {

      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(3);
        expect(newChildren[0].nodeName).to.be.equal("DIV");
        expect(newChildren[1].nodeName).to.be.equal("DIV");
        expect(newChildren[2].nodeName).to.be.equal("DIV");
        done();
      }
    };
    customElements.define("connected-disconnected-connected", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("div"));    //is not triggered.
    document.querySelector("body").appendChild(el);   //childrenChangedCallback triggered on connect
    document.querySelector("body").removeChild(el);   //disconnect
    el.appendChild(document.createElement("div"));    //is not triggered.
    el.appendChild(document.createElement("div"));    //is not triggered.
    document.querySelector("body").appendChild(el);   //childrenChangedCallback triggered on connect
    Promise.resolve().then(() => document.querySelector("body").removeChild(el));
  });

  it("connected-wait-disconnected-connected. childrenChangedCallback only triggered when connected.", function (done) {
    let counter = 0;

    const Subclass = class Subclass extends SlotchangeMixin(HTMLElement) {

      slotchangedCallback(slotName, newChildren, oldChildren) {
        if (counter === 0) {
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(1);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
          counter++;
          return;
        }
        if (counter === 1) {
          expect(oldChildren.length).to.be.equal(1);
          expect(newChildren.length).to.be.equal(3);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
          expect(newChildren[1].nodeName).to.be.equal("DIV");
          expect(newChildren[2].nodeName).to.be.equal("DIV");
          done();
        }
      }
    };
    customElements.define("connected-settimeout-disconnected-connected", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("div"));    //is not triggered.
    document.querySelector("body").appendChild(el);   //childrenChangedCallback triggered on connect
    Promise.resolve().then(() => document.querySelector("body").removeChild(el));   //disconnect
    setTimeout(() => {
      el.appendChild(document.createElement("div"));    //is not triggered.
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //childrenChangedCallback triggered on connect
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));   //disconnect
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