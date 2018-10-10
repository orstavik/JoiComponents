import {SlottableMixin} from "../../src/slot/SlottableMixin.js";

describe("Blue-frame", function () {
  it("blue-frame.", function (done) {

    const snippet = document.createElement("template");
    snippet.innerHTML = `
       <blue-frame>
         <img>
         <span slot="label">Picture of the ocean</span>
       </blue-frame>
    `;

    const blueFrameTempl = document.createElement("template");
    blueFrameTempl.innerHTML =
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
        <passe-partout>
          <slot name="label" slot="label"></slot>  
          <slot></slot>
          <div id="sold"></div>
        </passe-partout>
        `;

    const passePartout = document.createElement("template");
    passePartout.innerHTML =
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

    class BlueFrame extends SlottableMixin(HTMLElement) {

      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(blueFrameTempl.content);
      }

      slottablesCallback(slot) {
        this.testValue = this.testValue || [];
        this.testValue.push({slotName: slot.name, newChildren: slot.assignedNodes({flatten: true})});
      }
    }

    class PassePartout extends SlottableMixin(HTMLElement) {

      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(passePartout.content);
      }

      slottablesCallback(slot) {
        this.testValue = this.testValue || [];
        this.testValue.push({slotName: slot.name, newChildren: slot.assignedNodes({flatten: true})});
      }
    }

    customElements.define("passe-partout", PassePartout);
    customElements.define("blue-frame", BlueFrame);

    function testElementNodeListTagAndID(nodes, ar) {
      let tagIds = nodes.map(n => {
        if (n.tagName)
          return n.tagName.toLowerCase() + (n.id ? "#" + n.id : "");
        else
          return "text";
      });
      expect(tagIds).to.deep.equal(ar);
    }

    document.querySelector("body").appendChild(snippet.content);   //slotchangedCallback triggered on connect
    const allElements = document.querySelector("body").children;
    const blue = allElements[allElements.length - 1];
    const passe = blue.shadowRoot.children[1];
    requestAnimationFrame(() => {
      expect(blue.testValue.length).to.be.equal(2);
      expect(blue.testValue[0].slotName).to.be.equal("");
      expect(blue.testValue[0].oldChildren).to.be.equal(undefined);
      testElementNodeListTagAndID(blue.testValue[0].newChildren, ['text', 'img', 'text', 'text']);
      expect(blue.testValue[1].slotName).to.be.equal("label");
      expect(blue.testValue[1].oldChildren).to.be.equal(undefined);
      testElementNodeListTagAndID(blue.testValue[1].newChildren, ["span"]);

      expect(passe.testValue.length).to.be.equal(2);
      expect(passe.testValue[0].slotName).to.be.equal("");
      expect(passe.testValue[0].oldChildren).to.be.equal(undefined);
      testElementNodeListTagAndID(passe.testValue[0].newChildren, ["text", "text", "text", "img", "text", "text", "text", "div#sold", "text"]);
      expect(passe.testValue[1].slotName).to.be.equal("label");
      expect(passe.testValue[1].oldChildren).to.be.equal(undefined);
      testElementNodeListTagAndID(passe.testValue[1].newChildren, ["span"]);

      document.querySelector("body").removeChild(blue);   //slotchangedCallback triggered on connect
      done();
    });
  });
});
