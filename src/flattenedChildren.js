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

export function flattenNodesMap(nodes, selectedSlotName) {
  const res = {};
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var slotName = n.getAttribute ? (n.getAttribute("slot") || "") : "";
    if (selectedSlotName && slotName !== selectedSlotName)
      continue;
    if (!res[slotName])
      res[slotName] = [];
    if (n.tagName === "SLOT")
      pushAllAssigned(n.assignedNodes(), res[slotName]);
    else
      res[slotName].push(n);
  }
  return res;
}