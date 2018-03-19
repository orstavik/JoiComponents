import {ChildrenChangedMixin} from "../src/ChildrenChangedMixin.js";

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

  it(".visibleChildren property", function () {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
    };
    customElements.define("visible-children-property", Subclass);
    const el = new Subclass();
    assert(el.getVisibleChildren().length === 0);
    let child = document.createElement("div");
    el.appendChild(child);
    el.appendChild(document.createElement("slot"));
    assert(el.getVisibleChildren().length === 1);
    el.removeChild(child);
    assert(el.getVisibleChildren().length === 0);
  });
  
  it("ChildrenChangedMixin add DIV imperative and trigger childrenChangedCallback", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      childrenChangedCallback(newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(1);
        expect(newChildren[0].nodeName).to.be.equal("DIV");
        done();
      }
    };
    customElements.define("children-changed-div-added", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("div"));
    document.querySelector("body").appendChild(el);
    document.querySelector("body").removeChild(el);
  });

  it("ChildrenChangedMixin add SLOT imperative and trigger childrenChangedCallback", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      childrenChangedCallback(newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(0);
        done();
      }
    };
    customElements.define("children-changed-slot-added", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("slot"));
    document.querySelector("body").appendChild(el);
    document.querySelector("body").removeChild(el);
  });

  it("ChildrenChangedMixin added DIV and then SLOT imperative and trigger childrenChangedCallback", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      childrenChangedCallback(newChildren, oldChildren) {
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
    document.querySelector("body").removeChild(el);
  });

  it("ChildrenChangedMixin added DIV and then SLOT imperative and trigger childrenChangedCallback, mutation observer called between each invocation.", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      childrenChangedCallback(newChildren, oldChildren) {
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
    document.querySelector("body").removeChild(el);
  });

  it("The super inner-outer-slot test 1", function (done) {

    const InnerElementThatObserveChildren = class extends ChildrenChangedMixin(HTMLElement) {

      childrenChangedCallback(newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(1);
        expect(newChildren[0].nodeName).to.be.equal("DIV");
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
    document.querySelector("body").removeChild(el);
  });

  it("not listening for slotChange on slots that are not a direct child", function (done) {

    const InnerElementThatObserveChildren = class extends ChildrenChangedMixin(HTMLElement) {

      childrenChangedCallback(newChildren, oldChildren) {
        expect(oldChildren).to.be.equal(undefined);
        expect(newChildren.length).to.be.equal(1);
        expect(newChildren[0].nodeName).to.be.equal("DIV");
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
    document.querySelector("body").removeChild(el);
  });

  it("connected-disconnected-connected. childrenChangedCallback only triggered when connected + MutationObserver only called once when micro task queued.", function (done) {
    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      childrenChangedCallback(newChildren, oldChildren) {
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
    document.querySelector("body").removeChild(el);
  });

  it("connected-wait-disconnected-connected. childrenChangedCallback only triggered when connected.", function (done) {
    let counter = 0;

    const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
      childrenChangedCallback(newChildren, oldChildren) {
        if (counter === 0) {
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(1);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
        }
        if (counter === 1) {
          expect(oldChildren.length).to.be.equal(1);
          expect(newChildren.length).to.be.equal(3);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
          expect(newChildren[1].nodeName).to.be.equal("DIV");
          expect(newChildren[2].nodeName).to.be.equal("DIV");
          done();
        }
        counter++;
      }
    };
    customElements.define("connected-settimeout-disconnected-connected", Subclass);
    const el = new Subclass();
    el.appendChild(document.createElement("div"));    //is not triggered.
    document.querySelector("body").appendChild(el);   //childrenChangedCallback triggered on connect
    document.querySelector("body").removeChild(el);   //disconnect
    setTimeout(() => {
      el.appendChild(document.createElement("div"));    //is not triggered.
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //childrenChangedCallback triggered on connect
      document.querySelector("body").removeChild(el);
    }, 0);
  });

  //todo verify that eventListeners are removed when disconnected.
  //todo verify that slots can be added dynamically
  //todo verify that slots can be replaced dynamically
  //todo make some tests showing that it does not do wrong
});