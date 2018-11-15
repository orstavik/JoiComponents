import {highjackLink} from "../../src/router/HashDotRouter.js";

const url = new URL("abc", document.baseURI).href;

function createA() {
  const a = document.createElement("a");
  a.id = "test";
  document.body.appendChild(a);
  return a;
}

function removeA() {
  document.body.removeChild(document.querySelector("#test"));
}

function click(a, counter, detail) {
  a.dispatchEvent(new MouseEvent("click" + counter, Object.assign({}, {bubbles: true, cancelable: true}, detail)));
}

describe("HighjackLink tests", () => {

  it("Check the right link to be sure that wrong links will be skipped", (done) => {
    let elem = createA();
    window.addEventListener("click1", e => {
      e.target.href = "abc";
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal("http://localhost:63342/Router/test/ClickLinkFilter/abc");
      removeA();
    });
    click(elem, 1, null);
    done();
  });

  it("e.button", function (done) {
    let elem = createA();
    window.addEventListener("click2", e => {
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 2, {button: 1});
    done();
  });

  it("e.metaKey", function (done) {
    let elem = createA();
    window.addEventListener("click3", e => {
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 3, {metaKey: true});
    done();
  });

  it("e.ctrlKey", function (done) {
    let elem = createA();
    window.addEventListener("click4", e => {
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 4, {ctrlKey: true});
    done();
  });

  it("e.shiftKey", function (done) {
    let elem = createA();
    window.addEventListener("click5", e => {
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 5, {shiftKey: true});
    done();
  });

  it("e.defaultPrevented", function (done) {
    let elem = createA();
    window.addEventListener("click6", e => {
      e.preventDefault();
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 6, null);
    done();
  });

  it("download attribute", (done) => {
    let elem = createA();
    window.addEventListener("click7", e => {
      elem.setAttribute("download", "file");
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 7, null);
    done();
  });

  it("rel='external'", (done) => {
    let elem = createA();
    window.addEventListener("click8", e => {
      elem.setAttribute("rel", "external");
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 8, null);
    done();
  });

  it("Href starts with a #", (done) => {
    let elem = createA();
    window.addEventListener("click9", e => {
      e.target.href = "#abc";
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 9, null);
    done();
  });

  it("Href starts with a mailto:", (done) => {
    let elem = createA();
    window.addEventListener("click10", e => {
      e.target.href = "mailto:me";
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 10, null);
    done();
  });

  it("Empty href", (done) => {
    let elem = createA();
    window.addEventListener("click11", e => {
      e.target.href = "";
      let abc = highjackLink(e, url);
      expect(abc).to.be.equal(undefined);
      removeA();
    });
    click(elem, 11, null);
    done();
  });
});
