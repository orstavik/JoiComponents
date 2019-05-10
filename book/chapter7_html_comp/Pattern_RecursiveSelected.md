# Pattern: RecursiveSelected

Once RecursiveElements gets nested, they can form big trees of family relationships.


This pattern describes an element type whose instances can be nested in the lightDOM.
The RecursiveElement is its own HelicopterParent, and its own HelicopterChild:
they form parent-child pairs with each other.

The RecursiveElement works by setting an attribute on itself, and then updating the same 
attribute on parent and/or child elements of the same type (depending on the value of the attribute).
The elements above and/or below will then be responsible for alerting their ancestors/descendants of
the same type. Thus, the elements are nested in the lightDOM, and then the behavior of one or more
of their attributes cascades from parent to child recursively.

This selected pattern is much harder than one presupposes. The strategy is:

1. One source of truth. The DOM. The reason for this choice is that reusable web components should 
   be as stateless as possible. This means that they should not persist state in the shadowDom. 
   But they can and do persist state in the lightDOM, as attribute values on the host node.
   
2. Attributes in the lightDOM can be controlled from many angles. 
   1. The author of the lightDOM can set them at startup. 
   2. Scripts in the lightDOM can alter them at run-time. 
   3. The lifecycle callbacks and other reactive methods in the web component itself can alter them. 
   To ensure that there are no race conditions or highly inefficient processes when the components 
   do not know their surrounding is a difficult cognitive balance act.

3. The strategy when tackling the lightDom state at startup is to batch all calls on the root node after the initial slotchangeCallback. To ensure that no branch of tree-nodes are created with multiple selected nodes, the root node of each newly sprouted tree is pruned to contain only a single selected element, the last (or first?) queryselector("[selected]").
4. When the attribute is set from a lightDOM script, it always changes the element and immediately trigger a process to remove any previously selected element under the same ancestor root tree-node.
5. The act of *removing* the other previously selected attribute in the same tree from within one of the tree-nodes themselves, that is the backstop preventing an infinite loop. The tree-node calls a custom function that blocks the immediate attributeChangedCallback that otherwise would ensue on that element.


## Example: TreeNodes with a recursive `open` attribute

In this example we use an attribute `open` to hide or show the content of an element.
The tree-nodes can be nested inside each other like nodes in a tree, and when you:
 * add the `open` attribute on a node, it will show its content and also ensures that its parentNode
   is `open` too, if that node is also a tree-node.
 * remove the `open` attribute, it will hide its content and also ensure that all its tree-node 
   childNodes are also *not* `open`.


```html
<script type="module">

  import {SlotchangeMixin} from "https://unpkg.com/joicomponents@1.2.27/src/slot/SlotChildMixin.js";

  class TreeNode extends SlotchangeMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<slot></slot>";
      this.shadowRoot.addEventListener("click", this.onClick.bind(this));              //[1]
      this.__expectedSelect = undefined;                                               //[2]
      this.__isTriggered = false;                                                      //[3]
      this.__isSetup = false;                                                          //[4]
    }
 
    slotCallback(slot) {                                                               
      this.__isSetup = true;                                                           //[4]
      this.getRootTreeNode().syncAtBranchChange();                                     //[3]
    }

    static get observedAttributes() {
      return ["selected"];
    }

    attributeChangedCallback(name, oldValue, newValue) {                               
      if (name === "selected") {
        if (!this.__isSetup)         //the initial callbacks are skipped in favor of equivalent cleanup based on slotCallback
          return;
        if (newValue === this.__expectedSelect) {                                      //[2]
          this.__expectedSelect = undefined;                                           //[2]
          return;
        }
        this.unSelectAllOthers(this);                                                   //[5]
      }
    }

    unSelectAllOthers(skip) {                                                           //[5]
      let selecteds = this.getRootTreeNode().querySelectorAll("tree-node[selected]");   
      skip = skip || selecteds[selecteds.length - 1];                                   
      for (let selected of selecteds) {                                      
        if (selected !== skip) {
          selected.__expectedSelect = null;                                             //[2]
          selected.removeAttribute("selected")
        }
      }
    }

    getRootTreeNode() {                                                                 //[3]
      let parent = this;
      while (parent.parentNode && parent.parentNode.tagName && parent.parentNode.tagName === "TREE-NODE")
        parent = parent.parentNode;
      return parent;
    }

    onClick(e) {                                                                        //[1]
      e.stopPropagation();
      this.hasAttribute("selected") ?
        this.removeAttribute("selected") :
        this.setAttribute("selected", "");
    }

    syncAtBranchChange() {                                                              //[3]
      if (this.__isTriggered)
        return;
      this.__isTriggered = true;
      Promise.resolve().then(() => {
        this.__isTriggered = false;
        this.unSelectAllOthers();                                                       //[5]
      });
    }
  }

  customElements.define("tree-node", TreeNode);
</script>

<style>
  tree-node {
    display: block;
    padding-left: 10px
  }
  tree-node[selected] {
    border: 2px solid red;
  }
</style>

<tree-node>
  <tree-node selected>book
    <tree-node>
      chapter 1
      <tree-node>
        chapter 1.1
        <tree-node selected>chapter 1.1.1</tree-node>
        <tree-node>chapter 1.1.2</tree-node>
      </tree-node>
      <tree-node>chapter 1.2</tree-node>
    </tree-node>
    <tree-node>
      chapter 2
      <tree-node>chapter 2.1</tree-node>
      <tree-node selected>chapter 2.2</tree-node>
    </tree-node>
  </tree-node>
</tree-node>
```

1. Event listener for `click` event on the `shadowRoot`.
   The `onClick` method simply switches on or off the `selected` attribute.
2. `this.__expectedSelect`. This BackstopAttribute is used to prevent `attributeChangedCallback()` 
   from going into infinitive loops when the elements alter the `selected` attributes on each other.
3. `syncAtBranchChange()` is a method that is called when a tree of `<tree-node>`s is created
   or mutated. It is triggered by `slotCallback(...)` at startup, and at later points during the
   elements life cycle. 
   To make the method more efficient, the `syncAtBranchChange()` is only called on the root 
   `<tree-node>`, and as several child `<tree-node>`s might trigger it, the `this.__isTriggered`
   property of the `<tree-node>` ensures that it is only executed once per frame.
4. ` this.__isSetup` ensures that `attributeChangedCallback()` is deactivated until `slotCallback()`
   is run for the first time. `attributeChangedCallback()` should be deactivated at startup because
   the `<tree-node>` elements are upgraded sequentially, and will all trigger inefficiently if the
   several `<tree-node>`s are marked as `selected` in the lightDOM by the author.
5. `unSelectAllOthers()` finds all `<tree-node selected>` elements from the root `<tree-node>` element
   and then unselects them. If there are more than one `selected` `<tree-node>` at the beginning,
   it will `unSelectAllOthers()` except the last one. When one `<tree-node>` becomes `selected`,
   the method will `unSelectAllOthers()`, but skip the one that has just been `selected`.

## References
 
 *  [MDN: DOMContent Loaded event](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
