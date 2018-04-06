import {SizeChangedMixin} from "../src/SizeChangedMixin.js";

describe('SizeChangedMixin', function () {

  it("extend HTMLElement class and make an element", function () {
    const SizeChangedElement = SizeChangedMixin(HTMLElement);
    customElements.define("must-use-custom-elements-define-to-enable-constructor-size", SizeChangedElement);
    const el = new SizeChangedElement();
    expect(el.constructor.name).to.be.equal("SizeChangedMixin");
  });

  it("subclass SizeChangedMixin", function () {
    const SubclassSizeChangedElement = class SubclassSizeChanged extends SizeChangedMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-size-changed", SubclassSizeChangedElement);
    const el = new SubclassSizeChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassSizeChanged");
    expect(el.test()).to.be.equal("abc");
  });

  it("subclass SizeChangedMixin anonymous", function () {
    const SubclassSizeChangedElement = class extends SizeChangedMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-size-changed-element", SubclassSizeChangedElement);
    const el = new SubclassSizeChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassSizeChangedElement");
    expect(el.test()).to.be.equal("abc");
  });

  it("inline-block + .getContentRect() returns {width: 0, height: 0, top: 0, left: 0}", function () {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
    };
    customElements.define("get-content-size", Subclass);
    const el = new Subclass();
    el.innerText = "getBoundingClientRect() is empty if the element is out of the DOM.";
    expect(el.style.display).to.be.equal("inline-block");
    expect(el.getContentRect()).to.deep.equal({width: 0, height: 0, top: 0, left: 0});
  });

  it("getBoundingClientRect() on not connected elements", function () {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
    };
    customElements.define("get-bounding-size", Subclass);
    const el = new Subclass();
    el.innerText = "getBoundingClientRect() is empty if the element is out of the DOM.";
    expect(el.getBoundingClientRect().left).to.be.equal(0);
    expect(el.getBoundingClientRect().right).to.be.equal(0);
    expect(el.getBoundingClientRect().top).to.be.equal(0);
    expect(el.getBoundingClientRect().bottom).to.be.equal(0);
  });

  it("connect an element to document", function () {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
      sizeChangedCallback(rect) {
        expect(rect.top).to.be.equal(0);
        expect(rect.left).to.be.equal(0);
        assert(rect.width > 0);
        assert(rect.height > 0);
      }
    };
    customElements.define("connect-size-changed", Subclass);
    const el = new Subclass();
    el.innerText = "here we go.";
    document.querySelector("body").appendChild(el);
    document.querySelector("body").removeChild(el);
  });

  // it("change style width of a connected element", function (done) {
  // it("change style padding of a connected element", function (done) {
  // it("change position of a connected element that should not trigger", function (done) {
  // it("change padding and width so it does not change the size and does not trigger", function (done) {
  it("change content of a connected element", function (done) {
    let counter = 0;
    let firstWidth;
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
      sizeChangedCallback(rect) {
        if (counter === 0) {
          expect(rect.top).to.be.equal(0);
          expect(rect.left).to.be.equal(0);
          assert(rect.width > 0);
          assert(rect.height > 0);
          firstWidth = rect.width;
          counter++;
        } else if (counter === 1) {
          expect(rect.top).to.be.equal(0);
          expect(rect.left).to.be.equal(0);
          assert(rect.width > firstWidth);
          assert(rect.height > 0);
          done();
        }
      }
    };
    customElements.define("change-size-changed-content", Subclass);
    const el = new Subclass();
    el.innerText = "here we go.";
    document.querySelector("body").appendChild(el);
    Promise.resolve().then(() => {
      el.innerText = el.innerText + " again..";
      setTimeout(() => {
        document.querySelector("body").removeChild(el);
      }, 20);
    });
  });

  /*
    it("ChildrenChangedMixin add DIV imperative and trigger childrenChangedCallback", function (done) {
      const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
        childrenChangedCallback(oldChildren, newChildren) {
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
        childrenChangedCallback(oldChildren, newChildren) {
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
        childrenChangedCallback(oldChildren, newChildren) {
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
        childrenChangedCallback(oldChildren, newChildren) {
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

    it("The super inner-outer-slot test 1", function () {

      const InnerElementThatObserveChildren = class extends ChildrenChangedMixin(HTMLElement) {
      };
      customElements.define("inner-component-1", InnerElementThatObserveChildren);

      const OuterElementThatSlotsStuff = class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML = `
            <inner-component-1>
              <slot></slot>
            </inner-component-1>`;
        }
      };
      customElements.define("outer-component-1", OuterElementThatSlotsStuff);

      const outer = new OuterElementThatSlotsStuff();
      const inner = outer.shadowRoot.children[0];
      const innerSlot = inner.children[0];

      assert(inner.getVisibleChildren().length === 0);
      let slotted = document.createElement("div");
      outer.appendChild(slotted);
      assert(inner.getVisibleChildren().length === 1);
      inner.removeChild(innerSlot);
      assert(inner.getVisibleChildren().length === 0);
      inner.appendChild(innerSlot);
      assert(inner.getVisibleChildren().length === 1);
    });

    it("The super inner-outer-slot test 2", function (done) {

      const InnerElementThatObserveChildren = class extends ChildrenChangedMixin(HTMLElement) {

        childrenChangedCallback(oldChildren, newChildren) {
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

        childrenChangedCallback(oldChildren, newChildren) {
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

    it("isSlotChange", function (done) {

      let counter = 0;

      const InnerElementIsSlot = class extends ChildrenChangedMixin(HTMLElement) {

        childrenChangedCallback(oldChildren, newChildren, isSlotchange) {
          if (counter === 0) {
            expect(oldChildren).to.be.equal(undefined);
            expect(newChildren.length).to.be.equal(0);
            assert(!isSlotchange);
            counter++;
            return;
          }
          if (counter === 1) {
            expect(oldChildren.length).to.be.equal(0);
            expect(newChildren.length).to.be.equal(1);
            expect(newChildren[0].nodeName).to.be.equal("P");
            assert(isSlotchange);
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
        document.querySelector("body").removeChild(el);
      });
    });

    it("connected-disconnected-connected. childrenChangedCallback only triggered when connected + MutationObserver only called once when micro task queued.", function (done) {
      const Subclass = class Subclass extends ChildrenChangedMixin(HTMLElement) {
        childrenChangedCallback(oldChildren, newChildren) {
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
        childrenChangedCallback(oldChildren, newChildren) {
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
      Promise.resolve().then(() => {
        el.appendChild(document.createElement("div"));    //is not triggered.
        el.appendChild(document.createElement("div"));    //is not triggered.
        document.querySelector("body").appendChild(el);   //childrenChangedCallback triggered on connect
        document.querySelector("body").removeChild(el);
      });
    });
     */
  //todo verify that eventListeners are removed when disconnected.
  //todo make some tests showing that it does not go outside of its realm.. don't know how
});