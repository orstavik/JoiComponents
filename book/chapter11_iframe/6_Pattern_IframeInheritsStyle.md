# Pattern: IframeInheritsStyle

The IframeInheritsStyle pattern embeds an *untrusted* HTML fragment that *inherits* all inherited 
CSS properties from the node in the embedding HTML document onto which the `<iframe>` is appended. 

IframeInheritsStyle is implemented as a web component that uses the StyleCallback pattern and 
a `styleCallback(...)` to dynamically listen for changes in the values of all inheritable CSS
on its host element. Whenever these values changes, the IframeInheritsStyle sends a message to the
inner iframe.

The inner `<iframe>` only inherits the style when it has an `allow-inherited-css-properties`
attribute.

## Web comp: `<iframe-inherits-style>`

```html
<script type="module">
  function iframeScript() {
    return `
<script>
(function(){
  parent.postMessage("ready", "*");
  window.addEventListener("message", function(e){
    const data = JSON.parse(e.data);
    console.log("inside iframe: ", data);
    for (let [prop, value] of Object.entries(data))
      document.children[0].style[prop] = value;
  });
})();
</scrip` + "t>";
  }

  import {StyleCallbackMixin} from "https://unpkg.com/joicomponents@1.2.27/src/style/StyleCallbackMixin.js";

  class IframeInheritsStyle extends StyleCallbackMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(document.createElement("iframe"));
      this._iframe = this.shadowRoot.children[0];
      this._iframe.setAttribute("sandbox", "allow-scripts");

      this._ready = false;
      window.addEventListener("message", this.onMessage.bind(this));

      this._changedStyles = {};
    }

    static get observedAttributes() {
      return ["srcdoc"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "srcdoc") {
        const src =
          iframeScript() +
          (newValue || "");
        this._iframe.setAttribute("srcdoc", src);
      }
    }

    sendMessage(value) {
      if (!this._ready) {                                                      //delay sending this message until
        console.log("delaying 1 rAF...");
        return requestAnimationFrame(this.sendMessage.bind(this, value));    //inner iframe is ready to receive messages
      }
      this._iframe.contentWindow.postMessage(value, "*");
    }

    onMessage(e) {
      if (e.source !== this._iframe.contentWindow)
        return;
      if (e.data === "ready")
        return this._ready = true;
      console.log("message received in parent: ", e.data);
    }

    static get observedStyles() {
      return [
        "quotes",
        "orphans",
        "widows",
        "cursor",
        "caret-color",
        "direction",
        "writing-mode",
        "-webkit-writing-mode",
        "text-combine-upright",
        "-webkit-text-combine",
        "text-orientation",
        "border-collapse",
        "border-spacing",
        "caption-side",
        "empty-cells",
        "visibility",
        "color",
        "color-adjust",
        "-webkit-color-adjust",
        "hyphens",
        "letter-spacing",
        "overflow-wrap",
        "paint-order",
        "tab-size",
        "text-align",
        "text-align-last",
        "text-indent",
        "text-justify",
        "text-size-adjust",
        "hanging-punctuation",
        "text-transform",
        "white-space",
        "word-break",
        "word-spacing",
        "text-shadow",
        "text-underline-position",
        "font",
        "line-height-step",
        "font-kerning",
        "-webkit-font-kerning",
        "font-synthesis",
        "font-language-override",
        "font-optical-sizing",
        "font-size-adjust",
        "font-feature-settings",
        "font-variation-settings",
        "list-style",
      ];
    }


    styleCallback(name, oldValue, newValue) {
//      if (name === whatever) {
      this._changedStyles[name] = newValue;
      this._updateIframe();
//      }
    }

    _updateIframe() {
      if (this._willUpdate || !this.hasAttribute("allow-inherited-css-properties"))
        return;
      this._willUpdate = true;
      Promise.resolve().then(function () {
        this._willUpdate = false;
        this.sendMessage(JSON.stringify(this._changedStyles));
        this._changedStyles = {};
      }.bind(this));
    }
  }

  customElements.define("iframe-inherits-style", IframeInheritsStyle);

</script>

<style>
  body {
    font-family: sans-serif;
    font-size: 15px;
    font-stretch: condensed;
    font-style: italic;
    font-variant: small-caps;
    font-weight: bold;
    line-height: 0.8em;
    color: red;
    list-style-position: inside;
    list-style-type: upper-roman;
    list-style-image: unset;
  }
  .one {
    font-family: serif;
    font-size: 20px;
    font-stretch: expanded;
    font-style: italic;
    font-variant: normal;
    font-weight: bold;
    line-height: 1.5em;
    color: blue;
    list-style-image: url("css.svg"); /*will be absolute in the getComputedStyle*/
    list-style-position: outside;
  }
</style>

<li>Hello<br>sunshine!</li>
<li>Hello<br>sunshine!</li>
<ol>
  <li>Hello<br>sunshine!</li>
  <li>Hello<br>sunshine!</li>
  <li>Hello<br>sunshine!</li>
</ol>
<hr>
<iframe-inherits-style
    allow-inherited-css-properties
    srcdoc="<li>Hello<br>sunshine!</li><ol><li>Hello<br>sunshine!</li></ol>">
</iframe-inherits-style>

<script>
  setInterval(() => document.querySelector("body").classList.toggle("one"), 1000);
  setTimeout(() => document.querySelector("iframe-inherits-style").removeAttribute("allow-inherited-css-properties"), 4000);
</script>
<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
  
  todo there are still some issues to fix.
  todo 1. how to ensure that inherited styles do not override the styles set by the HTML fragment?
  todo 2. how to remove the inherited styles when the `allow-inherited-css-properties` is removed?
-->
```

## References

 * 