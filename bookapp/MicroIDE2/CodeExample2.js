//todo make this better
function getSlotContent(slot) {
  return slot.assignedNodes().map(node => node.textContent).join("");
}

import {SlottableMixin} from '../../src/slot/SlottableMixin.js';

export class CodeMirrorBox extends SlottableMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/codemirror.css">
      <style> b{ display: none; }</style>
      <div></div>
      <b><slot></slot></b>`;

    this._slot = this.shadowRoot.children[3].children[0];
    this._codemirror = CodeMirror(this.shadowRoot.children[2], {mode: "javascript"});
    this._codemirror.on("change", data => this._dispatchChange(data));
  }

  _dispatchChange(data) {
    const id = this.getAttribute("filename");
    this.dispatchEvent(new CustomEvent("code-mirror-box-change", {bubbles: true, detail: {id, data}}));
  }

  getContent(){
    return this._codemirror.getValue();
  }

  slotchangedCallback(name, newValue, oldValue) {
    if (name !== "")
      return;
    newValue = getSlotContent(this._slot);
    if (this._codemirror.getValue() === newValue)
      return;
    this._codemirror.setValue(newValue);
    // debugger;
  }
}

//src wins over content+fallback-filename
export class CodeFile extends SlottableMixin(HTMLElement) {

  static get observedAttributes() {
    return ["src", "fallback-filename"];
  }

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<style>*{display: none} ::slotted(*){display: none}</style><slot></slot>";
    this._slot = this.shadowRoot.children[1];
    this._data = {};
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === "src") {
      const file = await fetch(newValue);
      const content = await file.getContent();
      this.alertIfChanged(newValue, content);
    } else if (name === "fallback-filename") {
      if (this.hasAttribute("src"))     //ignore if "src" is set
        return;
      this.alertIfChanged(newValue, getSlotContent(this._slot));
    }
  }

  slotchangedCallback(name, newValue, oldValue) {
    if (this.hasAttribute("src"))     //ignore if "src" is set
      return;
    this.alertIfChanged(this.getAttribute("fallback-filename"), getSlotContent(this._slot));
  }

  alertIfChanged(filename, content) {
    if (this._data.filename === filename && this._data.content === content)
      return;
    this._data = {filename, content};
    this.dispatchEvent(new CustomEvent("code-file-changed", {bubbles: true, detail: this._data}));
  }

  getDataObj() {
    const filetype = this._data.filename.substr(this._data.filename.lastIndexOf("."));
    return Object.assign({filetype}, this._data);
  }
}


//component

//input: several files, html and js and css
//input: both {filename, content}

//the html file is used as entrypoint.
//all the other files are loaded from that entrypoint.

//make convertedFiles:
//regex out the filename of the input files and then add a different header? can I just replace the https:// with cache://??
//Or should I make a new name at the end of it? And for this to work, do I need serviceworker? Or can I just do it with iframe object-url?

//every time the files changes, they are converted into a new file where all the references to the other files are renamed.
//this ensures that if you change one file in the group, the others will update.

//todo start with the loading of the files

//every time the files are updated, then the iframe window refreshes.

