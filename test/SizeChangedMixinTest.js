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

  it(".getContentRect() returns {width: 0, height: 0}", function () {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
    };
    customElements.define("get-content-size", Subclass);
    const el = new Subclass();
    expect(el.getContentRect()).to.deep.equal({width: 0, height: 0});
  });

  it("style.display set to inline-block on connection", function () {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
    };
    customElements.define("style-inline-block", Subclass);
    const el = new Subclass();
    document.querySelector("body").appendChild(el);
    expect(el.style.display).to.be.equal("inline-block");
    Promise.resolve().then(() => {
      document.querySelector("body").removeChild(el);
    });
  });

  it("call sizeChangedCallback on connecting an element to document - using constructor", function (done) {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
      sizeChangedCallback(rect) {
        assert(rect.width > 0);
        assert(rect.height > 0);
        done();
      }
    };
    customElements.define("connect-size-changed", Subclass);
    const el = new Subclass();
    el.innerText = "here we go.";
    document.querySelector("body").appendChild(el);
    requestAnimationFrame(() => {               //ATT!! the child cannot be removed until after the next ResizeObservation
      requestAnimationFrame(() => {             //ATT!! the simplest way to get there is 2 x rAF
        document.querySelector("body").removeChild(el);
      });
    });
  });

  it("call sizeChangedCallback on connecting an element to document - using document.createElement", function (done) {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
      sizeChangedCallback(rect) {
        assert(rect.width > 0);
        assert(rect.height > 0);
        done();
      }
    };
    customElements.define("connect-size-changed-create", Subclass);
    const el = document.createElement("connect-size-changed-create");
    el.innerText = "here we go.";
    document.querySelector("body").appendChild(el);
    requestAnimationFrame(() => {               //ATT!! the child cannot be removed until after the next ResizeObservation
      requestAnimationFrame(() => {             //ATT!! the simplest way to get there is 2 x rAF
        document.querySelector("body").removeChild(el)
      })
    });
  });
});

//TODO test how it is to change the display type during observation??
//todo test if the style can be changed to inline after it has been observed, or if this will cause problems.
// todo it("change style width of a connected element", function (done) {
// todo it("change style padding of a connected element", function (done) {
// todo it("change position of a connected element that should not trigger", function (done) {
// todo it("change padding and width so it does not change the size and does not trigger", function (done) {
describe("sizeChangedCallback(rect)", function () {

  let prevWidth, testHook;

  before(() => {
    const Subclass = class Subclass extends SizeChangedMixin(HTMLElement) {
      sizeChangedCallback(rect) {
        testHook(rect);
      }
    };
    customElements.define("size-changed-x", Subclass);
  });
  it("change content of a connected element", function (done) {


    testHook = function (rect) {
      assert(rect.width > 0);
      assert(rect.height > 0);
      prevWidth = rect.width;
    };
    const el = document.createElement("size-changed-x");
    el.innerText = "here we go.";
    document.querySelector("body").appendChild(el);     //given enough time, this will call the testHook function twice!!

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        testHook = function (rect) {
          assert(rect.width > prevWidth);
          assert(rect.height > 0);
          done();
        };
        const el = document.querySelector("size-changed-x");
        // el.style.fontWeight = "bold";
        el.innerText = el.innerText + " again..";
      });
    });
  });
  after(() => {
    const el = document.querySelector("size-changed-x");
    document.querySelector("body").removeChild(el);
  });

  //todo verify that listeners are removed when disconnected.
  //todo make some tests showing that it does not go outside of its realm.. don't know how
});