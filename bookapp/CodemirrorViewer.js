function debounce(a,b,c){var d;return function(){var e=this,f=arguments;clearTimeout(d),d=setTimeout(function(){d=null,c||a.apply(e,f)},b),c&&!d&&a.apply(e,f)}}

function loadScriptSync(doc, content) {
  const script = doc.createElement("script");
  script.innerText = content;
  doc.open();
  doc.write(script.outerHTML);
  doc.close();
}

//depends on
//https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/codemirror.min.js
//https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/mode/javascript/javascript.js

export class CodemirrorViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.cm = undefined;
    this.code = undefined;
    this._debouncer = debounce((e,f) => this.codeChanged(e,f), 200);

  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/codemirror.css">
<div style="min-width: 200px; float: left;"></div>
<iframe style="min-width"></iframe>
<div hidden>
  <slot></slot>
</div>
`;
    this.code = this.shadowRoot.children[3].children[0].assignedNodes()[0].innerHTML || "";
    this.cm = CodeMirror(this.shadowRoot.children[1], {
      value: this.code,
      mode: "javascript"
    });
    this.cm.on("change", this._debouncer);

  }

  codeChanged(e,f){
    this.code = this.cm.getValue();
    this.shadowRoot.children[3].children[0].assignedNodes()[0] = this.code;
    const iframe = this.shadowRoot.children[2];
    const iframeWin = iframe.contentWindow || iframe;
    const iframeDoc = iframe.contentDocument || iframeWin.document;
    loadScriptSync(iframeDoc, this.code);
  }
}