# WebComp: TreeNode

The TreeNode web component in this chapter implements both the RecursiveSelected and RecursiveOpen pattern. The resulting TreeNode component can be used in many different context for graphs such as:

1. JSON objects
2. chapters in a book

TreeNodes that have other TreeNode children are prefixed by a triangle. When the TreeNode is open, the triangle points down, when it is closed, the triangle points right.

The TreeNode has a StubbornAttribute called `_empty`: whenever the TreeNode has no slotted child TreeNodes, it is `_empty` and there is no point showing a triangle to open or close it. Thus, when the TreeNode is marked `_empty`, the prefix is hidden. And the TreeNode marks itself as `_empty` when it has no children.

By default, only leaf TreeNodes are selectable. But, it is possible to add an attribute `selectable` to a parent TreeNode so as to select it. To open such a TreeNode that is selectable and also a parent of other TreeNodes, the prefix triangle must be clicked explicitly.   

The TreeNode can also alter the prefix':
1. `content` text : `--tree-node-prefix` (default `"▼"`), 
2. `transform` property in closed state : `--tree-node-prefix-transform` (default `rotate(-45deg)`).

## Implementation: TreeNode

```javascript
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
```

## Demo

```html
<script type="module" src="TreeNode.js"></script>

<style>
  tree-node {
    display: block;
    padding-left: 10px;
  }
  tree-node[open] {
    color: green;
  }
  tree-node[selected] {
    font-style: italic;
  }
  tree-node:not([selected]) {
    font-style: normal;
  }
  tree-node:not([open]) {
    color: red;
    display: none;
  }
  tree-node#root,
  tree-node[open] > tree-node:not([open]) {
    display: block;
  }
</style>

<tree-node id="root">book
  <tree-node>
    chapter 1
    <tree-node selected>
      chapter 1.1
      <tree-node open>chapter 1.1.1</tree-node>
      <tree-node>chapter 1.1.2</tree-node>
    </tree-node>
    <tree-node id="a">chapter 1.2</tree-node>
  </tree-node>

  <tree-node>
    chapter 2
    <tree-node open>chapter 2.1</tree-node>
    <tree-node>chapter 2.2</tree-node>
  </tree-node>
</tree-node>

<script>
  const clone = document.querySelector("tree-node").cloneNode(true);
  clone.id = undefined;
  setTimeout(function () {
    document.querySelector("tree-node#a").appendChild(clone);
  }, 3000);
</script>
```

## References
