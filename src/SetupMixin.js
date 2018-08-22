const isSet = Symbol("isSet");

function SetupMixin(Base){
  return class SetupMixin extends Base {
    constructor(){
      super();
      this[isSet] = false;
    }
    get isSetup(){
      return this[isSet];
    }
    set isSetup(bool){
      if (this[isSet] || bool !== true)
        throw new Error("SetupMixin: .isSetup property should only be changed by the SetupMixin and to true.");
      this[isSet] = true;
    }
    cloneNode(deep){
      const clone = super.cloneNode(deep);
      this.isSetup && (clone.setupCallback(), clone.isSetup = true);
      return clone;
    }
    connectedCallback(){
      this.isSetup || (this.setupCallback(), this.isSetup = true);
      super.connectedCallback && super.connectedCallback();         //[*]
    }
  }
}