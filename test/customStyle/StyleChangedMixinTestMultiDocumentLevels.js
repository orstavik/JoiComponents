import {StyleChangedMixin} from "../../src/style/StyleChangedMixin.js";

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var r = parseInt(result[1], 16),
    g = parseInt(result[2], 16),
    b = parseInt(result[3], 16);
  return "rgb(" + r + ", " + g + ", " + b + ")";
}

class StyleCallbackOne extends StyleChangedMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.testValue = [];
    this.shadowRoot.innerHTML = "<div>one</div>";
  }

  static get observedStyles() {
    return ["--custom-css-prop-1"];
  }

  styleChangedCallback(name, newValue, oldValue) {
    this.testValue.push({name, newValue, oldValue});
    let val = parseInt(newValue) + 22;
    this.shadowRoot.children[0].style.background = "#0000" + val;
  }
}

class StyleCallbackTwo extends StyleChangedMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.testValue = [];
    this.shadowRoot.innerHTML = "<div>two<style-callback-one></style-callback-one></div>";
  }

  static get observedStyles() {
    return ["--custom-css-prop-2"];
  }

  styleChangedCallback(name, newValue, oldValue) {
    this.testValue.push({name, newValue, oldValue});
    let val = parseInt(newValue) + 22;
    this.shadowRoot.children[0].style.background = "#0000" + val;
    this.shadowRoot.children[0].children[0].style.setProperty("--custom-css-prop-1", val);
  }
}

class StyleCallbackThree extends StyleChangedMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.testValue = [];
    this.shadowRoot.innerHTML = "<div>three<style-callback-two></style-callback-two></div>";
  }

  static get observedStyles() {
    return ["--custom-css-prop-3"];
  }

  styleChangedCallback(name, newValue, oldValue) {
    this.testValue.push({name, newValue, oldValue});
    let val = parseInt(newValue) + 22;
    this.shadowRoot.children[0].style.background = "#0000" + val;
    this.shadowRoot.children[0].children[0].style.setProperty("--custom-css-prop-2", val);
  }
}

class StyleCallbackFour extends StyleChangedMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.testValue = [];
    this.shadowRoot.innerHTML = "<div>four<style-callback-three></style-callback-three></div>";
  }

  static get observedStyles() {
    return ["--custom-css-prop-4"];
  }

  styleChangedCallback(name, newValue, oldValue) {
    this.testValue.push({name, newValue, oldValue});
    let val = parseInt(newValue) + 22;

    this.shadowRoot.children[0].style.background = "#0000" + val;
    this.shadowRoot.children[0].children[0].style.setProperty("--custom-css-prop-3", val);
  }
}

customElements.define("style-callback-one", StyleCallbackOne);
customElements.define("style-callback-two", StyleCallbackTwo);
customElements.define("style-callback-three", StyleCallbackThree);
customElements.define("style-callback-four", StyleCallbackFour);


describe('StyleChangedMixin 4 levels', function () {

  it("omg", function (done) {
    let four = new StyleCallbackFour();
    four.style.setProperty("--custom-css-prop-4", "11");
    const three = four.shadowRoot.children[0].children[0];
    const two = three.shadowRoot.children[0].children[0];
    const one = two.shadowRoot.children[0].children[0];
    document.querySelector("body").appendChild(four);
    requestAnimationFrame(function () {
      expect(four.shadowRoot.children[0].style.background).to.be.equal(hexToRgb("#000033"));
      expect(three.shadowRoot.children[0].style.background).to.be.equal(hexToRgb("#000055"));
      expect(two.shadowRoot.children[0].style.background).to.be.equal(hexToRgb("#000077"));
      expect(one.shadowRoot.children[0].style.background).to.be.equal(hexToRgb("#000099"));
      document.querySelector("body").removeChild(four);
      done();
    })
  });
});