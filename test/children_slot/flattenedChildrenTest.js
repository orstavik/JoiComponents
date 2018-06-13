import {flattenedChildren} from "../../src/flattenedChildren.js";

function testElementNodeListTagAndID(el, ar) {
  let tagIds = el.filter(n => n.tagName).map(n => n.tagName + "#" + n.id);
  expect(tagIds).to.deep.equal(ar);
}

describe('flattenedChildrenTest basics', function () {

  it("flattenedChildren() on single element", function () {
    const Subclass = class Subclass extends HTMLElement {
    };
    customElements.define("flattened-children-1", Subclass);
    const el = new Subclass();
    assert(flattenedChildren(el).length === 0);
    let child = document.createElement("div");
    el.appendChild(child);
    el.appendChild(document.createElement("slot"));
    assert(flattenedChildren(el).length === 1);
    el.removeChild(child);
    assert(flattenedChildren(el).length === 0);
  });

  it("The super inner-outer-slot test 1", function () {

    const InnerElementThatObserveChildren = class extends HTMLElement {
    };

    const OuterElementThatSlotsStuff = class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <inner-flattened-children>
            <slot></slot>
          </inner-flattened-children>
        `;
      }
    };

    customElements.define("inner-flattened-children", InnerElementThatObserveChildren);
    customElements.define("outer-flattened-children", OuterElementThatSlotsStuff);

    const outer = new OuterElementThatSlotsStuff();
    const inner = outer.shadowRoot.children[0];
    const innerSlot = inner.children[0];

    //no div added as child, all slots are empty
    assert(flattenedChildren(inner).length === 0);
    assert(innerSlot.assignedNodes().length === 0);

    //add a div to outer
    let slotted = document.createElement("div");
    outer.appendChild(slotted);
    assert(flattenedChildren(inner).length === 1);
    assert(innerSlot.assignedNodes().length === 1);
    inner.removeChild(innerSlot);
    assert(flattenedChildren(inner).length === 0);
    assert(innerSlot.assignedNodes().length === 0);
    inner.appendChild(innerSlot);
    assert(flattenedChildren(inner).length === 1);
    assert(innerSlot.assignedNodes().length === 1);
  });

  /**
   * Example 1: `BucketList`
   * To illustrate the concept of lightDOM and shadowDOM,
   * we start with a simple example with low ambitions: `BucketList`.
   * The `BucketList` is a list of important things to do in life.
   * It anticipates to be filled with a series of `<div>`s with text, which it will center-align.
   *
   * So far, there is a simple distinction between the shadowDOM and the lightDOM
   * from the point of view of the `BucketList` element:
   * The shadowDOM is the DOM under the attached shadowRoot, ie. `style` and `slot`;
   * The lightDOM is the topDocument with its elements `bucket-list#list, div#one, div#two`.
   * We say that the `<slot>` transposes a set of actual elements from the lightDOM into the shadowDOM.
   */
  it("BucketList test", function () {
    class BucketList extends HTMLElement {

      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `<style id="sty">text-align: center;</style><slot></slot>`;
      }
    }

    customElements.define("bucket-list", BucketList);

    const topDocument = document.createElement("div");
    topDocument.innerHTML = `
      <bucket-list id="list">
        <div id="one">fix bike</div>
        <div id="two">slice cucumbers</div>
      </bucket-list>
    `;

    const list = topDocument.querySelector("#list");
    const listShadow = list.shadowRoot;
    const listShadowSlot = listShadow.children[1];

    testElementNodeListTagAndID(flattenedChildren(list), ["DIV#one", "DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(listShadow), ["STYLE#sty", "DIV#one", "DIV#two"]);
    testElementNodeListTagAndID(listShadowSlot.assignedNodes(), ["DIV#one", "DIV#two"]);
    const one = topDocument.querySelector("#one");
    list.removeChild(one);
    testElementNodeListTagAndID(flattenedChildren(list), ["DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(listShadow), ["STYLE#sty", "DIV#two"]);
    testElementNodeListTagAndID(listShadowSlot.assignedNodes(), ["DIV#two"]);
  });

  /**
   * Example 2: ManBucketList
   * Let's up our ambitions a bit and make a bucket list for men: `ManBucketList`.
   * Being human, men's ambitions are driven by what they see around them every day.
   * By this logic, men's bucket lists should therefore also look different during weekdays and weekends.
   * During weekdays, men are stuck in long ques driving to work and fantasize about owning a red Ferrari.
   * During weekends, men stay at home, fiddle around the house and worry about their lawns, then drought
   * and then global warming.
   *
   * Therefore, on weekdays, the `ManBucketList` automatically adds an element "Buy Ferrari" to its list.
   * On weekends, the `ManBucketList` instead adds "Invent atmosphere decarbonizer".
   */
  it("ManBucketList test", function () {

    class ManBucketList extends HTMLElement {
      constructor() {
        super();
        const day = 1; //new Date().getDay();
        const task = day < 5 ? "Buy Ferrari" : "Invent atmosphere decarbonizer";
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <style id="sty">text-align: center;</style>
          <div id="man">${task}</div>
          <slot></slot>
        `;
      }
    }

    customElements.define("man-bucket-list", ManBucketList);

    const topDocument = document.createElement("div");
    topDocument.innerHTML = `
      <man-bucket-list id="manlist"><div id="one">fix bike</div><div id="two">slice cucumbers</div></man-bucket-list>
    `;

    const list = topDocument.querySelector("#manlist");
    const listShadow = list.shadowRoot;
    const listShadowSlot = listShadow.children[2];

    testElementNodeListTagAndID(flattenedChildren(list), ["DIV#one", "DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(listShadow), ["STYLE#sty", "DIV#man", "DIV#one", "DIV#two"]);
    testElementNodeListTagAndID(listShadowSlot.assignedNodes(), ["DIV#one", "DIV#two"]);
    const one = topDocument.querySelector("#one");
    list.removeChild(one);
    testElementNodeListTagAndID(flattenedChildren(list), ["DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(listShadow), ["STYLE#sty", "DIV#man", "DIV#two"]);
    testElementNodeListTagAndID(listShadowSlot.assignedNodes(), ["DIV#two"]);
  });

  it("MarriedManBucketList test", function () {

    class ManBucketList extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <style id="sty">text-align: center;</style>
          <div id="man">Ferrari</div>
          <slot></slot>
        `;
      }
    }

    class MarriedManBucketList extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
          <man-bucket-list-2 id="original">
            <div id="a">love your wife</div>
            <div id="b">surprise her with a gift</div>
            <div id="c">make money</div>
            <div id="d">paint the house</div>
            <div id="e">fix her car</div>
            <div id="f">fix the plumbing</div>
            <div id="g">make more money</div>
            <div id="h">paint the fence, again</div>
            <div id="i">bite your tongue</div>
            <div id="j">paint the house in a different color</div>
            <slot></slot>
          </man-bucket-list-2>
        `;
      }
    }

    customElements.define("married-man-bucket-list", MarriedManBucketList);
    customElements.define("man-bucket-list-2", ManBucketList);

    const topDocument = document.createElement("div");
    topDocument.innerHTML = `
      <married-man-bucket-list id="marriedlist">
        <div id="one">fix bike</div>
        <div id="two">slice cucumbers</div>
      </married-man-bucket-list>
    `;

    const marriedlist = topDocument.querySelector("#marriedlist");
    const marriedlistShadow = marriedlist.shadowRoot;
    const manlist = marriedlistShadow.children[0];
    const marriedlistShadowSlot = manlist.children[manlist.children.length - 1];
    const manlistShadow = manlist.shadowRoot;
    const manlistShadowSlot = manlistShadow.children[2];

    testElementNodeListTagAndID(flattenedChildren(marriedlist), ["DIV#one", "DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(manlist), ["DIV#a", "DIV#b", "DIV#c", "DIV#d", "DIV#e", "DIV#f", "DIV#g", "DIV#h", "DIV#i", "DIV#j", "DIV#one", "DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(manlistShadow), ["STYLE#sty", "DIV#man", "DIV#a", "DIV#b", "DIV#c", "DIV#d", "DIV#e", "DIV#f", "DIV#g", "DIV#h", "DIV#i", "DIV#j", "DIV#one", "DIV#two"]);
    testElementNodeListTagAndID(manlistShadowSlot.assignedNodes(), ["DIV#a", "DIV#b", "DIV#c", "DIV#d", "DIV#e", "DIV#f", "DIV#g", "DIV#h", "DIV#i", "DIV#j", "SLOT#"]);
    testElementNodeListTagAndID(marriedlistShadowSlot.assignedNodes(), ["DIV#one", "DIV#two"]);

    const one = topDocument.querySelector("#one");
    marriedlist.removeChild(one);

    testElementNodeListTagAndID(flattenedChildren(marriedlist), ["DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(manlist), ["DIV#a", "DIV#b", "DIV#c", "DIV#d", "DIV#e", "DIV#f", "DIV#g", "DIV#h", "DIV#i", "DIV#j", "DIV#two"]);
    testElementNodeListTagAndID(flattenedChildren(manlistShadow), ["STYLE#sty", "DIV#man", "DIV#a", "DIV#b", "DIV#c", "DIV#d", "DIV#e", "DIV#f", "DIV#g", "DIV#h", "DIV#i", "DIV#j", "DIV#two"]);
    testElementNodeListTagAndID(manlistShadowSlot.assignedNodes(), ["DIV#a", "DIV#b", "DIV#c", "DIV#d", "DIV#e", "DIV#f", "DIV#g", "DIV#h", "DIV#i", "DIV#j", "SLOT#"]);
    testElementNodeListTagAndID(marriedlistShadowSlot.assignedNodes(), ["DIV#two"]);
  });
});

