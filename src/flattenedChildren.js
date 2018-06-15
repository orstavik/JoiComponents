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

export function flattenNodesMap(nodes, includeOnlySlotNamed) {
  const res = {"": []};
  for (var i = 0; i < nodes.length; i++) {
    var child = nodes[i];
    var slotName = child.getAttribute ? (child.getAttribute("slot") || "") : "";
    if (includeOnlySlotNamed && slotName !== includeOnlySlotNamed)
      continue;
    if (child.tagName === "SLOT")
      res[slotName] = (res[slotName] || []).concat(flattenNodes(child.assignedNodes()));
    else
      (res[slotName] || (res[slotName] = [])).push(child);
  }
  return res;
}

