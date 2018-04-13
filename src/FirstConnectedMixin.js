const firstConnect = Symbol("hasConnected");
/**
 * This echoes the ready method of Polymer.
 *
 * Be aware! This Mixin breaks the normal order of calling super.connectedCallback() in the Mixins.
 * In connectedCallback(), FirstConnectedMixin checks and calls .firstConnectedCallback() _before_
 * it calls super.connectedCallback().
 * This enables the body of the firstConnectedCallback() in the custom element using this Mixin
 * (and other Mixins too, although I recommend against such interconnection and interdependency
 * between mixins) to be run and completed before the body of the normal .connectedCallback() methods.
 *
 * @param Base must be HTMLElement
 * @returns {FirstConnectedMixin}
 */
export const FirstConnectedMixin = function (Base) {
  return class FirstConnectedMixin extends Base {

    constructor() {
      super();
      this[firstConnect] = true;
    }

    connectedCallback() {
      if(this[firstConnect]) {          //ATT!!
        this[firstConnect] = false;
        this.firstConnectedCallback();
      }
      if (super.connectedCallback) super.connectedCallback();
    }
  }
};