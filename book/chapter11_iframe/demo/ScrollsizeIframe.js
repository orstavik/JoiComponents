let innerTempl = function (width, height) {
  return `
<style>
html {
}
body, html {
  margin: 0;  /*the inner iframe takes no space in itself*/
}
</style>
<script>(function(){

  var fW, fH, pW, pH;
  const s = document.styleSheets[0].cssRules[0].style;

  function setSize(width, height){
    if (width === fW && height === fH)
      return;
    s.width = (fW = width) + "px";
    s.height = (fH = height) + "px";
  }
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
    const dim = JSON.parse(e.data);
    setSize(dim.width, dim.height);
  });

  document.addEventListener("DOMContentLoaded", setSize.bind(undefined, ${width}, ${height}));
  document.addEventListener("DOMContentLoaded", observeSize);
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

class ScrollsizeIframe extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(outerTemplate.content.cloneNode(true));
    this._iframe = this.shadowRoot.children[1];
    window.addEventListener("message", this.onMessage.bind(this));
    this._ready = false;
  }

  static get observedAttributes() {
    return ["srcdoc", "viewport-width", "viewport-height"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "srcdoc") {
      const width = this.getAttribute("viewport-width") || 0;
      const height = this.getAttribute("viewport-height") || 0;
      const src = innerTempl(parseInt(width), parseInt(height)) + (newValue || "");
      let blob = new Blob([src], {type: "text/html"});
      this._iframe.setAttribute("src", URL.createObjectURL(blob));
    }
    if (name === "viewport-width" || name === "viewport-height") {
      const width = this.getAttribute("viewport-width") || 0;
      const height = this.getAttribute("viewport-height") || 0;
      this._iframe.contentWindow.postMessage("[" + width + "," + height + "]", "*");
    }
  }

  onMessage(e) {
    if (e.source !== this._iframe.contentWindow)
      return;
    const dim = JSON.parse(e.data);
    this._iframe.style.width = dim.width + "px";
    this._iframe.style.height = dim.height + "px";
  }
}

customElements.define("overflow-iframe-part2", ScrollsizeIframe);
