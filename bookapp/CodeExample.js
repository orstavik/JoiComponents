function debounce(a, b, c) {
  var d;
  return function () {
    var e = this, f = arguments;
    clearTimeout(d);
    d = setTimeout(function () {
      d = null;
      c || a.apply(e, f)
    }, b);
    c && !d && a.apply(e, f)
  }
}

//adding the <i> to make sure the script is written to the document.body, and not the document.head
function loadScriptSync(document, code) {
  //document.open();
  document.write("\<i>\<\/i>\<script>" + code + "\<\/script>");
  //document.close();
}

export class CodeExample extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this._debouncer = debounce(e => this.codeChanged(e), 400);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
<textarea style="width: 400px; height: 400px; float: left;"></textarea>
<iframe style="width: 400px; height: 400px; float:left;" ></iframe>
<style>
:host(){
  display: block;
  clear: both;
}
</style>
`;
    this.shadowRoot.children[0].addEventListener("input", this._debouncer);
    this.shadowRoot.children[0].value = " " + this.innerHTML;
    this.codeChanged();
  }

  codeChanged(e) {
    const iframe = this.shadowRoot.children[1],
      iframeWin = iframe.contentWindow || iframe,
      iframeDoc = iframe.contentDocument || iframeWin.document;
    const code = this.shadowRoot.children[0].value;
    loadScriptSync(iframeDoc, code);
  }
}

