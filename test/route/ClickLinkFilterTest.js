import {highjackLink, getBaseHref} from "../../src/router/HashDotRouter.js";

function createA(attributes) {
  const a = document.createElement("a");
  for (let key of Object.keys(attributes))
    a.setAttribute(key, attributes[key]);
  return a;
}

function click(a, detail) {
  const event = new MouseEvent("click", Object.assign({}, {bubbles: true, cancelable: true}, detail));
  event.preventDefault();
  a.dispatchEvent(event);
}

describe("HighjackLink", function () {

  let original = document.querySelector("base");
  let forTest = document.createElement("base");
  forTest.setAttribute("href", "https://example.com/what/ever/");

  before(function () {
    original ? original.insertBefore(forTest) : document.querySelector("body").appendChild(forTest);
  });

  describe("getBaseHref()", function () {
    it("getBaseHref()", () => {
      expect(getBaseHref()).to.be.equal("https://example.com/what/ever/");
    });

    it("https://example.com (missing slash on root segment is added)", () => {
      forTest.setAttribute("href", "https://example.com");
      expect(getBaseHref()).to.be.equal("https://example.com/");
    });

    it("https://example.com/what/ever/omg.html (exclude filename)", () => {
      forTest.setAttribute("href", "https://example.com/what/ever/omg.html");
      expect(getBaseHref()).to.be.equal("https://example.com/what/ever/");
    });

    it("https://example.com/what/ever/?query=this (exclude query)", () => {
      forTest.setAttribute("href", "https://example.com/what/ever/?query=this");
      expect(getBaseHref()).to.be.equal("https://example.com/what/ever/");
    });
    it("https://example.com/what/ever/#abc (exclude hash)", () => {
      forTest.setAttribute("href", "https://example.com/what/ever/#abc");
      expect(getBaseHref()).to.be.equal("https://example.com/what/ever/");
    });
    it("https://example.com/what/ever/?query=th/is (exclude query with slash)", () => {
      forTest.setAttribute("href", "https://example.com/what/ever/?query=th/is");
      expect(getBaseHref()).to.be.equal("https://example.com/what/ever/");
    });
    it("https://example.com/what/ever/#abc/def (exclude hash with slash)", () => {
      forTest.setAttribute("href", "https://example.com/what/ever/#abc/def");
      expect(getBaseHref()).to.be.equal("https://example.com/what/ever/");
    });
    after(function(){
      forTest.setAttribute("href", "https://example.com/what/ever/");
    })

  });
  describe("IN", function () {

    it("filename.html", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    //on empty string, see:
    //https://stackoverflow.com/questions/5637969/is-an-empty-href-valid#answer-43340108
    it("'' (Empty)", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: " "});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("/what/ever/filename.html", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "/what/ever/filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("./filename.html", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "./filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("../ever/filename.html", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "../ever/filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("../../what/ever/filename.html", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "../../what/ever/filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("./././filename.html", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "./././filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("?query=this", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/?query=this");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "?query=this"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("#abc", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/#abc");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "#abc"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("e.defaultPrevented", function (done) {
      const listener = e => {
        e.preventDefault();
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });
  });

  describe("OUT", function () {
    it("e.button", function (done) {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({});
      document.body.appendChild(element);
      click(element, {button: 1});
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("e.metaKey", function (done) {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({});
      document.body.appendChild(element);
      click(element, {metaKey: true});
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("e.ctrlKey", function (done) {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({});
      document.body.appendChild(element);
      click(element, {ctrlKey: true});
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("e.shiftKey", function (done) {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({});
      document.body.appendChild(element);
      click(element, {shiftKey: true});
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("download attribute", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({download: "url"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("rel='external'", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({rel: "external"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("mailto:", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "mailto:abc"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("javascript:", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "javascript:alert('omg..')"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("Link start from the /sameFolder/sameFolder/sameFolder/fileneme", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "/test/ClickLinkFilter/filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("/filename.html  (wrong root folder)", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "/filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("../filename.html  (wrong root folder)", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal(undefined);
        done();
      };
      window.addEventListener("click", listener);
      const element = createA({href: "../filename.html"});
      document.body.appendChild(element);
      click(element);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });
  });

  describe("SVG", function () {

    it("Object href", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/filename.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      element.innerHTML = `
<a id="test-a" href="filename.html">
  <polygon id="my-polygon" fill="red" stroke="black"  points="360.5,406 62.757,371.5 61.125,72 360.5,89.5"/>
</a>`;
      document.body.appendChild(element);
      click(element.children[0].children[0]);
      document.body.removeChild(element);
      window.removeEventListener("click", listener);
    });

    it("animated href", (done) => {
      const listener = e => {
        const result = highjackLink(e, getBaseHref());
        expect(result).to.be.equal("https://example.com/what/ever/animated.html");
        done();
      };
      window.addEventListener("click", listener);
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      element.innerHTML = `
<animate xlink:href="#test-a" attributeName="href" from="filename.html" to="animated.html" dur="1ms" begin="0s" fill="freeze"/>
<a id="test-a" href="filename.html">
  <polygon fill="red" stroke="black"  points="360.5,406 62.757,371.5 61.125,72 360.5,89.5"/>
</a>
`;
      document.body.appendChild(element);
      setTimeout(() => {
        click(element.children[1].children[0]);
        window.removeEventListener("click", listener);
        document.body.removeChild(element);
      }, 300);                    //we need to wait approx 250ms for svg <animate> to kick in..
    });
  });

  after(function () {
    forTest.remove();
  });
});
