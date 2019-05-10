# Pattern: RecursiveOpen

In a family tree of RecursiveElements, it can be useful to ensure that the state of a parent
node's attribute is in sync with the same attribute of their their child nodes, and vice versa.

The RecursiveOpen pattern defines such an attribute. If `open` is set on a node, then
the family tree of nodes will ensure that all the ancestor nodes of that node within the family
(ie. of the same element type) is also `open`ed. Similarly, if a node is closed (the `open` 
attribute removed), then the family will ensure that all its children also have their `open` 
attribute removed.

The `open` attribute can be implemented using simple recursion. To `open` all ancestors within the
family, the node simply have to `open` its parent, and the parent will update its parent, etc., all
the way up to the root family ancestor.
Similarly, when a node removes `open` from one of its children, the same recursive logic will ensure 
that all descendants within the family are closed too.

## Example: TreeNodes with a recursive `open` attribute

In this example we use an attribute `open` to hide or show the content of an element.
The `<tree-node>`s can be nested inside each other like nodes in a tree.
When you:
 * add the `open` attribute on a node, it will ensure that all its ancestor `<tree-node>`s
   are also `open`.
   opshow its content and also ensures that its parentNode
   is `open` too, if that node is also a tree-node.
 * remove the `open` attribute, it will ensure that all its children `<tree-node>`s are also
   closed (is in `:not([open])`).
   
To hide and show the nodes depending on their `open` and not `open` state,
a couple of CSS rules are added.

```html
<script type="module">

  import {SlotchangeMixin} from "https://unpkg.com/joicomponents@1.2.27/src/slot/SlotChildMixin.js";

  class TreeNode extends SlotchangeMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<slot></slot>";
      this.addEventListener("click", this.onClick.bind(this));
      this.__isTriggered = false;
      this.__isSetup = false;
    }

    static get observedAttributes() {
      return ["open"];
    }

    slotCallback(slot) {
      this.__isSetup = true;
      this.getRootTreeNode().syncAtBranchChange();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "open") {
        if (this.__isSetup)
          newValue === null ? this.closeChildren() : this.openParent();
      }
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

    syncAtBranchChange() {                                                             
      if (this.__isTriggered)
        return;
      this.__isTriggered = true;
      Promise.resolve().then(() => {
        this.__isTriggered = false;
        const opens = this.querySelectorAll("tree-node[open]");
        for (let i = 0; i < opens.length; i++) {
          let open = opens[i];
          open.openParent();
        }
      });
    }

    onClick(e) {
      e.stopPropagation();
      this.hasAttribute("open") ?
        this.removeAttribute("open") :
        this.setAttribute("open", "");
    }
  }

  customElements.define("tree-node", TreeNode);
</script>

<style>
  tree-node {
    display: block;
    padding-left: 10px;
  }
  tree-node[open] {
    color: green;
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
    <tree-node>
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
 
 *  