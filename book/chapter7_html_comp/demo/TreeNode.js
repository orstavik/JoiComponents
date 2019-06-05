const templ = document.createElement("template");
templ.innerHTML = `<style>
span { display: inline-block; }
:host(:not([open])) span { transform: rotate(-90deg); }
</style>
<slot name='prefix'><span>▼</span></slot>
<slot></slot>`;

import {SlotchangeMixin} from "https://unpkg.com/joicomponents@1.2.27/src/slot/SlotChildMixin.js";

class TreeNode extends SlotchangeMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(templ.content.cloneNode(true));
    this.shadowRoot.children[1].addEventListener("click", this.onPrefixClick.bind(this));
    this.addEventListener("click", this.onClick.bind(this));
    this.__isTriggered = false;
    this.__isSetup = false;
  }

  static get observedAttributes() {
    return ["open", "selected"];
  }

  slotCallback(slot) {
    this.__isSetup = true;
    this.getRootTreeNode().syncAtBranchChange();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "open") {
      if (this.__isSetup)
        newValue === null ? this.closeChildren() : this.openParent();
    } else if (name === "selected") {
      if (this.__isSetup && newValue !== null)
        this.unSelectAllOthers(this);                                                 //[4]
    }
  }

  unSelectAllOthers(skip) {                                                           //[4]
    let selecteds = this.getRootTreeNode().querySelectorAll("tree-node[selected]");
    skip = skip || selecteds[selecteds.length - 1];
    this !== skip && this.removeAttribute("selected");
    for (let selected of selecteds)
      selected !== skip && selected.removeAttribute("selected")
  }

  getRootTreeNode() {
    let parent = this;
    while (parent.parentNode && parent.parentNode.tagName && parent.parentNode.tagName === "TREE-NODE")
      parent = parent.parentNode;
    return parent;
  }

  closeChildren() {
    if (this.children)
      for (let child of this.children) {
        if (child.tagName === "TREE-NODE" && child.hasAttribute("open"))
          child.removeAttribute("open");
      }
  }

  openParent() {
    const p = this.parentNode;
    if (p.tagName && p.tagName === "TREE-NODE" && !p.hasAttribute("open"))
      p.setAttribute("open", "");
  }

  syncAtBranchChange() {                                                              //[2]
    if (this.__isTriggered)
      return;
    this.__isTriggered = true;
    Promise.resolve().then(() => {
      this.__isTriggered = false;
      this.unSelectAllOthers();                                                       //[4]
      const opens = this.querySelectorAll("tree-node[open]");
      for (let i = 0; i < opens.length; i++) {
        let open = opens[i];
        open.openParent();
      }
    });
  }

  onPrefixClick(e) {
    e.stopPropagation();
    this.hasAttribute("open") ?
      this.removeAttribute("open") :
      this.setAttribute("open", "");
  }

  onClick(e) {
    e.stopPropagation();
    this.hasAttribute("selected") ?
      this.removeAttribute("selected") :
      this.setAttribute("selected", "");
  }
}

customElements.define("tree-node", TreeNode);