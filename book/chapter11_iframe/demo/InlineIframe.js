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
    height: 100%;     
    width: 100%;
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
    parent.postMessage(JSON.stringify({w, h}), "*");
    requestAnimationFrame(alertSize);
  }
  alertSize();
})();</scrip` + `t>`;

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


class InlineIframe extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(outerTemplate.content.cloneNode(true));
    this._iframe = this.shadowRoot.children[1];
    window.addEventListener("message", this.onMessage.bind(this))
  }

  static get observedAttributes() {
    return ["srcdoc"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
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
    res += txt;
    if (this.hasAttribute("allow-browse"))
      res += allowBrowse;
    return res;
  }

  onMessage(e) {
    if (e.source !== this._iframe.contentWindow)
      return;
    const res = JSON.parse(e.data);
    if (res.event)
      this.dispatchEvent(new CustomEvent(res.event.type, {
        bubbles: true,
        composed: true,
        detail: {href: res.event.href}
      }));
  }
}

customElements.define("inline-iframe", InlineIframe);