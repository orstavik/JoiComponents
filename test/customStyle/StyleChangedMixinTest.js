import {StyleChangedMixin, pauseStyleChangeCallbacks, restartStyleChangeCallbacks} from "../../src/StyleChangedMixin.js";

const raf_x = (counter, cb) => requestAnimationFrame(counter === 1 ? cb : () => raf_x(counter - 1, cb));

class StyleCallback extends StyleChangedMixin(HTMLElement) {

  static get observedStyles() {
    return ["--custom-css-prop-1", "--custom-css-prop-2"];
  }

  styleChangedCallback(name, newValue, oldValue) {
    this.testValue = this.testValue || [];
    this.testValue.push({name, newValue, oldValue});
  }
}

customElements.define("style-callback", StyleCallback);


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
    const el = new StyleCallback();
    let proto = el.constructor;
    expect(proto.name).to.be.equal("StyleCallback");
    proto = Object.getPrototypeOf(proto);
    expect(proto.name).to.be.equal(StyleChangedMixin.name);
    proto = Object.getPrototypeOf(proto);
    expect(proto.name).to.be.equal("HTMLElement");
  });
});

describe("StyleChangedMixin. Set el.style and change el.style 1 time", function () {

  it("Set default css property value and startup trigger", function (done) {
    let el = new StyleCallback();
    el.style.setProperty("--custom-css-prop-1", "one");
    document.querySelector("body").appendChild(el);
    requestAnimationFrame(function () {
      expect(el.testValue[0].name).to.be.equal("--custom-css-prop-1");
      expect(el.testValue[0].newValue).to.be.equal("one");
      expect(el.testValue[0].oldValue).to.be.equal("");
      document.querySelector("body").removeChild(el);
      done();
    })
  });

  it("numbers and boolean", function (done) {
    let el = new StyleCallback();
    el.style.setProperty("--custom-css-prop-1", 12);
    el.style.setProperty("--custom-css-prop-2", true);
    document.querySelector("body").appendChild(el);
    requestAnimationFrame(function () {
      expect(el.testValue[0].name).to.be.equal("--custom-css-prop-1");
      expect(el.testValue[0].newValue).to.be.equal("12");
      expect(el.testValue[0].oldValue).to.be.equal("");
      expect(el.testValue[1].name).to.be.equal("--custom-css-prop-2");
      expect(el.testValue[1].newValue).to.be.equal("true");
      expect(el.testValue[1].oldValue).to.be.equal("");
      document.querySelector("body").removeChild(el);
      done();
    })
  });

  it("StyleChangedMixin. Set el.style and change el.style 4 times", function (done) {
    let el = new StyleCallback();
    el.style.setProperty("--custom-css-prop-1", "one");
    document.querySelector("body").appendChild(el);
    setTimeout(() => el.style.setProperty("--custom-css-prop-1", "two"), 50);
    setTimeout(() => el.style.setProperty("--custom-css-prop-1", "three"), 100);
    setTimeout(() => {
      Promise.resolve().then(() => {
        expect(el.testValue[0].name).to.be.equal("--custom-css-prop-1");
        expect(el.testValue[0].oldValue).to.be.equal("");
        expect(el.testValue[0].newValue).to.be.equal("one");
        expect(el.testValue[1].name).to.be.equal("--custom-css-prop-1");
        expect(el.testValue[1].oldValue).to.be.equal("one");
        expect(el.testValue[1].newValue).to.be.equal("two");
        expect(el.testValue[2].name).to.be.equal("--custom-css-prop-1");
        expect(el.testValue[2].oldValue).to.be.equal("two");
        expect(el.testValue[2].newValue).to.be.equal("three");
        document.querySelector("body").removeChild(el);
        done();
      });
    }, 150)
  });

  it("StyleChangedMixin. Stylesheet, then style, then stylesheet", function (done) {
    let div = document.createElement("div");
    div.id = "tempStyled";
    div.innerHTML = `
<style>
  style-callback {
    --custom-css-prop-1: one;
  }
</style> 
<style-callback></style-callback>`;
    const el = div.children[1];
    document.querySelector("body").appendChild(div);
    setTimeout(() => el.style.setProperty("--custom-css-prop-1", "two"), 50);
    setTimeout(() => el.style.removeProperty("--custom-css-prop-1"), 100);
    setTimeout(() => {
      Promise.resolve().then(() => {
        expect(el.testValue[0].name).to.be.equal("--custom-css-prop-1");
        expect(el.testValue[0].oldValue).to.be.equal("");
        expect(el.testValue[0].newValue).to.be.equal("one");
        expect(el.testValue[1].name).to.be.equal("--custom-css-prop-1");
        expect(el.testValue[1].oldValue).to.be.equal("one");
        expect(el.testValue[1].newValue).to.be.equal("two");
        expect(el.testValue[2].name).to.be.equal("--custom-css-prop-1");
        expect(el.testValue[2].oldValue).to.be.equal("two");
        expect(el.testValue[2].newValue).to.be.equal("one");
        document.querySelector("body").removeChild(div);
        done();
      });
    }, 150)
  });

  it("pauseStyleChangeCallbacks() and restartStyleChangeCallbacks() test", function (done) {
    let el = new StyleCallback();
    el.style.setProperty("--custom-css-prop-1", "red");
    document.querySelector("body").appendChild(el);
    setTimeout(() => {
      Promise.resolve().then(() => {
        expect(el.testValue[0].name).to.be.equal("--custom-css-prop-1");
        expect(el.testValue[0].newValue).to.be.equal("red");
        expect(el.testValue[0].oldValue).to.be.equal("");
        pauseStyleChangeCallbacks();
      });
    }, 10);
    setTimeout(function () {
      el.style.setProperty("--custom-css-prop-1", "stop");
      el.style.setProperty("--custom-css-prop-1", "stop2");
    }, 100);
    setTimeout(() => {
      Promise.resolve().then(() => {
        expect(el.testValue.length).to.be.equal(1);
        restartStyleChangeCallbacks();
      });
    },150);
    setTimeout(() => {
      Promise.resolve().then(() => {
        expect(el.testValue.length).to.be.equal(2);
        expect(el.testValue[1].newValue).to.be.equal("stop2");
        expect(el.testValue[1].oldValue).to.be.equal("red");
        document.querySelector("body").removeChild(el);
        done();
      });
    },200);
  });
});