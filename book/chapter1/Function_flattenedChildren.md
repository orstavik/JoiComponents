# Function: `.flattenedChildren(el)`

For DOM nodes that do not have a `<slot>` child, `.flattenedChildren` equals `.childNodes`.
As `<slot>`s are only used inside shadowDOMs, 
this applies by default to all nodes in the main, top-level DOM.

For DOM nodes that a) are *inside* a ShadowDOM and b) has a `<slot>` child,
the `.flattenedChildren` needs to be resolved by replacing all `slot` nodes 
with their `.assignedNodes()`, recursively.

The `flattenedChildren(n)` function below returns the flattened list of childNodes
for any DOM node.

```javascript
function flattenedChildren(n) {
  return pushAllAssigned(n.children, []);
}

function pushAllAssigned(nodes, result){
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (node.tagName === "SLOT")               //[1]
      pushAllAssigned(node.assignedNodes(), result);
    else 
      result.push(node);
  }
  return result;
}
```
1. When you polyfill, `<slot>` nodes still remain type `HTMLUnknownElement`.
Therefore, `if(node instanceof HTMLSlotElement)` does not work, and 
instead we check the `.tagName === "SLOT"`.

## Opinionated advice for working with shadowDOM
1. Avoid "wrap-to-chain-named-slots". Use empty-name slot if you can. 

2. Avoid "multi-sourced-slots". 
This means that you should try to avoid giving a slot siblings if it placed as a child
of another custom element. 

3. Be aware that when you dynamically add or remove `<slot>` elements 
inside the shadowDOM, this might disturb event listeners you have attacted to the slot element 
for slotchange events (since these events are do not bubble in Chrome nor Safari). 
If you listen for slotchange events, you will likely encounter problems when you update or alter the shadowDOM.
If you want to update the shadowDOM, you should employ the ChildrenChangedMixin.

4. Remember that only direct children of the `host` element are directly assigned.
Deeper descendants of the `host` element will be slotted via the child.

5. Avoid altering the assignedNodes directly. If you need to alter the assignedNodes, 
use the HelicopterParentChild pattern.

6. Anticipate chained `<slot>`s. The more reusable your elements are, 
the more likely their slots will be chained with others.

7. Use the `flattenedChildren(el)` function to access the "actual" list of an element.
Use SlotchangeMixin or ChildrenChangedMixin to observe changes of assignable nodes and slots.

8. When you have chained `<slot>`s, try to manipulate the DOM at the top most level.

## References
 * [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 
