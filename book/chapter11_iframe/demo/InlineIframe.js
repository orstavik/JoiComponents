import {StyleCallbackMixin} from "https://unpkg.com/joicomponents@1.2.27/src/style/StyleCallbackMixin.js";

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

function makeBaseString(baseURI) {
  if (!baseURI)
    return "";
  const base = document.createElement("base");
  base.setAttribute("href", baseURI);
  return base.outerHTML;
}


let innerTempl = function (width, height, base) {
  return makeBaseString(base) + `
<style>
html {}
body, html {
  margin: 0;  /*the inner iframe takes no space in itself*/
}
</style>
<script src="https://unpkg.com/joievents@1.0.16/src/link-click-es6.js"></script>
<script src="https://unpkg.com/joievents@1.0.16/src/browse.js"></script>
<script>(function(){

  var fW, fH, pW, pH;
  const s = document.styleSheets[0].cssRules[0].style;

  function sizeHasChanged(){
    const html = document.children[0];
    const height = html.scrollHeight;
    const width = html.scrollWidth;
    if (pW === width && pH === height)
      return false;
    pW = width; pH = height;
    parent.postMessage(JSON.stringify({width, height}), "*");
    return true;
  }

  function observeSize() {
    sizeHasChanged() ?
      requestAnimationFrame(observeSize):
      setTimeout(observeSize, 150);
  }

  window.addEventListener("message", function(e){
    if (e.data === "reset") {
      for(let prop; prop = s.item(0);){
        if (prop !== "width" && prop !== "height")
          s.removeProperty(prop);
      }
      return;
    } 
    const res = JSON.parse(e.data);
    for (let [prop, value] of Object.entries(res))
      s[prop] = value;
  });

  document.addEventListener("DOMContentLoaded", function(){
    s.width = (fW = ${width}) + "px";
    s.height = (fH = ${height}) + "px";
    observeSize();
  });

  window.addEventListener("browse", function(e){
    e.preventDefault();
    let event = {type: e.type, timeStamp: e.timeStamp, href: e.getHref()};
    parent.postMessage(JSON.stringify({event}), "*");
  }, true);

})();</script>`;
};

const outerTemplate = document.createElement("template");
outerTemplate.innerHTML = `
<style>
  :host, iframe {
    border: none;
    margin: 0;
    padding: 0;
  }
  :host{
    overflow: visible;
    display: block;
  }
  iframe {
    overflow: hidden;
    /*height: 0;     !*initial value only, will be overwritten later*!*/
    /*width: 0;      !*initial value only, will be overwritten later*!*/
  }
</style>
<iframe sandbox="allow-scripts" scrolling="no" frameborder="0"></iframe>`;

class InlineIframe extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(outerTemplate.content.cloneNode(true));
    this._iframe = this.shadowRoot.children[1];
    window.addEventListener("message", this.onMessage.bind(this));
    this._ready = false;
    this._updateIframeObj = this._updateIframe.bind(this);
    this._changedStyles = {};
  }

  static get observedAttributes() {
    return ["srcdoc", "flow-width", "flow-height", "inherit-css"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "srcdoc") {
      const width = this.getAttribute("flow-width") || 0;
      const height = this.getAttribute("flow-height") || 0;

      let res = "";
      if (this.hasAttribute("included-resources")){
        const outerIncluded = this.getAttribute("included-resources")
          .split(" ")
          .map(selector => document.querySelector(selector));
        const outer = outerIncluded.map(child => transposeTag(child));
        res += outer.join("");
      }
      const innerIncluded = Array.from(this.children)
        .filter(n => n.tagName === "IFRAME-SCRIPT" || n.tagName === "IFRAME-STYLE" || n.tagName === "IFRAME-LINK");
      const inner = innerIncluded.map(child => transposeTag(child));
      res += inner.join("");

      const src = innerTempl(parseInt(width), parseInt(height), this.getAttribute("base")) + res + (newValue || "");
      let blob = new Blob([src], {type: "text/html"});
      this._iframe.setAttribute("src", URL.createObjectURL(blob));
    }
    if (name === "flow-width" || name === "flow-height") {
      const width = this.getAttribute("flow-width") || 0;
      const height = this.getAttribute("flow-height") || 0;
      this._changedStyles.width = width;
      this._changedStyles.heigth = height;
      batchCallsMicro(this._updateIframeObj);
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
    }
  }

  onMessage(e) {
    if (e.source !== this._iframe.contentWindow)
      return;
    this._ready = true;
    const res = JSON.parse(e.data);
    if (res.event) {
      this.dispatchEvent(new CustomEvent(res.event.type, {
        bubbles: true,
        composed: true,
        detail: {href: res.event.href}
      }));
    } else {
      this._iframe.style.width = res.width + "px";
      this._iframe.style.height = res.height + "px";
    }
  }

  sendMessage(value) {
    if (!this._ready) {                                                      //delay sending this message until
      console.log("delaying 1 rAF...");
      return requestAnimationFrame(this.sendMessage.bind(this, value));    //inner iframe is ready to receive messages
    }
    this._iframe.contentWindow.postMessage(value, "*");
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

customElements.define("inline-iframe", InlineIframe);