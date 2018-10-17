import {ResizeMixin} from "../../src/layout/ResizeMixin.js";

const raf_x = (counter, cb) => requestAnimationFrame(counter === 1 ? cb : () => raf_x(counter - 1, cb));

describe('ResizeMixin basics', function () {

  it("extend HTMLElement class and make an element", function () {
    const SizeChangedElement = ResizeMixin(HTMLElement);
    customElements.define("must-use-custom-elements-define-to-enable-constructor-size", SizeChangedElement);
    const el = new SizeChangedElement();
    expect(el.constructor.name).to.be.equal("ResizeMixin");
  });

  it("subclass ResizeMixin", function () {
    const SubclassSizeChangedElement = class SubclassSizeChanged extends ResizeMixin(HTMLElement) {
      test() {
        return "abc";
      }
    };
    customElements.define("subclass-size-changed", SubclassSizeChangedElement);
    const el = new SubclassSizeChangedElement();
    expect(el.constructor.name).to.be.equal("SubclassSizeChanged");
    expect(el.test()).to.be.equal("abc");
  });

  it("subclass ResizeMixin anonymous", function () {
    const SubclassSizeChangedElement = class extends ResizeMixin(HTMLElement) {
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
    const Subclass = class Subclass extends ResizeMixin(HTMLElement) {
    };
    customElements.define("get-content-size", Subclass);
    const el = new Subclass();
    expect(el.getContentRect()).to.deep.equal({width: 0, height: 0});
  });

  it("style.display set to inline-block on connection", function () {
    const Subclass = class Subclass extends ResizeMixin(HTMLElement) {
    };
    customElements.define("style-inline-block", Subclass);
    const el = new Subclass();
    document.querySelector("body").appendChild(el);
    expect(el.style.display).to.be.equal("inline-block");
    Promise.resolve().then(() => {
      document.querySelector("body").removeChild(el);
    });
  });
});

//ATT!! the child cannot be removed until after the next ResizeObservation, the simplest way to get there is 2 x rAF
describe('resizeCallback simple', function () {
  it("call resizeCallback on connecting an element to document - using constructor", function (done) {
    const Subclass = class Subclass extends ResizeMixin(HTMLElement) {
      resizeCallback(rect) {
        assert(rect.width > 0);
        assert(rect.height > 0);
        done();
      }
    };
    customElements.define("simple-a", Subclass);
    const el = new Subclass();
    el.innerText = "here we go.";
    document.querySelector("body").appendChild(el);
    raf_x(2, () => document.querySelector("body").removeChild(el));
  });

  it("call resizeCallback on connecting an element to document - using document.createElement", function (done) {
    const Subclass = class Subclass extends ResizeMixin(HTMLElement) {
      resizeCallback(rect) {
        assert(rect.width > 0);
        assert(rect.height > 0);
        done();
      }
    };
    customElements.define("simple-b", Subclass);
    const el = document.createElement("simple-b");
    el.innerText = "here we go.";
    document.querySelector("body").appendChild(el);
    raf_x(2, () => {
      document.querySelector("body").removeChild(el)
    });
  });
});

describe("resizeCallback(rect) resize-changed-x", function () {

  let prevWidth, testHook;

  before(() => {
    const Subclass = class Subclass extends ResizeMixin(HTMLElement) {
      resizeCallback(rect) {
        testHook(rect);
      }
    };
    customElements.define("size-changed-x", Subclass);

    const container = document.createElement("div");
    container.id = "testContainer";
    container.style.width = "300px";
    container.style.height = "300px";
    document.querySelector("body").appendChild(container);
  });

  it("Frame 0: connect element", function (done) {
    testHook = function (rect) {
      assert(rect.width > 0);
      assert(rect.height > 0);
      prevWidth = rect.width;
      done();
    };
    const el = document.createElement("size-changed-x");
    el.innerText = "resize-changed-x:";
    document.querySelector("#testContainer").appendChild(el);
  });

  it("Frame 1: change element.innerText", function (done) {
    raf_x(1, () => {
      testHook = function (rect) {
        assert(rect.width > prevWidth);
        assert(rect.height > 0);
        done();
      };
      const el = document.querySelector("size-changed-x");
      el.innerText = el.innerText + " again..";
    });
  });

  it("Frame 2: change element.style.width", function (done) {
    raf_x(2, () => {
      testHook = function (rect) {
        assert(rect.width === 100);
        assert(rect.height === 100);
        done();
      };
      const el = document.querySelector("size-changed-x");
      // el.style.fontWeight = "bold";
      el.style.width = "100px";
      el.style.height = "100px";
    });
  });

  it("Frame 3: change element.style.padding, margin, border DOES NOT trigger resizeCallback", function (done) {
    raf_x(3, () => {
      testHook = function (rect) {
        assert(false);
      };
      const el = document.querySelector("size-changed-x");
      el.style.padding = "10px 20px";
      el.style.margin = "10px 20px";
      el.style.border = "10px solid white";
      requestAnimationFrame(() => done());
    });
  });

  it("Frame 4: produce new layout but with the same contentRect DOES NOT trigger resizeCallback", function (done) {
    raf_x(4, () => {
      testHook = function (rect) {
        assert(false);
      };
      const container = document.querySelector("#testContainer");
      const el = document.querySelector("size-changed-x");

      container.style.display = "grid";
      container.style.gridTemplateColumns = "auto auto";

      el.style.display = "inline-block";
      el.innerText =
        "innerText innerText innerText innerText innerText innerText innerText innerText innerText " +
        "innerText innerText innerText innerText innerText innerText innerText innerText innerText " +
        "innerText innerText innerText innerText innerText innerText innerText innerText innerText ";
      el.style.padding = "0";
      el.style.margin = "0";
      el.style.border = "0";
      el.style.width = "";
      el.style.height = "100px";
      //el is now 300 wide

      const sib = document.createElement("div");
      sib.style.padding = "0";
      sib.style.margin = "0";
      sib.style.border = "0";
      sib.style.width = "200px";
      sib.style.height = "300px";

      container.appendChild(sib);

      requestAnimationFrame(() => {
        done()
      });
    });
  });

  after(() => {
    const el = document.querySelector("#testContainer");
    document.querySelector("body").removeChild(el)
  });
});

describe("test of switching between inline and inline-block", function () {

  let testHook;

  before(() => {
    const Subclass = class Subclass extends ResizeMixin(HTMLElement) {
      resizeCallback(rect) {
        testHook(rect, this.getContentRect());
      }
    };
    customElements.define("size-changed-inline-switch", Subclass);

    const container = document.createElement("div");
    container.id = "testContainer";
    container.style.width = "300px";
    container.style.height = "300px";
    document.querySelector("body").appendChild(container);
  });

  it("Frame 0: connect element", function (done) {
    testHook = function (rect) {
      assert(rect.width > 0);
      assert(rect.height > 0);
      done();
    };
    const el = document.createElement("size-changed-inline-switch");
    el.innerText = "resize-changed-x:";
    document.querySelector("#testContainer").appendChild(el);
  });

  it("Frame 1: inflight change to display: inline triggers a resizeCallback with values 0,0 for ResizeObserver", function (done) {
    raf_x(1, () => {
      testHook = function (rect) {
        assert(rect.width === 0);
        assert(rect.height === 0);
        done();
      };
      const el = document.querySelector("size-changed-inline-switch");
      el.style.display = "inline";
    });
  });

  it("Frame 2: inflight change to display: block triggers a resizeCallback with DIFFERING values from getContentRect and the contentRect from ResizeObserver", function (done) {
    raf_x(2, () => {
      testHook = function (rect, rect2) {
        assert(rect.width > 0);
        assert(rect.height > 0);
        assert(rect.width !== rect2.width);  //slight difference in Chrome!!
        assert(rect.height === rect2.height);
        done();
      };
      const el = document.querySelector("size-changed-inline-switch");
      el.style.display = "inline-block";
    });
  });

  after(() => {
    const el = document.querySelector("#testContainer");
    document.querySelector("body").removeChild(el)
  });
});
//todo verify that listeners are removed when disconnected.