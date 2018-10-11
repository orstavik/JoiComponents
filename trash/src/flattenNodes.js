/**
 * @param nodes
 * @returns {Array} a flattened array of nodes where all slot elements are replaced by their .assignedNodes() list.
 */
export function flattenNodes(nodes) {
  let res = [];
  for (let n of nodes) {
    if (n.tagName === "SLOT")  //if(node instanceof HTMLSlotElement) does not work in polyfill.
      res = res.concat(n.assignedNodes({flatten:true}));
    else
      res.push(n);
  }
  return res;
}