/**
 * @param nodes
 * @returns {Array} a flattened array of nodes where all slot elements are replaced by their .assignedNodes() list.
 */
export function flattenNodes(nodes) {
  return pushAllAssigned(nodes, []);
}

function pushAllAssigned(nodes, result) {
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    if (n.tagName === "SLOT")  //if(node instanceof HTMLSlotElement) does not work in polyfill.
      pushAllAssigned(n.assignedNodes(), result);
    else
      result.push(n);
  }
  return result;
}