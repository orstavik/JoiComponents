import {SetupMixin} from "../../src/SetupMixin.js";

describe('SetupMixin', function () {

  it("extend SetupMixin", function () {
    const SetupElement = SetupMixin(HTMLElement);
    customElements.define("setup-extend", SetupElement);
    const el = new SetupElement();
    expect(el.constructor.name).to.be.equal("SetupMixin");
  });
  //works with mocha 4.0.1
  //https://stackoverflow.com/questions/39354331/how-can-i-prevent-mocha-from-trapping-unhandled-exceptions

  it("element that does not implement setupCallback will fail", function (done) {
    // Stop Mocha from handling uncaughtExceptions.
    // mocha.allowUncaught();
    const savedHandler = window.onerror;
    window.onerror = undefined;
    // Mocha.process.removeListener("uncaughtException");

    const SetupElement = SetupMixin(HTMLElement);
    customElements.define("setup-connect-to-dom-without-callback-fails", SetupElement);
    const el = new SetupElement();
    const globError = function (err) {
      err.preventDefault();
      err.stopPropagation();
      expect(err.message).to.be.equal("Uncaught TypeError: this.setupCallback is not a function");
      window.removeEventListener("error", globError);
      window.onerror = savedHandler;
      done();
    };
    window.addEventListener("error", globError);
    document.querySelector("body").appendChild(el);
  });

  it("call setupCallback() and set isSetup correctly", function () {
    const SetupElement = class SetupElement extends SetupMixin(HTMLElement) {
      setupCallback() {
        this.setupValue = 123;
      }
    };
    customElements.define("setup-basic", SetupElement);
    const el = new SetupElement();
    expect(el.constructor.name).to.be.equal("SetupElement");
    expect(el.isSetup).to.be.equal(false);
    el.setupCallback();
    el.isSetup = true;
    expect(el.isSetup).to.be.equal(true);
    expect(el.setupValue).to.be.equal(123);
  });

  it("setting isSetup twice gives error", function () {
    const SetupElement = SetupMixin(HTMLElement);
    customElements.define("setup-issetup-error-twice", SetupElement);
    const el = new SetupElement();
    expect(el.isSetup).to.be.equal(false);
    el.isSetup = true;
    expect(function () {
      el.isSetup = true
    }).to.throw("SetupMixin: .isSetup property should only be changed by the SetupMixin and to true.");
  });

  it("setting isSetup non-true gives error", function () {
    const SetupElement = SetupMixin(HTMLElement);
    customElements.define("setup-issetup-error-nontrue", SetupElement);
    const el = new SetupElement();
    expect(el.isSetup).to.be.equal(false);
    expect(function () {
      el.isSetup = false
    }).to.throw("SetupMixin: .isSetup property should only be changed by the SetupMixin and to true.");
  });

  it("adding to DOM triggers setupCallback", function () {
    const SetupElement = class SetupElement extends SetupMixin(HTMLElement) {
      setupCallback() {
        this.testConnect = "abc";
      }
    };
    customElements.define("setup-connect-to-dom", SetupElement);
    const el = new SetupElement();
    expect(el.isSetup).to.be.equal(false);
    document.querySelector("body").appendChild(el);
    expect(el.isSetup).to.be.equal(true);
    expect(el.testConnect).to.be.equal("abc");
    document.querySelector("body").removeChild(el);
  });

  it("second connection to DOM does not triggers setupCallback", function () {
    let first = true;
    const SetupElement = class SetupElement extends SetupMixin(HTMLElement) {
      setupCallback() {
        first ? first = false : assert(false);
      }
    };
    customElements.define("setup-connect-to-dom-not-twice", SetupElement);
    const el = new SetupElement();
    expect(el.isSetup).to.be.equal(false);
    expect(el.isConnected).to.be.equal(false);
    document.querySelector("body").appendChild(el);
    expect(el.isConnected).to.be.equal(true);
    expect(el.isSetup).to.be.equal(true);
    document.querySelector("body").removeChild(el);
    expect(el.isConnected).to.be.equal(false);
    expect(el.isSetup).to.be.equal(true);
    document.querySelector("body").appendChild(el);
    expect(el.isConnected).to.be.equal(true);
    expect(el.isSetup).to.be.equal(true);
    document.querySelector("body").removeChild(el);
    expect(el.isSetup).to.be.equal(true);
    expect(el.isConnected).to.be.equal(false);
  });

  it("constructor before setupCallback before connectedCallback", function (done) {
    let state = "constructor";
    const SetupElement = class SetupElement extends SetupMixin(HTMLElement) {
      constructor() {
        super();
        expect(state).to.be.equal("constructor");
        state = "setup";
      }

      setupCallback() {
        expect(state).to.be.equal("setup");
        state = "connected";
      }

      connectedCallback() {
        super.connectedCallback();
        expect(state).to.be.equal("connected");
        done();
      }
    };
    customElements.define("setup-order", SetupElement);
    const el = new SetupElement();
    document.querySelector("body").appendChild(el);
    document.querySelector("body").removeChild(el);
  });
});


describe('SetupMixin.construction runs setupCallback and attributeChanged only after first connected', function () {

  const SetupElement = class SetupElement extends SetupMixin(HTMLElement) {
    static get observedAttributes() {
      return ["one"]
    }

    constructor() {
      super();
      this.test = "_Constructor";
    }

    setupCallback() {
      this.test += "_Setup";
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isSetup) return;
      this.test += "_Attribute_" + name + oldValue + newValue;
    }

    connectedCallback() {
      super.connectedCallback();
      this.test += "_Connected";
    }
  };
  customElements.define("setup-construct", SetupElement);

  it("new", function () {
    const el = new SetupElement();
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("document.createElement", function () {
    const el = document.createElement("setup-construct");
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("cloneNode(false) on element", function () {
    const orig = new SetupElement();
    const el = orig.cloneNode(false);
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("cloneNode(true) on parent", function () {
    const orig = new SetupElement();
    const div = document.createElement("div");
    div.appendChild(orig);
    const el = div.cloneNode(true).children[0];
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("innerHTML on an unconnected element", function () {
    const div = document.createElement("div");
    div.innerHTML = "<setup-construct one='two' a='b'></setup-construct>";
    const el = div.children[0];
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("innerHTML on a connected <template> element ", function () {
    const div = document.createElement("div");
    document.querySelector("body").appendChild(div);
    div.innerHTML = "<template><setup-construct one='two' a='b'></setup-construct></template>";
    const el = div.children[0].content.children[0];
    assert(el.test === undefined);
    // assert(el.test === "_Constructor"); //todo not sure why constructor is not run when it is a template element. Is it always, or just sometimes?? check the spec.
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
    document.querySelector("body").removeChild(div);
  });

  it("innerHTML on a connected element", function () {
    const div = document.createElement("div");
    document.querySelector("body").appendChild(div);
    div.innerHTML = "<setup-construct one='two' a='b'></setup-construct>";
    const el = div.children[0];
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(div);
  });

  //todo to test main document parser on load with template and without template in an iframe

  /*


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

      it("SlotchangeMixin add DIV imperative and trigger slotchangedCallback", function (done) {
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

      it("SlotchangeMixin added DIV and then SLOT imperative and trigger slotchangedCallback", function (done) {
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

      it("SlotchangeMixin added DIV and then SLOT imperative and trigger slotchangedCallback, mutation observer called between each invocation.", function (done) {
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

      it("connected-disconnected-connected. slotchangedCallback only triggered when connected + MutationObserver only called once when micro task queued.", function (done) {
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
        document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
        document.querySelector("body").removeChild(el);   //disconnect
        el.appendChild(document.createElement("div"));    //is not triggered.
        el.appendChild(document.createElement("div"));    //is not triggered.
        document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
        Promise.resolve().then(() => document.querySelector("body").removeChild(el));
      });

      it("connected-wait-disconnected-connected. slotchangedCallback only triggered when connected.", function (done) {
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
        document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
        Promise.resolve().then(() => document.querySelector("body").removeChild(el));   //disconnect
        setTimeout(() => {
          el.appendChild(document.createElement("div"));    //is not triggered.
          el.appendChild(document.createElement("div"));    //is not triggered.
          document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
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
        * /
      const el = new BlueFrame();
        el.appendChild(document.createElement("img"));    //is not triggered.
        let span = document.createElement("span");
        span.setAttribute("slot", "label");
        span.innerText = "Picture of the ocean";
        el.appendChild(span);                             //is not triggered.
        document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      });
    */
  //todo verify that eventListeners are removed when disconnected.
  //todo make some tests showing that it does not go outside of its realm.. don't know how
});