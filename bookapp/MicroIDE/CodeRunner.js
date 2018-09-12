
//<code-runner style="height: 400px; width: 400px; background: yellow;"></code-runner>
//<script>

const template = document.createElement("template");
template.innerHTML = `
   <style>
     :host {
       display: block;
     }
     iframe {
       width: 100%;
       height: 100%;
     }
   </style>
   <iframe style="min-width: 100px;"></iframe>
`;

export class CodeRunner extends HTMLElement {

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  loadScriptSync(code) {
    const iframe = this.shadowRoot.children[1];
    const iframeWin = iframe.contentWindow || iframe;
    this._iframeDoc = iframe.contentDocument || iframeWin.document;
    this._iframeDoc.open();
    this._iframeDoc.write("\<i>\<\/i>\<script>"+code+"\<\/script>");   //adding the <i> to make sure the script is written to the document.body, and not the document.head
    this._iframeDoc.close();
  }

  loadHTMLSync(code) {
    const iframe = this.shadowRoot.children[1];
    const iframeWin = iframe.contentWindow || iframe;
    this._iframeDoc = iframe.contentDocument || iframeWin.document;
    this._iframeDoc.open();
    this._iframeDoc.write(code);
    this._iframeDoc.close();
  }

  loadCodeSyncFromMap(codeFiles){
    let code = "";
    for (let file of codeFiles) {
      if (file.filename.endsWith(".js"))
        code += "\<i>\<\/i>\<script>"+file.content+"\<\/script>";
      else if (file.filename.endsWith(".html"))
        code += file.content;
      // else ignore
    }
    this.loadHTMLSync(code);
  }
}

//customElements.define("code-runner", CodeRunner);
//const myRunner = document.querySelector("code-runner");
//myRunner.loadScriptSync("console.log(performance.now());");
//</script>

