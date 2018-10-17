it("subclass Mixin anonymous", function () {
  const SubclassChildrenChangedElement = class extends SlotchangeMixin(HTMLElement) {
    test() {
      return "abc";
    }
  };
  customElements.define("subclass-children-changed-element", SubclassChildrenChangedElement);
  const el = new SubclassChildrenChangedElement();
  expect(el.constructor.name).to.be.equal("SubclassChildrenChangedElement");
  expect(el.test()).to.be.equal("abc");
});
