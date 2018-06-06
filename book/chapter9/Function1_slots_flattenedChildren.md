# Function: `.flattenedChildren(el)`

For DOM nodes that do not have any `<slot>`s amongst its children, 
the `.flattenedChildren` equals `.children`.
As `<slot>`s are only used inside shadowDOMs, 
this applies by default to all nodes in the main, top-level DOM.
However, if an element is a) *inside* a ShadowDOM and b) has a `<slot>` child,
the `.flattenedChildren` needs to be resolved by replacing all `slot` nodes 
with their `.assignedNodes()`.

```javascript
function flattenedChildren(el) {
  let res = [];
  for (let i = 0; i < el.children.length; i++) {
    let child = el.children[i];
    if (child.constructor.name === "HTMLSlotElement") {
      let assignedNodes = child.assignedNodes();
      for (let j = 0; j < assignedNodes.length; j++)
        res.push(assignedNodes[j]);
    } else {
      res.push(child);
    }
  }
  return res;
}
```
This function will function for all elements whether or not they have `<slot>` children.

## Opinions

HTML composition using `<slot>` is complex and powerful.
To get the most power you must minimize complexity.
Here is my advice to minimize complexity:

1. Avoid dynamically adding, removing or altering `<slot>` elements inside the shadowDOM. 
As far as you can, let `<slot>` elements be a static fixture of your custom element.
While it is possible to dynamically alter `<slot>` elements, 
it makes for super complex code for usually little gain.

2. Be careful with a slot's siblings.
The node that is parent for both the slot and its siblings, 
will have multiple document sources for its children.
 
2. If you can, attach `<slot>` elements directly to the shadowRoot.
Do not wrap the `<slot>` in a div if all you need to do is add `:host {display: block;}` 
to the style of the customElement.
Familiarize yourself with `this.shadowRoot` as the root node of the shadowDOM.
Todo: Check if this is good advice.. 

3. The `slot` attribute must be added to the children of the host element.
Adding named slots to grandchildren of a host-element will create confusion as to which 
element is the attended recipient of the node with the named slot attribute.
Todo check if it is possible to add `slot` Do not add the to grandchildren

4. In the flattened DOM (and view in the browser), slotted or normal nodes appear identical.
This often means that slotted and normal nodes also require equal treatment by the custom element.
(cf. HelicopterParentChild example).

5. Anticipate chained `<slot>`s. `<slot>` elements can be chained (cf. `MarriedManBucketList`). 
If your element is truly reusable, this will be needed and occur more frequently than you might think. 

6. If you have chained `<slot>`s, 
try to keep such dynamic manipulation of the DOM from JS to the top-level, main document only.
This will keep the template inside the shadowDOM more static and simpler to relate to.
Do not attempt to add same-level slots as it grows (cf. `MarriedManBucketList`). 

7. If your custom element needs to react to changes of its `.flattenedChildren`,
use the SlotChangeMixin.

## References
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom
 * [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 
