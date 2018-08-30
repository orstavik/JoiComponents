// const isSet = Symbol("isSet");
// const trigger = Symbol("trigger");
// export function InitialAttributesMixin(Base){
//   return class InitialAttributesMixin extends Base {
//     constructor(){
//       super();
//       this[isSet] = false;
//       this[trigger] = requestAnimationFrame(()=> this[isSet] || this.doInit(true));
//     }
//     attributeChangedCallback(name, oldValue, newValue){
//       super.attributeChangedCallback && super.attributeChangedCallback(name, oldValue, newValue);
//       this[isSet] || this.doInit();
//     }
//     connectedCallback(){
//       super.connectedCallback && super.connectedCallback();
//       this[isSet] || this.doInit();
//     }
//     doInit(fromRaf){
//       if (!fromRaf) cancelAnimationFrame(this[trigger]);
//       this.initialAttributesCallback();
//       this[isSet] = true;
//     }
//   }
// }

let que = [];
let active = false;

function runQue() {
  for (let i = 0; i < que.length; i++) {
    let el = que[i];
    el[isSet] || (el[isSet] = true, el.initialAttributesCallback());
  }
  que = [];
  active = false;
}

function addToQue(el) {
  que.push(el);
  if (!active) {
    active = true;
    requestAnimationFrame(runQue);
  }
}

const isSet = Symbol("isSet");
const trigger = Symbol("trigger");

export function InitialAttributesMixin(Base) {
  return class InitialAttributesMixin extends Base {
    constructor() {
      super();
      this[isSet] = false;
      addToQue(this);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback && super.attributeChangedCallback(name, oldValue, newValue);
      this[isSet] || (this[isSet] = true, this.initialAttributesCallback());
    }

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      this[isSet] || (this[isSet] = true, this.initialAttributesCallback());
    }
  }
}
