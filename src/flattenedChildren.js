/**
 * @param nodes
 * @returns {Array} a flattened array of nodes where all slot elements are replaced by their .assignedNodes() list.
 */
export function flattenNodes(nodes) {
  return pushAllAssigned(nodes, []);
}

function pushAllAssigned(nodes, result){
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (node.tagName === "SLOT")
      pushAllAssigned(node.assignedNodes(), result);
    else
      result.push(node);
  }
  return result;
}