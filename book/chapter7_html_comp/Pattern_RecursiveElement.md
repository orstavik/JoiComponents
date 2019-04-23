# Pattern: RecursiveElement

This pattern describes an element type whose instances can be nested in the lightDOM.
The RecursiveElement is its own HelicopterParent, and its own HelicopterChild:
they form parent-child pairs with each other.

The RecursiveElement works by setting an attribute on itself, and then updating the same 
attribute on parent and/or child elements of the same type (depending on the value of the attribute).
The elements above and/or below will then be responsible for alerting their ancestors/descendants of
the same type. Thus, the elements are nested in the lightDOM, and then the behavior of one or more
of their attributes cascades from parent to child recursively.

## Example: TreeNodes with a recursive `open` attribute

In this example we use an attribute `open` to hide or show the content of an element.
The tree-nodes can be nested inside each other like nodes in a tree, and when you:
 * add the `open` attribute on a node, it will show its content and also ensures that its parentNode
   is `open` too, if that node is also a tree-node.
 * remove the `open` attribute, it will hide its content and also ensure that all its tree-node 
   childNodes are also *not* `open`.


```html
<script>
  class TreeNode extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          span {
            cursor: pointer;
            display: inline-block;
            transform: rotate(45deg);
            transition: 300ms ease-in-out;
          }
          :host([open]) span {
            transform: rotate(0deg);
          }
          slot {
            display: none;
          }
          :host([open]) slot {
            display: inline;
          }
        </style>
        <span>+</span>
        <slot></slot>`;
      this.shadowRoot.querySelector("span").addEventListener("click", this.onClick.bind(this));
    }

    static get observedAttributes() {
      return ["open"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "open")
        newValue === null ? this.closeChildren() : this.openParent();
    }

    closeChildren() {
      for (let child of this.children) {
        if (child.tagName === "TREE-NODE" && child.hasAttribute("open"))
          child.removeAttribute("open");
      }
    }

    openParent() {
      const parent = this.parentNode;
      if (parent.tagName && parent.tagName === "TREE-NODE" && !parent.hasAttribute("open"))
        parent.setAttribute("open", "");
    }

    onClick(e) {
      e.stopPropagation();
      this.hasAttribute("open") ? this.removeAttribute("open") : this.setAttribute("open", "");
    }
  }

  customElements.define("tree-node", TreeNode);
</script>

<style>
  tree-node {
    border: 2px solid grey;
    padding: 10px;
  }
</style>

<tree-node>
  <tree-node>hello world</tree-node>
  <tree-node>
    <tree-node>hello sunshine</tree-node>
    <tree-node>hello blue skies</tree-node>
  </tree-node>
</tree-node>
```

## References
 
 *  