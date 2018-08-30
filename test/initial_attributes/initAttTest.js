import {InitialAttributesMixin} from "../../src/InitialAttributesMixin.js";

describe('InitialAttributesMixin', function () {

  it("extend InitialAttributesMixin", function () {
    const InitAttElement = class InitAtt extends InitialAttributesMixin(HTMLElement) {
      static get observedAttributes() {
        return ["a"];
      }

      initialAttributesCallback() {
        //nada
      }
    };
    customElements.define("init-att", InitAttElement);
    const el = new InitAttElement();
    el.setAttribute("a", "1");
    expect(el.constructor.name).to.be.equal("InitAtt");
  });

  //works with mocha 4.0.1
  //https://stackoverflow.com/questions/39354331/how-can-i-prevent-mocha-from-trapping-unhandled-exceptions
  it("element that does not implement initialAttributesCallback will fail", function (done) {
    // Stop Mocha from handling uncaughtExceptions.
    // mocha.allowUncaught();
    const savedHandler = window.onerror;
    window.onerror = undefined;
    // Mocha.process.removeListener("uncaughtException");

    // const el = new InitAttElement();
    const globError = function (err) {
      err.preventDefault();
      err.stopPropagation();
      expect(err.message).to.be.equal("Uncaught TypeError: this.initialAttributesCallback is not a function");
      window.removeEventListener("error", globError);
      window.onerror = savedHandler;
      done();
    };
    window.addEventListener("error", globError);

    const InitAttElement = class X extends InitialAttributesMixin(HTMLElement) {
      // initialAttributesCallback(){}
    };
    customElements.define("init-att-fails", InitAttElement);
    const el = new InitAttElement();
    // el.setAttribute("a", "1");
    document.querySelector("body").appendChild(el);
    // const div = document.createElement("div");
    // div.innerHTML = "<init-att-fails one='two'></init-att-fails>"
  });

  it("triggering initialAttributesCallback() via connectedCallback()", function () {
    const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
      constructor() {
        super();
        this.setupValue = 123;

      }

      initialAttributesCallback() {
        this.setupValue += 1;
      }
    };
    customElements.define("init-att-connected", InitAttElement);
    const el = new InitAttElement();
    expect(el.constructor.name).to.be.equal("InitAttElement");
    expect(el.setupValue).to.be.equal(123);
    document.querySelector("body").appendChild(el);
    expect(el.setupValue).to.be.equal(124);
    document.querySelector("body").removeChild(el);
  });

  it("triggering initialAttributesCallback() via attributeChangedCallback()", function () {
    const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
      static get observedAttributes() {
        return ["a"];
      }

      constructor() {
        super();
        this.setupValue = 123;

      }

      initialAttributesCallback() {
        this.setupValue += 1;
      }
    };
    customElements.define("init-att-attribute", InitAttElement);
    const el = new InitAttElement();
    expect(el.constructor.name).to.be.equal("InitAttElement");
    expect(el.setupValue).to.be.equal(123);
    el.setAttribute("a", "1");
    expect(el.setupValue).to.be.equal(124);
  });

  it("triggering initialAttributesCallback() is only done once", function () {
    const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
      static get observedAttributes() {
        return ["a"];
      }

      constructor() {
        super();
        this.setupValue = 0;
        this.attribValue = 0;
        this.connectedValue = 0;
      }

      initialAttributesCallback() {
        this.setupValue += 1;
      }

      attributeChangedCallback(na, o, ne) {
        super.attributeChangedCallback(na, o, ne);
        this.attribValue += 1;
      }
      connectedCallback(){
        super.connectedCallback();
        this.connectedValue += 1;
      }
    };
    customElements.define("init-att-twice", InitAttElement);
    const el = new InitAttElement();
    expect(el.constructor.name).to.be.equal("InitAttElement");
    expect(el.setupValue).to.be.equal(0);
    expect(el.attribValue).to.be.equal(0);
    expect(el.connectedValue).to.be.equal(0);
    el.setAttribute("a", "1");
    expect(el.setupValue).to.be.equal(1);
    expect(el.attribValue).to.be.equal(1);
    expect(el.connectedValue).to.be.equal(0);
    el.setAttribute("a", "2");
    expect(el.setupValue).to.be.equal(1);
    expect(el.attribValue).to.be.equal(2);
    expect(el.connectedValue).to.be.equal(0);
    document.querySelector("body").appendChild(el);
    expect(el.setupValue).to.be.equal(1);
    expect(el.attribValue).to.be.equal(2);
    expect(el.connectedValue).to.be.equal(1);
    document.querySelector("body").removeChild(el);
    setTimeout(()=>expect(el.setupValue).to.be.equal(1), 0); //todo this checks that the raf does not run twice
  });

  it("manually calling initialAttributesCallback() will enable multiple calls", function () {
    const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
      constructor() {
        super();
        this.setupValue = 0;

      }

      initialAttributesCallback() {
        this.setupValue += 1;
      }
    };
    customElements.define("init-att-basic", InitAttElement);
    const el = new InitAttElement();
    expect(el.constructor.name).to.be.equal("InitAttElement");
    expect(el.setupValue).to.be.equal(0);
    el.initialAttributesCallback();
    expect(el.setupValue).to.be.equal(1);
    document.querySelector("body").appendChild(el);
    expect(el.setupValue).to.be.equal(2);
    document.querySelector("body").removeChild(el);
  });

  /*
  it("setting isSetup twice gives error", function () {
    const InitAttElement = InitialAttributesMixin(HTMLElement);
    customElements.define("init-att-isinit-att-error-twice", InitAttElement);
    const el = new InitAttElement();
    expect(el.isSetup).to.be.equal(false);
    el.isSetup = true;
    expect(() => el.isSetup = true).to.throw("InitialAttributesMixin: .isSetup property should only be changed by the InitialAttributesMixin and to true.");
  });

  it("setting isSetup non-true gives error", function () {
    const InitAttElement = InitialAttributesMixin(HTMLElement);
    customElements.define("init-att-isinit-att-error-nontrue", InitAttElement);
    const el = new InitAttElement();
    expect(el.isSetup).to.be.equal(false);
    expect(function () {
      el.isSetup = false
    }).to.throw("InitialAttributesMixin: .isSetup property should only be changed by the InitialAttributesMixin and to true.");
  });

  it("adding to DOM triggers initialAttributesCallback", function () {
    const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
      initialAttributesCallback() {
        this.testConnect = "abc";
      }
    };
    customElements.define("init-att-connect-to-dom", InitAttElement);
    const el = new InitAttElement();
    expect(el.isSetup).to.be.equal(false);
    document.querySelector("body").appendChild(el);
    expect(el.isSetup).to.be.equal(true);
    expect(el.testConnect).to.be.equal("abc");
    document.querySelector("body").removeChild(el);
  });

  it("second connection to DOM does not triggers initialAttributesCallback", function () {
    let first = true;
    const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
      initialAttributesCallback() {
        first ? first = false : assert(false);
      }
    };
    customElements.define("init-att-connect-to-dom-not-twice", InitAttElement);
    const el = new InitAttElement();
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
    expect(el.isConnected).to.be.equal(false);
    expect(el.isSetup).to.be.equal(true);
  });

  it("constructor before initialAttributesCallback before the body of connectedCallback", function (done) {
    let state = "constructor";
    const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
      constructor() {
        super();
        expect(state).to.be.equal("constructor");
        state = "setup";
      }

      initialAttributesCallback() {
        expect(state).to.be.equal("setup");
        state = "connected";
      }

      connectedCallback() {
        super.connectedCallback();
        expect(state).to.be.equal("connected");
        done();
      }
    };
    customElements.define("init-att-order", InitAttElement);
    const el = new InitAttElement();
    document.querySelector("body").appendChild(el);
    document.querySelector("body").removeChild(el);
  });
});


describe('InitialAttributesMixin construction runs initialAttributesCallback and attributeChanged only after first connected', function () {

  const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {

    static get observedAttributes() {
      return ["one"];
    }

    constructor() {
      super();
      this.test = "_Constructor";
    }

    initialAttributesCallback() {
      this.test += "_Setup";
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isSetup) return;    //abort premature attributeChangedCallback
      this.test += "_Attribute_" + name + oldValue + newValue;
    }

    connectedCallback() {
      super.connectedCallback();
      this.test += "_Connected";
    }
  };
  customElements.define("init-att-construct", InitAttElement);

  it("new", function () {
    const el = new InitAttElement();
    el.setAttribute("one", "nonono");
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("document.createElement", function () {
    const el = document.createElement("init-att-construct");
    el.setAttribute("one", "nonono");
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("cloneNode(false) on element", function () {
    const orig = new InitAttElement();
    const el = orig.cloneNode(false);
    el.setAttribute("one", "nonono");
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("cloneNode(true) on parent", function () {
    const orig = new InitAttElement();
    const div = document.createElement("div");
    div.appendChild(orig);
    const el = div.cloneNode(true).children[0];
    el.setAttribute("one", "nonono");
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("innerHTML on an unconnected element", function () {
    const div = document.createElement("div");
    div.innerHTML = "<init-att-construct one='two' one='nonono' a='b'></init-att-construct>";    //the second attribute is considered redundant and skipped
    const el = div.children[0];
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
  });

  it("innerHTML on a connected <template> element DOES NOT trigger constructor 1", function () {
    const div = document.createElement("div");
    document.querySelector("body").appendChild(div);
    div.innerHTML = "<template><init-att-construct one='two' a='b'></init-att-construct></template>";
    const el = div.children[0].content.children[0];
    expect(el.test).to.be.equal(undefined);
    // assert(el.test === "_Constructor"); //todo not sure why constructor is not run when it is a template element. Is it always, or just sometimes?? check the spec.
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
    document.querySelector("body").removeChild(div);
  });

  it("innerHTML on a connected <template> element DOES NOT trigger constructor 2", function () {
    const div = document.createElement("div");
    document.querySelector("body").appendChild(div);
    div.innerHTML = "<template><init-att-construct one='two' a='b'></init-att-construct></template>";
    const el = div.children[0].content.children[0];
    expect(el.test).to.be.equal(undefined);
    // assert(el.test === "_Constructor"); //todo not sure why constructor is not run when it is a template element. Is it always, or just sometimes?? check the spec.
    const div2 = document.createElement("div");
    div2.appendChild(el);
    expect(el.test).to.be.equal(undefined);
    document.querySelector("body").removeChild(div);
  });

  it("innerHTML on a connected element", function () {
    const div = document.createElement("div");
    document.querySelector("body").appendChild(div);
    div.innerHTML = "<init-att-construct one='two' a='b'></init-att-construct>";
    const el = div.children[0];
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(div);
  });

  //todo to test main document parser on load with template and without template in an iframe
});

describe('setupInAdvance()', function () {

  const InitAttElement = class InitAttElement extends InitialAttributesMixin(HTMLElement) {
    static get observedAttributes() {
      return ["one"]
    }

    constructor() {
      super();
      this.test = "_Constructor";
    }

    initialAttributesCallback() {
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
  customElements.define("init-att-in-advance", InitAttElement);

  it("simple", function () {
    const el = new InitAttElement();
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    setupInAdvance(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo");
  });

  it("simple child", function () {
    const el = new InitAttElement();
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    const div = document.createElement("div");
    div.appendChild(el);
    expect(el.test).to.be.equal("_Constructor");
    setupInAdvance(div);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo");
  });

  it("parent 0 attributes, child 2 attributes/1 observedAttribute", function () {
    const el = new InitAttElement();
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    const outer = new InitAttElement();
    outer.appendChild(el);
    expect(outer.test).to.be.equal("_Constructor");
    expect(el.test).to.be.equal("_Constructor");
    setupInAdvance(outer);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo");
    expect(outer.test).to.be.equal("_Constructor_Setup");
  });

  it("el with shadow with a div with a init-att-in-advance child", function () {
    const WithElInShadow = class WithElInShadow extends InitialAttributesMixin(HTMLElement){
      static get observedAttributes(){
        return ["three"];
      }

      constructor(){
        super();
        this.attachShadow({mode: "open"});
        this.test = "_C";
      }
      initialAttributesCallback(){
        this.test += "_S";
        this.shadowRoot.innerHTML = "<div><init-att-in-advance x='y' one='inside'></init-att-in-advance></div>";
      }
      attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isSetup) return;
        this.test += "_A_" + name + oldValue + newValue;
      }

      connectedCallback() {
        super.connectedCallback();
        this.test += "_C2";
      }
    };
    customElements.define("init-att-with-shadow", WithElInShadow);

    const el = new WithElInShadow();
    el.setAttribute("three", "four");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_C");
    expect(el.test.shadowRoot).to.be.equal(undefined);
    setupInAdvance(el);
    expect(el.test).to.be.equal("_C_S_A_threenullfour");
    expect(el.shadowRoot.children[0].children[0].test).to.be.equal("_Constructor_Setup_Attribute_onenullinside");
  });

  it("fail when run twice", function () {
    const el = new InitAttElement();
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    setupInAdvance(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo");
    expect(()=>setupInAdvance(el)).to.throw("InitialAttributesMixin: .isSetup property should only be changed by the InitialAttributesMixin and to true.");
  });

  it("fail when already setup up due to connection", function () {
    const el = new InitAttElement();
    el.setAttribute("one", "two");
    el.setAttribute("a", "b");
    expect(el.test).to.be.equal("_Constructor");
    document.querySelector("body").appendChild(el);
    expect(el.test).to.be.equal("_Constructor_Setup_Attribute_onenulltwo_Connected");
    document.querySelector("body").removeChild(el);
    expect(()=>setupInAdvance(el)).to.throw("InitialAttributesMixin: .isSetup property should only be changed by the InitialAttributesMixin and to true.");
  });
   */
});