import {PartyStyleMixin} from "../../../src/style/old/PartyStyleMixin.js";

describe('basics', function () {

  class HasParents extends PartyStyleMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<style>#party {color: red;}</style>";
    }
  }
  class PaPa extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.child = new HasParents();
      // this.shadowRoot.innerHTML = "<style>h2 {color: orange;}</style>";
      this.shadowRoot.appendChild(this.child);
    }
  }
  class GrandPapa extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.child = new PaPa();
      this.shadowRoot.innerHTML = "<style>#party {color: yellow;}</style>";
      this.shadowRoot.appendChild(this.child);
    }
  }
  customElements.define("has-parents", HasParents);
  customElements.define("pa-pa", PaPa);
  customElements.define("grand-papa", GrandPapa);

  it("get all parents", function () {
    const el = new GrandPapa();
    document.querySelector("body").appendChild(el);
    expect(el.child.child.parentDocs[0]).to.be.equal(el.child.child.shadowRoot);
    expect(el.child.child.parentDocs[1]).to.be.equal(el.child.shadowRoot);
    expect(el.child.child.parentDocs[2]).to.be.equal(el.shadowRoot);
    expect(el.child.child.parentDocs[3]).to.be.equal(el.getRootNode());
    expect(el.child.child.parentDocs.length).to.be.equal(4);
    document.querySelector("body").removeChild(el);
  });

  it("makes party style", function () {
    const el = new GrandPapa();
    document.querySelector("body").appendChild(el);
    console.log();
    expect(document.querySelector("style#PartyStyleWithJOI")).to.be.equal(null);
    expect(el.shadowRoot.querySelector("style#PartyStyleWithJOI").id).to.be.equal("PartyStyleWithJOI");
    expect(el.child.shadowRoot.querySelector("style#PartyStyleWithJOI")).to.be.equal(null);
    expect(el.child.child.shadowRoot.querySelector("style#PartyStyleWithJOI").id).to.be.equal("PartyStyleWithJOI");
    document.querySelector("body").removeChild(el);
  });

  it("convert party style", function () {
    const el = new GrandPapa();
    document.querySelector("body").appendChild(el);
    console.log();
    expect(document.querySelector("style#PartyStyleWithJOI")).to.be.equal(null);
    expect(el.shadowRoot.querySelector("style#PartyStyleWithJOI").innerText).to.be.equal("#party { color: yellow; }");
    expect(el.child.shadowRoot.querySelector("style#PartyStyleWithJOI")).to.be.equal(null);
    expect(el.child.child.shadowRoot.querySelector("style#PartyStyleWithJOI").innerText).to.be.equal("#party { color: red; }");
    document.querySelector("body").removeChild(el);
  });
});