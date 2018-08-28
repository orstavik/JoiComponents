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
});