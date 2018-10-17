import {SlottableMixin} from "../../../src/slot/SlottableMixin.js";
import {SlotchangeMixin} from "../../../src/slot/SlotchangeMixin.js";

function testElementNodeListTagAndID(nodes, ar) {
  let tagIds = nodes.map(n => {
    if (n.tagName)
      return n.tagName.toLowerCase() + (n.id ? "#" + n.id : "");
    else
      return "text";
  });
  expect(tagIds).to.deep.equal(ar);
}

let sharedSlotChangeMixinTests = function (Mixin, name, prefix) {

  describe(name, function () {

    it(name + " extend HTMLElement class and make an element", function () {
      const ChildrenChangedElement = Mixin(HTMLElement);
      customElements.define(prefix+"must-use-custom-elements-define-to-enable-constructor", ChildrenChangedElement);
      const el = new ChildrenChangedElement();
      expect(el.constructor.name).to.be.equal(name);
    });

    it(name + " subclass with property.", function () {
      const SubclassChildrenChangedElement = class SubclassChildrenChanged extends Mixin(HTMLElement) {
        test() {
          return "abc";
        }
      };
      customElements.define(prefix+"subclass-children-changed", SubclassChildrenChangedElement);
      const el = new SubclassChildrenChangedElement();
      expect(el.constructor.name).to.be.equal("SubclassChildrenChanged");
      expect(el.test()).to.be.equal("abc");
    });

    it(name + " add DIV imperative and trigger slotchangedCallback", function (done) {
      const Subclass = class Subclass extends Mixin(HTMLElement) {
        constructor(){
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML ="";
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          expect(slotName).to.be.equal("");
          expect(newChildren.length).to.be.equal(1);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
          expect(oldChildren).to.be.equal(undefined);
          done();
        }
      };
      customElements.define(prefix+"children-changed-div-added", Subclass);
      const el = new Subclass();
      el.appendChild(document.createElement("div"));
      debugger;
      document.querySelector("body").appendChild(el);
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));
    });

    // WRONG TEST..
    // it(name + " " + name + "add SLOT imperative and trigger slotchangedCallback", function (done) {
    //   const Subclass = class Subclass extends Mixin(HTMLElement) {
    //     slotchangedCallback(slot, newChildren, oldChildren) {
    //       expect(oldChildren).to.deep.equal([]);
    //       // expect(oldChildren).to.be.equal(undefined);
    //       expect(newChildren.length).to.be.equal(0);
    //       done();
    //     }
    //   };
    //   customElements.define(prefix+"children-changed-slot-added", Subclass);
    //   const el = new Subclass();
    //   el.appendChild(document.createElement("slot"));
    //   document.querySelector("body").appendChild(el);
    //   Promise.resolve().then(()=> document.querySelector("body").removeChild(el));
    // });

    it(name + " added DIV and then SLOT imperative and trigger slotchangedCallback", function (done) {
      const Subclass = class Subclass extends Mixin(HTMLElement) {
        constructor(){
          super();
          this.attachShadow({mode: "open"});
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          expect(slotName).to.be.equal("");
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(1);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
          done();
        }
      };
      customElements.define(prefix+"children-changed-div-and-slot-added", Subclass);
      const el = new Subclass();
      el.appendChild(document.createElement("div"));
      el.appendChild(document.createElement("slot"));
      document.querySelector("body").appendChild(el);
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));
    });

    it(name + " added DIV and then SLOT imperative and trigger slotchangedCallback, mutation observer called between each invocation.", function (done) {
      const Subclass = class Subclass extends Mixin(HTMLElement) {
        constructor(){
          super();
          this.attachShadow({mode: "open"});
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          expect(slotName).to.be.equal("");
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(1);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
          done();
        }
      };
      customElements.define(prefix+"children-changed-div-added-wait-and-then-slot-added", Subclass);
      const el = new Subclass();
      el.appendChild(document.createElement("div"));
      el.appendChild(document.createElement("slot"));
      document.querySelector("body").appendChild(el);
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));
    });

    it(name + " The super inner-outer-slot test 2", function (done) {

      const InnerElementThatObserveChildren = class extends Mixin(HTMLElement) {

        constructor(){
          super();
          this.attachShadow({mode: "open"});
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(3);
          expect(newChildren[1].nodeName).to.be.equal("DIV");
          done();
        }
      };
      const innerName = prefix+"inner-component";
      customElements.define(innerName, InnerElementThatObserveChildren);

      const OuterElementThatSlotsStuff = class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML = `
          <${innerName}>
            <slot></slot>
          </${innerName}>`;
        }
      };
      customElements.define(prefix+"outer-component", OuterElementThatSlotsStuff);

      const el = new OuterElementThatSlotsStuff();
      //things are not slotted until something is added to the DOM
      document.querySelector("body").appendChild(el);
      el.appendChild(document.createElement("div"));
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));
    });

    it(name + " not listening for slotChange on slots that are not a direct child", function (done) {

      const InnerElementThatObserveChildren = class extends Mixin(HTMLElement) {

        constructor(){
          super();
          this.attachShadow({mode: "open"});
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(3);
          expect(newChildren[1].nodeName).to.be.equal("DIV");
          done();
        }
      };
      const innerName = prefix+"inner-listener";
      customElements.define(innerName, InnerElementThatObserveChildren);

      const OuterElementThatSlotsStuff = class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML = `
          <${innerName}>
            <div>
              <slot></slot>
            </div>
          </${innerName}>`;
        }
      };
      customElements.define(prefix+"outer-with-grandchild-slot", OuterElementThatSlotsStuff);

      const el = new OuterElementThatSlotsStuff();
      document.querySelector("body").appendChild(el);
      el.appendChild(document.createElement("p"));
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));
    });

    it(name + " slotName === ''", function (done) {

      let counter = 0;

      const InnerElementIsSlot = class extends Mixin(HTMLElement) {

        constructor(){
          super();
          this.attachShadow({mode: "open"});
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          if (counter === 0) {
            expect(oldChildren).to.be.equal(undefined);
            expect(newChildren.length).to.be.equal(2);
            expect(slotName).to.be.equal("");
            counter++;
            return;
          }
          if (counter === 1) {
            expect(oldChildren.length).to.be.equal(2);
            expect(newChildren.length).to.be.equal(3);
            expect(newChildren[1].nodeName).to.be.equal("P");
            expect(slotName).to.be.equal("");
            done();
          }
        }
      };
      const innerName = prefix+"inner-is-slot";
      customElements.define(innerName, InnerElementIsSlot);

      const OuterElementIsSlot = class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML = `
          <${innerName}>
            <slot></slot>
          </${innerName}>`;
        }
      };
      customElements.define(prefix+"outer-is-slot", OuterElementIsSlot);

      const el = new OuterElementIsSlot();
      document.querySelector("body").appendChild(el);
      Promise.resolve().then(() => {
        el.appendChild(document.createElement("p"));
        Promise.resolve().then(() => {
          document.querySelector("body").removeChild(el);
        });
      });
    });

    it(name + " connected-disconnected-connected. slotchangedCallback only triggered when connected + MutationObserver only called once when micro task queued.", function (done) {
      const Subclass = class Subclass extends Mixin(HTMLElement) {

        constructor(){
          super();
          this.attachShadow({mode: "open"});
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          expect(oldChildren).to.be.equal(undefined);
          expect(newChildren.length).to.be.equal(3);
          expect(newChildren[0].nodeName).to.be.equal("DIV");
          expect(newChildren[1].nodeName).to.be.equal("DIV");
          expect(newChildren[2].nodeName).to.be.equal("DIV");
          done();
        }
      };
      customElements.define(prefix+"connected-disconnected-connected", Subclass);
      const el = new Subclass();
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      document.querySelector("body").removeChild(el);   //disconnect
      el.appendChild(document.createElement("div"));    //is not triggered.
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));
    });

    it(name + " connected-wait-disconnected-connected. slotchangedCallback only triggered when connected.", function (done) {
      let counter = 0;

      const Subclass = class Subclass extends Mixin(HTMLElement) {

        constructor(){
          super();
          this.attachShadow({mode: "open"});
        }
        slotchangedCallback(slotName, newChildren, oldChildren) {
          if (counter === 0) {
            expect(oldChildren).to.be.equal(undefined);
            expect(newChildren.length).to.be.equal(1);
            expect(newChildren[0].nodeName).to.be.equal("DIV");
            counter++;
            return;
          }
          if (counter === 1) {
            expect(oldChildren.length).to.be.equal(1);
            expect(newChildren.length).to.be.equal(3);
            expect(newChildren[0].nodeName).to.be.equal("DIV");
            expect(newChildren[1].nodeName).to.be.equal("DIV");
            expect(newChildren[2].nodeName).to.be.equal("DIV");
            done();
          }
        }
      };
      customElements.define(prefix+"connected-settimeout-disconnected-connected", Subclass);
      const el = new Subclass();
      el.appendChild(document.createElement("div"));    //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
      Promise.resolve().then(() => document.querySelector("body").removeChild(el));   //disconnect
      setTimeout(() => {
        el.appendChild(document.createElement("div"));    //is not triggered.
        el.appendChild(document.createElement("div"));    //is not triggered.
        document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
        Promise.resolve().then(() => document.querySelector("body").removeChild(el));   //disconnect
      }, 50);
    });

    it(name + " blue-frame.", function (done) {

      var counter = 0;

      class BlueFrame extends Mixin(HTMLElement) {

        constructor() {
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML =
            `<style>
          :host {
            display: inline-block;                                  
            border: 10px solid blue;
          }
          #sold {
            display: none;
            background: red;
            border-radius: 50%;
            width: 10px;
            height: 10px;
            position: absolute;
            bottom: 5px;
            right: 5px;
          }
          :host([sold]) #sold {
            display: block;
          }
        </style>
        <${innerName}>
          <slot name="label" slot="label"></slot>  
          <slot></slot>
          <div id="sold"></div>
        </${innerName}>
        `;
        }

        slotchangedCallback(slot, newNodes, oldNodes) {
          counter++;
          if (slot === "") {
            expect(oldNodes).to.be.equal(undefined);
            testElementNodeListTagAndID(newNodes, ["img"]);
          } else if (slot === "label") {
            expect(oldNodes).to.be.equal(undefined);
            testElementNodeListTagAndID(newNodes, ["span"]);
          } else {
            assert(false);
          }
          if (counter === 4)
            done();
        }
      }

      class PassePartout extends Mixin(HTMLElement) {

        constructor() {
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML =
            `<style>
          :host {
            display: inline-block;
            position: relative;                                  
            background: white;
            padding: 12px;
          }
          div {
            text-align: center;
          }
        </style>
        <slot></slot>
        <div id="label">
          <slot name="label"></slot>
        </div>
        `;
        }

        slotchangedCallback(slot, newNodes, oldNodes) {
          counter++;
          if (slot === "") {
            expect(oldNodes).to.be.equal(undefined);
            testElementNodeListTagAndID(newNodes, ["text", "text", "img", "text", "div#sold", "text"]);
          } else if (slot === "label") {
            expect(oldNodes).to.be.equal(undefined);
            testElementNodeListTagAndID(newNodes, ["span"]);
          } else {
            assert(false);
          }
          if (counter === 4)
            done();
        }
      }

      const innerName = prefix+"passe-partout";
      customElements.define(innerName, PassePartout);
      customElements.define(prefix+"blue-frame", BlueFrame);

      /*
    <blue-frame sold>
      <img>
      <span slot="label">Picture of the ocean</span>
    </blue-frame>
    */
      const el = new BlueFrame();
      el.appendChild(document.createElement("img"));    //is not triggered.
      let span = document.createElement("span");
      span.setAttribute("slot", "label");
      span.innerText = "Picture of the ocean";
      el.appendChild(span);                             //is not triggered.
      document.querySelector("body").appendChild(el);   //slotchangedCallback triggered on connect
    });

    //todo verify that eventListeners are removed when disconnected.
    //todo make some tests showing that it does not go outside of its realm.. don't know how
  });
};
sharedSlotChangeMixinTests(SlotchangeMixin, "SlottableMixin", "slotchangemixin-");
sharedSlotChangeMixinTests(SlotchangeMixin, "SlottableMixin", "shadowslotchangemixin-");