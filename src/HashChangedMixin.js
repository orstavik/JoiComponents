
export const HashChangedMixin = function(Base){
  return class HashChangedMixin extends Base {

    constructor() {
      super();
      this.arr =[];
      this._listener = ()=> this.getValue();
    }
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      window.addEventListener("hashchange", this._listener);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      window.removeEventListener("hashchange", this._listener);
    }
    getValue() {
      this.arr.unshift(window.location.hash.slice(1));
      this.hashChangedCallback(this.arr[0]);
    }
  }
};