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
       this.shadowRoot.children[0].addEventListener("click", this.onClick.bind(this));  //[1]
      this.__expectedSelect = undefined;                                               //[1a]
      this.__isTriggered = false;                                                      //[1b]
      this.__isSetup = false;                                                          //[1c]
    }
 
    slotCallback(slot) {                                                               //[2]
      this.__isSetup = true;                                                           //[2a]
      this.getRootTreeNode().syncAtBranchChange();                                     //[3, 3a]
    }

    static get observedAttributes() {
      return ["selected"];
    }

    attributeChangedCallback(name, oldValue, newValue) {                               //[5]
      if (name === "selected") {
        if (!this.__isSetup)         //the initial callbacks are skipped in favor of equivalent cleanup based on slotCallback
          return;
        if (newValue === this.__expectedSelect) {
          this.__expectedSelect = undefined;
          return;
        }
        this.unSelectAllOthers(this);
      }
    }

  unSelectAllOthers(skip) {                                                           
      let selecteds = this.getRootTreeNode().querySelectorAll("tree-node[selected]");   //[4]
      skip = skip || selecteds[selecteds.length - 1];                                   //[4a]
      for (let selected of selecteds) {                                      
        if (selected !== skip) {
          selected.__expectedSelect = null;                                             //[4b]
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

    syncAtBranchChange() {                                                              //[3a]
      if (this.__isTriggered)
        return;
      this.__isTriggered = true;
      Promise.resolve().then(() => {
        this.__isTriggered = false;
        this.unSelectAllOthers();                                                       //[4]
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

1. Event listener for click event ([0] corresponds to `<slot>` element inside the shadowDOM <tree-node> element).<br>
  a. `this.__expectedSelect` - is used in `attributeChangedCallback()` to protect against infinitive loop function calls when removing extra `selected` attributes.<br>
  b. `this.__isTriggered` - is added to call the 'unSelectAllOthers()' function (which removes extra 'select' attributes) only once after the first 'slotCallback()` is activated.  This is necessary to avoid calling it every time 'slotCallback()` is activated. In order to start deleting unnecessary attributes, we have added ''Promise.resolve()'' which guarantees that deletion of attributes will start after the completion of the DOM <br>
  c. ` this.__isSetup` - is used to ensure that `attributeChangedCallback()` doesn't do anything before `slotCallback`()` triggers. This is because the user can add attributes to the lightDOM manually, that cause `attributeChangedCallback`()` in the process of building the DOM.   
2. `slotCallback()` triggers whenever elements are placed inside <slot> of the element inside the shadowDOM of the <tree-node> element. <br>
  a. As mentioned earlier, `attributeChangedCallback()` works earlier than `slotCallback` and therefore `this.__isSetup = true` here.
3. In order to remove unnecessary selected attributes the function `getRootTreeNode()` is called, which returns the root element of the branch.<br>
 a. Then the `syncAtBranchChange()` function is called, which calls `unSelectAllOthers()` with delay. This delay is necessary for the function to be called after the end of DOM construction, when all the elements will be placed in slots. <br>
4. `unSelectAllOthers()` selects all `<tree-node>` elements inside the root element containing the `selected` attribute. <br>
 a. In addition, the item that will not be changed is selected (the last one in the list).
 b. In order to avoid an infinite loop of call `attributeChangedCallback`, which is called when deleting an attribute, selected.__expectedSelect = null. Simply put, when deleting the observed attribute, newValue = null, and selected.__expectedSelect also, and it means that when adding a new attribute, a function will be called that will delete the old one. And when deleting, no function will be called.
5. 'attributeChangedCallback()' will be called each time the selected attribute is added or removed.

## References
 
 *  [MDN: DOMContent Loaded event](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
