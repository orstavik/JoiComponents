# Pattern: IframeInheritsStyleValues

The IframeInheritsStyleValues pattern ensures that CSS values that depend on the dimensions of the
window, such as `vh` and `vw`. The problem with these values is that they should be bound to the
tackles the problem of embeds an *untrusted* HTML fragment that *inherits* all inherited 
CSS properties from the node in the embedding HTML document onto which the `<iframe>` is appended. 
The inner `<iframe>` only inherits the style when it has an `inherit-css` attribute.

IframeInheritsStyle is implemented as a web component that uses the StyleCallback pattern and 
a `styleCallback(...)` to dynamically listen for changes in the values of all inheritable CSS
on its host element. Whenever these values changes, the IframeInheritsStyle sends a message to the
inner `<iframe>`. The inner `<iframe>` contains a default CSS stylesheet with a single rule for the
root `html { ... }` element. This rule is then populated with all the same CSS values for all the
inheritable CSS properties on the container element.

## Web comp: `<iframe-inherits-style>`

```html
<script type="module">

  const active = [];

  function batchCallsMicro(fn) {
    if (active.indexOf(fn) === -1) {
      active.push(fn);
      Promise.resolve().then(() => active.splice(active.indexOf(fn), 1) && fn());
    }
  }

  const inheritableCssProperties = [
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

  const inputScript = `
<style>html {}</style>
<script>(function(){
  const inheritRule = document.styleSheets[0].cssRules[0].style;
  window.addEventListener("message", function(e){
    if (e.data === "reset") {
      for(let prop; prop = inheritRule.item(0);)
        inheritRule.removeProperty(prop);
    } else {
      for (let [prop, value] of Object.entries(JSON.parse(e.data)))
        inheritRule[prop] = value;
    }
  });
  parent.postMessage("ready", "*");
})();</scrip` + `t>`;

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
      this._updateIframeObj = this._updateIframe.bind(this);

      this._changedStyles = {};
    }

    static get observedAttributes() {
      return ["srcdoc", "inherit-css"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "srcdoc") {
        const src = inputScript + (newValue || "");
        const blob = new Blob([src], {type: "text/html"});
        this._iframe.setAttribute("src", URL.createObjectURL(blob));
        return;
      }
      if (name === "inherit-css") {
        if (newValue === null) {
          //pause the styleCallback
          this._changedStyles = undefined;
        } else {
          //restart the styleCallback
          this._changedStyles = {};
          const nowStyle = getComputedStyle(this);
          for (let prop of inheritableCssProperties)
            this._changedStyles[prop] = nowStyle[prop];
        }
        batchCallsMicro(this._updateIframeObj);
        return;
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
      return inheritableCssProperties;
    }


    styleCallback(name, oldValue, newValue) {
//      if (name === whatever) {
      if (!this._changedStyles)
        return;
      this._changedStyles[name] = newValue;
      batchCallsMicro(this._updateIframeObj);
//      }
    }

    _updateIframe() {
      if (!this._changedStyles)
        return this.sendMessage("reset");
      this.sendMessage(JSON.stringify(this._changedStyles));
      this._changedStyles = {};
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
    list-style-image: url("css.svg"); /*getComputedStyle returns an absolute URL value, so no problem*/
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
    inherit-css
    srcdoc="<li>Hello<br>sunshine!</li><ol><li>Hello<br>sunshine!</li></ol>">
</iframe-inherits-style>

<script>
  const iIframe = document.querySelector("iframe-inherits-style");
  const body = document.querySelector("body");
  setInterval(() => body.classList.toggle("one"), 1000);
  setInterval(() => iIframe.hasAttribute("inherit-css") ? iIframe.removeAttribute("inherit-css") : iIframe.setAttribute("inherit-css", ""), 4000);
</script>
<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## References

 * 
