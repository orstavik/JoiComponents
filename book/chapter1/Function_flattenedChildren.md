# Function: `.flattenNodes(nodes)`

For DOM nodes that do not have a `<slot>` child, `.flattenNodes` equals `.childNodes`.
As `<slot>`s are only used inside shadowDOMs, 
this applies by default to all nodes in the main, top-level DOM.

For DOM nodes that a) are *inside* a ShadowDOM and b) has a `<slot>` child,
the `.flattenNodes` replaces all `slot` nodes in a list of nodes
with their `.assignedNodes()`, recursively.

The `flattenNodes(nodes)` function below returns the flattened list of childNodes
for any DOM node, anywhere.

```javascript
function flattenNodes(nodes) {
  return pushAllAssigned(nodes, []);
}

function pushAllAssigned(nodes, result) {
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    if (n.tagName === "SLOT")  //[1]
      pushAllAssigned(n.assignedNodes(), result);
    else
      result.push(n);
  }
  return result;
}
```
1. In the shadowDOM polyfill, `<slot>` nodes still remain type `HTMLUnknownElement`.
Therefore, `node instanceof HTMLSlotElement` does not work, and 
instead we check the `node.tagName === "SLOT"`.

## References
 * [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 
