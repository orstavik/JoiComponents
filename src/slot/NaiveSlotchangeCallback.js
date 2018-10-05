function findYourOwnSlot(e, shadowRoot){
  const path = e.composedPath();
  for(let i = 0; i < path.length -1; i++){
    let node = path[i];
    if (node.getRootNode() === shadowRoot)
      return [node, i];
  }
  return null;
}

function naiveSlotchangeCallback(el){
  el.shadowRoot.addEventListener("slotchange", e => {   //[*]
    const [slot, indirectness] = findYourOwnSlot(e, el.shadowRoot);
    el.slotchangeCallback(slot, indirectness, e);
  });
}