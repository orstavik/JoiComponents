import {StyleChangedMixin} from "../../src/StyleChangedMixin.js";

const raf_x = (counter, cb) => requestAnimationFrame(counter === 1 ? cb : () => raf_x(counter - 1, cb));

// before(() => {
class TestFlag extends StyleChangedMixin(HTMLElement) {

  static get observedStyles() {
    return ["--color-palette"];
  }

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.style.setProperty("--color-palette", "red orange yellow");
    this.shadowRoot.innerHTML =
      ` <div id='one'>_</div>
        <div id='two'>_</div>
        <div id='three'>_</div>`;
    this._divs = this.shadowRoot.querySelectorAll("div");
  }

  // connectedCallback() {
  //   if (super.connectedCallback) super.connectedCallback();
  // }

  styleChangedCallback(name, newValue, oldValue) {
    if (name === "--color-palette") {
      const colors = newValue.split(" ");
      for (let i = 0; i < colors.length; i++)
        this._divs[i].style.background = colors[i];
    }
    this.testValue = this.testValue || [];
    this.testValue.push({name, newValue, oldValue});
  }
}

customElements.define("test-flag", TestFlag);


describe('StyleChangedMixin basics', function () {

  it("extend HTMLElement class and make an element", function () {
    const StyleChangedElement = StyleChangedMixin(HTMLElement);
    customElements.define("must-use-custom-elements-define-to-enable-constructor-style", StyleChangedElement);
    const el = new StyleChangedElement();
    expect(el.constructor.name).to.be.equal("StyleChangedMixin");
  });

  it("subclass StyleChangedMixin", function () {
    const SubclassStyleChangedElement = class SubclassStyleChanged extends StyleChangedMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-size-changed", SubclassStyleChangedElement);
    const el = new SubclassStyleChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassStyleChanged");
    expect(el.test()).to.be.equal("abc");
  });

  it("subclass StyleChangedMixin anonymous", function () {
    const SubclassStyleChangedElement = class extends StyleChangedMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-size-changed-element", SubclassStyleChangedElement);
    const el = new SubclassStyleChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassStyleChangedElement");
    expect(el.test()).to.be.equal("abc");
  });
  it("extend HTMLElement class correctly and make an element", function () {
    const el = new TestFlag();
    let proto = el.constructor;
    expect(proto.name).to.be.equal("TestFlag");
    proto = Object.getPrototypeOf(proto);
    expect(proto.name).to.be.equal(StyleChangedMixin.name);
    proto = Object.getPrototypeOf(proto);
    expect(proto.name).to.be.equal("HTMLElement");
  });
});

describe("StyleChangedMixin change  the style", function () {

  it("Set default css property value and startup trigger", function (done) {
    let el = new TestFlag();
    document.querySelector("body").appendChild(el);
    requestAnimationFrame(function () {
    // setTimeout(function () {
      // Promise.resolve().then(() => {
      expect(el.testValue[0].name).to.be.equal("--color-palette");
      expect(el.testValue[0].newValue).to.be.equal("red orange yellow");
      expect(el.testValue[0].oldValue).to.be.equal(undefined);
      document.querySelector("body").removeChild(el);
      done();
      // });
    // }, 50)
    })
  });


  it("Change css property value and check new values several times", function (done) {
    let el = new TestFlag();
    document.querySelector("body").appendChild(el);
    setTimeout(function () {
      el.style.setProperty("--color-palette", "green yellow blue");
    }, 50);
    setTimeout(function () {
      el.style.setProperty("--color-palette", "yellow blue white");
    }, 100);
    setTimeout(function () {
      Promise.resolve().then(() => {
        expect(el.testValue[0].name).to.be.equal("--color-palette");
        expect(el.testValue[0].newValue).to.be.equal("red orange yellow");
        expect(el.testValue[0].oldValue).to.be.equal(undefined);
        expect(el.testValue[1].name).to.be.equal("--color-palette");
        expect(el.testValue[1].newValue).to.be.equal("green yellow blue");
        expect(el.testValue[1].oldValue).to.be.equal("red orange yellow");
        expect(el.testValue[2].name).to.be.equal("--color-palette");
        expect(el.testValue[2].newValue).to.be.equal("yellow blue white");
        expect(el.testValue[2].oldValue).to.be.equal("green yellow blue");
        document.querySelector("body").removeChild(el);
        done();
      });
    }, 150)
  });
});