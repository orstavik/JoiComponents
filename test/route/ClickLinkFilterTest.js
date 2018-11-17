import {highjackLink, getBaseHref} from "../../src/router/HashDotRouter.js";

function createA(attributes) {
  const a = document.createElement("a");
  for (let key of Object.keys(attributes))
    a.setAttribute(key, attributes[key]);
  return a;
}


function click(a, detail) {
  const event = new MouseEvent("click1", Object.assign({}, {bubbles: true, cancelable: true}, detail));
  a.dispatchEvent(event);
}

let output = getBaseHref().split(/[/]+/);


describe("HighjackLink IN", () => {

  it("Normal links within the base are not skipped", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      assert(result.endsWith("/abc"));
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "abc"});
    document.body.appendChild(element);
    click(element, {href: "abc"});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  //todo should we specify that the <base href="must/EndWith/aSLash/".. that the base must be a directory??

  //on empty string, see:
  //https://stackoverflow.com/questions/5637969/is-an-empty-href-valid#answer-43340108
  it("Empty href", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      assert(result.startsWith(getBaseHref()));
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: " "});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Normal links within the base are not skipped", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      assert(result.endsWith("/abc"));
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "abc"});
    document.body.appendChild(element);
    click(element, {href: "abc"});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the base + /fileneme", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal("http://localhost:63342/Router/test/ClickLinkFilter/filename.html");
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "http://localhost:63342/Router/test/ClickLinkFilter/filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the /filename", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "/filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });


  it("Link start from the ./filename", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(getBaseHref() + "filename.html");
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "./filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });
  it("Link start from the ../filename", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "../filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the /sameFolder/fileneme", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "/" + output[output.length - 2] + "/filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the ././filename", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(getBaseHref() + "filename.html");
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "././filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the ../../filename", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "../filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the /sameFolder/sameFolder/fileneme", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "/" + output[output.length - 3] + "/" + output[output.length - 2] + "/filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the ./././filename", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(getBaseHref() + "filename.html");
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "./././filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Link start from the /sameFolder/sameFolder/sameFolder/fileneme", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "/test/ClickLinkFilter/filename.html"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  //svg link inside the same base
  //

  //todo should # be within the base?? I think yes..
  //todo or should we let # pass??

});


describe("HighjackLink OUT", () => {
  it("e.button", function (done) {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({});
    document.body.appendChild(element);
    click(element, {button: 1});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("e.metaKey", function (done) {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({});
    document.body.appendChild(element);
    click(element, {metaKey: true});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("e.ctrlKey", function (done) {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({});
    document.body.appendChild(element);
    click(element, {ctrlKey: true});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("e.shiftKey", function (done) {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({});
    document.body.appendChild(element);
    click(element, {shiftKey: true});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("e.defaultPrevented", function (done) {
    const listener = e => {
      e.preventDefault();
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "abc"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("download attribute", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({download: "url"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("rel='external'", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({rel: "external"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Href starts with a #", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "#abc"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Href starts with mailto:", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "mailto:abc"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Href starts with javascript:", (done) => {
    const listener = e => {
      const result = highjackLink(e, getBaseHref());
      expect(result).to.be.equal(undefined);
      done();
    };
    window.addEventListener("click1", listener);
    const element = createA({href: "javascript:alert('omg..')"});
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

  it("Object href", (done) => {
    const listener = e => {
      const result = highjackLink(e, "");
      expect(result).to.be.equal("http://localhost:63342/Router/test/ClickLinkFilter/lala");
      let svgParent = document.getElementById("svg-parent");
      done();
    };
    window.addEventListener("click1", listener);
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    element.innerHTML = `<polygon id="my-polygon" fill="red" stroke="black"  points="360.5,406 62.757,371.5 61.125,72 360.5,89.5"/><a id="test-a" href="lala"></a>
`;
    element.href = element.children[1].href;
    document.body.appendChild(element);
    click(element, {});
    document.body.removeChild(element);
    window.removeEventListener("click1", listener);
  });

});
