import {SlottableMixin} from "../../src/slot/SlottableMixin.js";
import {StaticSlotchangeMixin} from "../../trash/src/StaticSlotchangeMixin.js";
import {SlotchangeMixin} from "../../src/slot/SlotchangeMixin.js";

let all = [SlotchangeMixin, StaticSlotchangeMixin, SlotchangeMixin];

describe('basics', function () {

  for (let mixin of all) {
    let name = mixin.name;
    it(name + " extend HTMLElement class and can make an element using new", function () {
      const ElementClass = mixin(HTMLElement);
      customElements.define(name.toLowerCase() + "-must-use-custom-elements-define-to-enable-constructor", ElementClass);
      const el = new ElementClass();
      expect(el.constructor.name).to.be.equal(name);
    });
  }
});