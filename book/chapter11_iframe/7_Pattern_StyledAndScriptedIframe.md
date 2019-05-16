# Pattern: StyledAndScriptedIframe

The StyledAndScriptedIframe pattern embeds an *untrusted* HTML fragment that can be passed a list
of CSS stylesheets and JS script files. The files passed into the HTML fragment will be accessible
from within the unsafe browsing context, so don't pass any secret data in these CSS or JS pieces.

There are two ways to pass data into the `<iframe>`:
1. A `<script>` or `<link rel="stylesheet>` or `<style>` element is added as a child of the
   web component with the `<iframe>`, and they contain an `iframe-include` attribute.
2. An `<iframe-script>`, `<iframe-style>`, or `<iframe-link>` is placed as a child on the 
   `<iframe-styled-scripted>`, container element. These three types of elements will inside
   the inner `<iframe>` be interpreted as a plain `<script>`, `<style>`, or `<link>` element,
   but will play no role inside the `<iframe>`. 

The given resources are not dynamic. If they are changed inside the lightDOM after the inner `<iframe>` 
has been passed its content, the changes will not affect the `<iframe>`. To make dynamic changes
be reflected in the inner `<iframe>`, the `srcdoc` attribute on `<iframe-styled-scripted>` element.

## Web comp: `<iframe-styled-scripted>`

```html
<script type="module">
  function attributesAbsoluteUrlAsTxt(node) {
    let res = "";
    for (let i = 0; i < node.attributes.length; i++) {
      const name = node.attributes[i].name;
      let value = node.attributes[i].value;
      if (name === "href" || name === "src")
        value = new URL(value, document.baseURI).href;
      res += ` ${name}="${value}"`;
    }
    return res;
  }

  function transposeTag(node) {
    if (!node)
      return null;                        //todo throw a warning here?
    const tagName = (node.tagName.startsWith("IFRAME-") ? node.tagName.substr(7) : node.tagName).toLowerCase();
    const attributes = attributesAbsoluteUrlAsTxt(node);
    const content = node.innerHTML;
    return `<${tagName} ${attributes}>${content}</${tagName}>`;
  }

  class StyledScriptedIframe extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(document.createElement("iframe"));
      this._iframe = this.shadowRoot.children[0];
      this._iframe.setAttribute("sandbox", "allow-scripts");
    }

    static get observedAttributes() {
      return ["srcdoc"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "srcdoc") {
        const outerIncluded = this.getAttribute("included-resources")
          .split(" ")
          .map(selector => document.querySelector(selector));
        const innerIncluded = Array.from(this.children)
          .filter(n => n.tagName === "IFRAME-SCRIPT" || n.tagName === "IFRAME-STYLE" || n.tagName === "IFRAME-LINK");
        const outer = outerIncluded.map(child => transposeTag(child));
        const inner = innerIncluded.map(child => transposeTag(child));
        this._iframe.setAttribute("srcdoc", outer.join("") + inner.join("") + (newValue || ""));
      }
    }
  }

  customElements.define("iframe-styled-scripted", StyledScriptedIframe);

</script>
<header-one>Hello<br>sunshine!</header-one>
<hr>
<style id="alpha">
  header-one {
    color: red;
  }
</style>
<style id="beta">
  header-one {
    background-color: pink;
  }
</style>
<link id="uno" rel="stylesheet" href="styledIframeUno.css">
<script id="one">
  class HeaderOne extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<style>slot {font-weight: bold; font-size: 2em;}</style><slot></slot>"
    }
  }

  customElements.define("header-one", HeaderOne);
  console.log("script1"); //should print twice
</script>
<script id="two">
  console.log("script2");
</script>

<iframe-styled-scripted
    included-resources="script#one script#three style#alpha link#uno"
    srcdoc="<header-one>Hello<br>sunshine!</header-one>">
  <iframe-style>
    header-one {
    border-bottom: 4px dotted blue;
    }
  </iframe-style>
  <iframe-link id="dos" rel="stylesheet" href="styledIframeDos.css"></iframe-link>
  <iframe-script src="scriptedIframe.js">
    exclude me
  </iframe-script>
  <iframe-script>
    console.log("iframe-script says hi!");
  </iframe-script>
</iframe-styled-scripted>

<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## References

 * 
