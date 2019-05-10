# Pattern: RecursiveSelected

Once RecursiveElements gets nested, they can form big family trees.
These family trees exists in the lightDOM, and even though all the elements are the same type,
the nodes in the family trees form HelicopterParentChild relationships with each other.
This means that the same element must contain the functionality of the parent and the functionality
of the child in the relationship.

The RecursiveSelected pattern controls a `selected` attribute *within* such a lightDOM family tree. 
The RecursiveSelected pattern stipulates that only one member of the family tree can be
`selected` at any one time. The pattern therefore ensures that whenever a RecursiveElement is 
`selected`, the newly `selected` element will notify the rest of the family tree and cause any 
previously `selected` element to remove its `selected` attribute.

## Notes on implementation

The strategy is:

1. One source of truth. The lightDOM. The reason for this choice is that reusable web components 
   should be as stateless as possible. But, stateless here mainly apply to the shadowDOM;
   reusable elements can be given and persist state in the lightDOM, as attribute values.
   
2. The attributes in the lightDOM can be set from many angles. 
   1. The author of the lightDOM can set them at startup. 
   2. Scripts in the lightDOM can alter them at run-time. 
   3. The lifecycle callbacks and other reactive methods in the web component itself can alter them. 
   
   It is difficult to prevent race conditions or inefficient processing of attributes on RecursiveElements.

3. To make the processing of attributes efficient at startup, the setting of the initial `selected` 
   element is delegated and batched to the root node from an initial `slotCallback()`. 
   This ensures that no branch of recursive elements can be created with multiple `selected` nodes.
   
4. When the attribute is set from a lightDOM script, it will always change the element node attribute
   state and trigger a process to remove any previously `selected` element in the same family tree.
   
5. The RecursiveSelected pattern does not need the BackstopAttribute pattern because there is no
   reaction triggered when an element is un-`selected`.
   
## Example: TreeNodes with a recursive `selected` attribute

In this example we set up a tree of family nodes.
Only one node in this tree can be selected at any one time.
The `selected` element has a red border.

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
//        if (newValue !== null)
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
