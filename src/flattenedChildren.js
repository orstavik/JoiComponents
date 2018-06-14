/**
 * @param element
 * @returns {Array} list of the element's children
 *          where slots are replaced by their assignedNodes.
 */
export function flattenedChildren(element) {
  return pushAllAssigned(element.children, []);
}

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