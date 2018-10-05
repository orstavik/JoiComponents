function findYourOwnSlot(e, shadowRoot){
  const path = e.composedPath();
  for(let i = 0; i < path.length -1; i++){
    let node = path[i];
    if (node.getRootNode() === shadowRoot)
      return [node, i];
  }
  return null;
}

export function NaiveSlotchangeMixin(Base){
  return class NaiveSlotchangeMixin extends Base {
    constructor(){
      super();
      Promise.resolve().then(()=>{
        this.shadowRoot.addEventListener("slotchange", e => {
          const [slot, indirectness] = findYourOwnSlot(e, this.shadowRoot);
          this.slotchangeCallback(slot, indirectness, e);
        });
      });
    }
    //slotchangeCallback(slot, indirectness, slotchangeEvent)
  };
}