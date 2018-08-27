const isSet = Symbol("isSet");
const triggerSetup = Symbol("triggerSetup");
const triggerAttributes = Symbol("triggerAttributes");

export function SetupMixin(Base) {
  return class SetupMixin extends Base {
    constructor() {
      super();
      this[isSet] = false;
    }

    get isSetup() {
      return this[isSet];
    }

    set isSetup(bool) {
      if (this[isSet] || bool !== true)
        throw new Error("SetupMixin: .isSetup property should only be changed by the SetupMixin and to true.");
      this[isSet] = true;
    }

    connectedCallback() {
      this.isSetup || this[triggerSetup]();
      super.connectedCallback && super.connectedCallback();         //[*]
    }

    [triggerSetup]() {
      this.setupCallback();
      this.isSetup = true;
      this[triggerAttributes]();
    }

    [triggerAttributes]() {
      const obsAtts = Object.getPrototypeOf(this).constructor.observedAttributes;
      if (!obsAtts) return;
      for (let att of obsAtts) {
        if (this.hasAttribute(att))
          this.attributeChangedCallback(att, null, this.getAttribute(att));
      }
    }
  }
}

//ATT!! Remember to add
//attributeChangedCallback(name, old, nevv){
// if(!this.isSetup)return;                     //add this line only at the very beginning of this function. If you implement this method.