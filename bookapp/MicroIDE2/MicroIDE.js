import hyperHTML from 'https://cdn.jsdelivr.net/npm/hyperhtml@2.17.0/esm.js';
import {SlotchangeMixin} from '../../src/slot/SlotchangeMixin.js';

//this is a micro code editor
export class MicroCodeEditor extends SlotchangeMixin(HTMLElement) {

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.html = hyperHTML.bind(this.shadowRoot);
    this._staticCodeFiles = [];
    this.addEventListener("code-file-changed", () => this.render());
    this.shadowRoot.addEventListener("code-mirror-box-change", () => this.runCode());
  }

  slotchangedCallback(name, newChildren, oldChildren) {
    this._staticCodeFiles = newChildren.filter(node => node.tagName && node.tagName === "CODE-FILE");
    this.render();
  }

  render() {
    this.html`
      <tabs-tabs>
        ${this._staticCodeFiles.map(child => this.renderCodeFile(child))}
        <tab-tab><code-runner></code-runner></tab-tab>
      </tabs-tabs>`;
  }

  renderCodeFile(codeFile) {
    const {filename, filetype, content} = codeFile.getDataObj();
    return hyperHTML.wire(codeFile)`<tab-tab name="${filename}"><code-mirror-box filename="${filename}">${content}</code-mirror-box></tab-tab>`
  }

  runCode() {
    let codes = [];
    let editors = this.shadowRoot.querySelectorAll("code-mirror-box");
    for (let i = 0; i < editors.length; i++) {
      let editor = editors[i];
      codes.push({filename: editor.getAttribute("filename"), content: editor.getContent()});
    }
    if (codes.length)
      this.shadowRoot.querySelector("code-runner").loadCodeSyncFromMap(codes);
  }
}