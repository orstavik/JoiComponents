const outerTemplate = document.createElement("template");
outerTemplate.innerHTML = `
<style>
  :host{
    overflow: visible;
    display: inline-block;
  }
  iframe {
    border: none;
    margin: 0;
    padding: 0;
    overflow: visible;
    /*initial values, they are overridden immediately*/
    height: 0;     
    width: 0;
  }
</style>
<iframe sandbox="allow-scripts" scrolling="no" frameborder="0"></iframe>`;

function makeBaseString(baseURI) {
  if (!baseURI)
    return "";
  const base = document.createElement("base");
  base.setAttribute("href", baseURI);
  return base.outerHTML;
}

const innerStyle = `<style>
html {
  border: none;
  margin: 0;
  padding: 0;
  overflow: visible;
}
</style>
`;

const allowOverflow = `
<script>(function(){
  let pW = undefined;
  let pH = undefined;
  const r = document.children[0];
  const s = document.styleSheets[0].cssRules[0];

  window.addEventListener("message", function(e){
    for (let [key, value] of Object.entries(JSON.parse(e.data)))
      s.style[key] = value;
    alertSize();
  });

  function alertSize() {
    const w = r.scrollWidth, h = r.scrollHeight;
    if (pW === w && pH === h)
      return setTimeout(alertSize, 150);
    pW = w; pH = h;
    parent.postMessage(JSON.stringify({w, h}), "*");
    requestAnimationFrame(alertSize);
  }
  alertSize();
})();</script>`;

const allowBrowse = `
<script src="https://unpkg.com/joievents@1.0.16/src/link-click-es6.js"></script>
<script src="https://unpkg.com/joievents@1.0.16/src/browse.js"></script>
<script>
  window.addEventListener("browse", function(e){
    e.preventDefault();
    let event = {type: e.type, timeStamp: e.timeStamp, href: e.getHref()};
    parent.postMessage(JSON.stringify({event}), "*");
  }, true);
</script>`;

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

import {LayoutAttributesMixin} from "https://unpkg.com/joicomponents@1.2.31/src/layout/LayoutAttributesMixin.js";

class InlineIframe extends LayoutAttributesMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(outerTemplate.content.cloneNode(true));
    this._iframe = this.shadowRoot.children[1];
    window.addEventListener("message", this.onMessage.bind(this))
  }

  static get observedAttributes() {
    return ["srcdoc", "_layout-width"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "_layout-width") {
      console.log(newValue);
      this.sendMessage(JSON.stringify({width: newValue}));
    }
    if (name === "srcdoc") {
      const src = newValue ? this._makeIframeContent(newValue) : "";
      let blob = new Blob([src], {type: "text/html"});
      this._iframe.setAttribute("src", URL.createObjectURL(blob));
    }
  }

  _makeIframeContent(txt) {
    let res = innerStyle;
    if (this.hasAttribute("allow-overflow"))
      res += allowOverflow;
    if (this.hasAttribute("base"))
      res += makeBaseString(this.getAttribute("base"));
    res += this.addScriptsAndStyles();
    res += txt;
    if (this.hasAttribute("allow-browse"))
      res += allowBrowse;
    return res;
  }

  addScriptsAndStyles() {
    const outerIncluded = this.getAttribute("included-resources")
      .split(" ")
      .map(selector => document.querySelector(selector));
    const innerIncluded = Array.from(this.children)
      .filter(n => n.tagName === "IFRAME-SCRIPT" || n.tagName === "IFRAME-STYLE" || n.tagName === "IFRAME-LINK");
    const outer = outerIncluded.map(child => transposeTag(child));
    const inner = innerIncluded.map(child => transposeTag(child));
    return outer.join("") + inner.join("");
  }

  sendMessage(value) {
    if (!this._ready)                                                      //delay sending this message until
      return requestAnimationFrame(this.sendMessage.bind(this, value));    //inner iframe is ready to receive messages
    this._iframe.contentWindow.postMessage(value, "*");
  }

  onMessage(e) {
    if (e.source !== this._iframe.contentWindow)
      return;
    this._ready = true;
    const res = JSON.parse(e.data);
    if (res.w)
      this._iframe.style.width = res.w + "px";
    if (res.h)
      this._iframe.style.height = res.h + "px";
    if (res.event)
      this.dispatchEvent(new CustomEvent(res.event.type, {
        bubbles: true,
        composed: true,
        detail: {href: res.event.href}
      }));
  }
}

customElements.define("inline-iframe", InlineIframe);