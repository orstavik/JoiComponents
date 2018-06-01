/**
 * @param element
 * @returns {Array} list of the element's children
 *          where slots are replaced by their assignedNodes.
 */
export function flattenedChildren(element) {
  let res = [];
  for (let i = 0; i < element.children.length; i++) {
    let child = element.children[i];
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