import {ChildrenChangedMixin, flattenedChildren} from "../../src/ChildrenChangedMixin.js";

describe('ChildrenChangedMixin', function () {

  it("extend HTMLElement class and make an element", function () {
    const ChildrenChangedElement = ChildrenChangedMixin(HTMLElement);
    customElements.define("must-use-custom-elements-define-to-enable-constructor", ChildrenChangedElement);
    const el = new ChildrenChangedElement();
    expect(el.constructor.name).to.be.equal("ChildrenChangedMixin");
  });

  it("subclass ChildrenChangedMixin", function () {
    const SubclassChildrenChangedElement = class SubclassChildrenChanged extends ChildrenChangedMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-children-changed", SubclassChildrenChangedElement);
    const el = new SubclassChildrenChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassChildrenChanged");
    expect(el.test()).to.be.equal("abc");
  });

  it("subclass ChildrenChangedMixin anonymous", function () {
    const SubclassChildrenChangedElement = class extends ChildrenChangedMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-children-changed-element", SubclassChildrenChangedElement);
    const el = new SubclassChildrenChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassChildrenChangedElement");
    expect(el.test()).to.be.equal("abc");
  });

  it("ChildrenChangedMixin add DIV imperative and trigger childrenChangedCallback", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      // todo .children -> .childNodes: OK
      // childrenChangedCallback(oldChildren, newChildren) {
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
  // it("ChildrenChangedMixin add SLOT imperative and trigger childrenChangedCallback", function (done) {
  //   const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
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

  it("ChildrenChangedMixin added DIV and then SLOT imperative and trigger childrenChangedCallback", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      // todo .children -> .childNodes: OK
      // childrenChangedCallback(oldChildren, newChildren) {
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

  it("ChildrenChangedMixin added DIV and then SLOT imperative and trigger childrenChangedCallback, mutation observer called between each invocation.", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      // todo .children -> .childNodes: OK
      slotchangedCallback(slotName, newChildren, oldChildren) {
      // childrenChangedCallback(oldChildren, newChildren) {
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

    const InnerElementThatObserveChildren = class extends ChildrenChangedMixin(HTMLElement) {

      // todo .children -> .childNodes: FIX WTF??
      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(3);
        expect(newChildren[1].nodeName).to.be.equal("DIV");
        done();
      }
      // childrenChangedCallback(oldChildren, newChildren) {
      //   expect(oldChildren).to.be.equal(undefined);
      //   expect(newChildren.length).to.be.equal(1);
      //   expect(newChildren[0].nodeName).to.be.equal("DIV");
      //   done();
      // }
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

    const InnerElementThatObserveChildren = class extends ChildrenChangedMixin(HTMLElement) {

      // todo .children -> .childNodes: FIX
      slotchangedCallback(slotName, newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(3);
        expect(newChildren[1].nodeName).to.be.equal("DIV");
        done();
      }
      // childrenChangedCallback(oldChildren, newChildren) {
      //   expect(oldChildren).to.be.equal(undefined);
      //   expect(newChildren.length).to.be.equal(1);
      //   expect(newChildren[0].nodeName).to.be.equal("DIV");
      //   done();
      // }
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

  //todo it("slotName === ''", function (done) {
  it("isSlotChange", function (done) {

    let counter = 0;

    const InnerElementIsSlot = class extends ChildrenChangedMixin(HTMLElement) {

      // todo .children -> .childNodes: FIX

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
      /*
      childrenChangedCallback(oldChildren, newChildren, isSlotchange) {
        if (counter === 0) {
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(0);
          assert(!isSlotchange);
          counter++;
          return;
        }
        if (counter === 1) {
          expect(oldChildren).to.deep.equal([]);
          expect(newChildren.length).to.be.equal(1);
          expect(newChildren[0].nodeName).to.be.equal("P");
          assert(isSlotchange);
          done();
        }
      }
      */
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
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {

      // todo .children -> .childNodes: OK
      slotchangedCallback(slotName, newChildren, oldChildren) {
      // childrenChangedCallback(oldChildren, newChildren) {
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

    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {

      // todo .children -> .childNodes: OK
      slotchangedCallback(slotName, newChildren, oldChildren) {
      // childrenChangedCallback(oldChildren, newChildren) {
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

  //todo verify that eventListeners are removed when disconnected.
  //todo make some tests showing that it does not go outside of its realm.. don't know how
});