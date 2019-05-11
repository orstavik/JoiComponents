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
      this.addEventListener("click", this.onClick.bind(this));                              //[2]
      this.__isTriggered = false;                                                           //[3]
      this.__isSetup = false;                                                               //[4]
    }

    static get observedAttributes() {
      return ["open"];
    }

    slotCallback(slot) {
      this.__isSetup = true;                                                                //[4]
      this.getRootTreeNode().syncAtBranchChange();                                          //[3]
    }

    attributeChangedCallback(name, oldValue, newValue) { 
      if (name === "open") {
        if (this.__isSetup)                                                                 //[4]
          newValue === null ? this.closeChildren() : this.openParent();                     //[5][6]
      }
    }

    getRootTreeNode() {                                                                     //[3]
      let parent = this;
      while (parent.parentNode && parent.parentNode.tagName && parent.parentNode.tagName === "TREE-NODE")
        parent = parent.parentNode;
      return parent;
    }

    closeChildren() {                                                                       //[5]
      if (this.children)
        for (let child of this.children) {
          if (child.tagName === "TREE-NODE" && child.hasAttribute("open"))
            child.removeAttribute("open");
        }
    }

    openParent() {                                                                          //[6]
      const p = this.parentNode;
      if (p.tagName && p.tagName === "TREE-NODE" && !p.hasAttribute("open"))
        p.setAttribute("open", "");
    }

    syncAtBranchChange() {                                                                  //[3]
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

    onClick(e) {                                                                            //[2]
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

<tree-node id="root">book                                                                  //[1]
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
    document.querySelector("tree-node#a").appendChild(clone);                             //[7]
  }, 3000);
</script>
```
1. Lets create the family tree with the same type of the elements, the nodes in the family trees form
    `HelicopterParentChild` relationships with each other.
2. Event listener for click event on the host node. The `onClick` method simply switches on or off the
   `open` attribute.
3. `syncAtBranchChange()` is a method that is called when a tree of `<tree-node>`s is created or mutated.
   It is triggered by `slotCallback(...)`. As several child `<tree-node>`s might be `open` at when the tree
   is created or mutated, the `syncAtBranchChange()` is only called on the root `<tree-node>` and will open
   the ancestors of each element with `open` attribute. To make the method more efficient, the calls is run 
   only once per frame of `slotCallback(...)`s, enforced by `this.__isTriggered`.
4.  ` this.__isSetup` ensures that `attributeChangedCallback()` is deactivated until `slotCallback(...)`
   is run for the first time. `attributeChangedCallback()` should be deactivated at startup because the 
   `<tree-node>` elements are upgraded sequentially, and will all trigger inefficiently if theseveral `<tree-node>`s
   are marked as `open` in the lightDOM by the author. Depending on the 'NewValue' value, `closeChildren()` or `openParent()`
   will be called.
5. If the `open` attribute is removed on the ancestor's node, the `closeChildren()` function will remove the `open` attribute from *all*      children's nodes of this ancestor.
6. If the `open` attribute is set on the child node, it will be set on the ancestor's node.
7. In order to make an endless recursion, clone the root element and insert it as a child when opening `<tree-node>` with `a` id value.

## References
  * [MDN: cloneNode()](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) 
