# Pattern: RecursiveElement 1

This pattern describes an element type whose instances can be nested in the lightDOM.
The RecursiveElement is its own HelicopterParent, and its own HelicopterChild:
they form parent-child pairs with each other.

The RecursiveElement works by setting an attribute on itself, and then updating the same 
attribute on parent and/or child elements of the same type (depending on the value of the attribute).
The elements above and/or below will then be responsible for alerting their ancestors/descendants of
the same type. Thus, the elements are nested in the lightDOM, and then the behavior of one or more
of their attributes cascades from parent to child recursively.

This selected pattern is much harder than one presupposes. The strategy is:
1. One source of truth. The DOM. The reason for this choice is that reuseable web components should be as stateless as possible. This means that they should not persist state in the shadowDom. But they can and do persist state in the lightDOM, as attribute values on the host node.
2. Attributes in the lightDOM can be controlled from many angles. A) The author of the lightDOM can set them at startup. B) Scripts in the lightDOM can alter them at run-time. C) The lifecycle callbacks and other reactive methods in the web component itself can alter them. To ensure that there are no race conditions or highly inefficient processes when the components do not know their surrounding is a difficult cognitive balance act.
3. The strategy when tackling the lightDom state at startup is to batch all calls on the root node after the initial slotchangeCallback. To ensure that no branch of tree-nodes are created with multiple selected nodes, the root node of each newly sprouted tree is pruned to contain only a single selected element, the last (or first?) queryselector("[selected]").
4. When the attribute is set from a lightDOM script, it always changes the element and immediately trigger a process to remove any previously selected element under the same ancestor root tree-node.
5. The act of *removing* the other previously selected attribute in the same tree from within one of the tree-nodes themselves, that is the backstop preventing an infinite loop. The tree-node calls a custom function that blocks the immediate attributeChangedCallback that otherwise would ensue on that element.
*. The backstop pattern. It can be implemented with only a boolean skipNextCall = true property. But, it feels better to use the assumed value of the attribute as skipping check instead. I don't know why, maybe I'm wrong, but it feels a bit safer. But, I might be wrong. I should make an evem simpler pattern here: AttributeBackstop.
Maybe boolean is best. I can illustrate both. And then maybe the alternative seems clear. Thinking longer on the problem, the boolean alternative seems less error-prone.


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