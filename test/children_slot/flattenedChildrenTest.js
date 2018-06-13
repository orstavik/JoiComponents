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
   *
   * This time, things get a little more complex.
   * The elements added in the list of things to do before the man
   * dies now clearly originates from different origins.
   * The elements in our `BucketList` is *mixed* together from two different HTML documents:
   * both the shadowDOM and the lightDOM of our `<man-bucket-list>`.
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

  /**
   * Example 3: `MarriedManBucketList`
   * In this last example we will see how this list can evolve when
   * we add yet another document source for bucket list items: marriage.
   *
   * When men get married, their original ambitions and goals in life gets wrapped up in their marriage.
   * A good way to illustrate this is to keep the original `ManBucketList` and place that in the
   * shadowDOM of a new custom element: `MarriedManBucketList`.
   *
   * This example illustrate the problem of using one custom element
   * inside the shadowDom of another custom element.
   * (cf. Web components gold standard on content assignment).
   * Here, `flattenedChildren(this.shadowRoot)` returns a much longer list:
   * `[style, div#man, div#love, div#romance, ..., div#one, div#two]`.
   * The bucket list items of `ManBucketList` are still there,
   * the only difference being that they now also include
   * a long list of goals intrinsic to `MarriedManBucketList`.
   *
   * What exactly is shadowDOM and lightDOM?
   * From the point-of-view of `ManBucketList`, the shadowDOM is still only `[style, div#man, slot]`.
   * But, what is `MarriedManBucketList`'s shadowDOM?
   * In the DOM, `ManBucketList`'s shadowDOM is organized *under* `MarriedManBucketList`'s shadowDOM.
   * It is a sub-document. So, are such sub-documents part of a shadowDOM?
   *
   * The answer is "no".
   * The sub-document's elements are not directly part of the `MarriedManBucketList` document.
   * Sub-documents cannot be directly styled or querySelected from the scope of a parent document in the DOM.
   * And, although possible, elements in sub-documents should not be directly queried nor manipulated from the scope of the parent document.
   * So even though the document of `ManBucketList` is wrapped in and subsumed under the shadowDOM of
   * `MarriedManBucketList`, the shadowDOM scope of `MarriedManBucketList` does not *reach into* that of `ManBucketList`.
   * If it does, then that is a hack and breach of contract.
   *
   * The lightDOM scopes are the reverse of the shadowDOM scopes.
   * From the point-of-view of `MarriedManBucketList` the lightDOM is simply *another document*.
   * For custom elements added to the main document, the lightDOM is always the main document.
   * But, the two `<slot>` elements in `MarriedManBucketList` and `ManBucketList` form a chained reference.
   * This chain transposes elements from *another document*, via `MarriedManBucketList` shadowDOM, and
   * down into `ManBucketList`.
   * Does that mean that the lightDOM of `ManBucketList` spans both
   * *another document* and the shadowDOM of `MarriedManBucketList`?
   *
   * Again, the answer is "no".
   * Even though actual elements can be transposed across three or more documents using `<slot>`s,
   * the term lightDOM is still only used about the document in which the `host`
   * of the custom element is instantiated.
   * In this instance, the lightDOM of `ManBucketList` is the shadowDOM of `MarriedManBucketList`.
   * This also illustrate that for custom elements used inside another custom elements,
   * the lightDOM is always the other shadowDom document and *never* the main document.
   *
   * However, references in `<slot>` elements *can* span across several documents.
   * And this means that the resolution of `assignedNodes()` and thus `visibleChildren` also span several documents.
   * The scope of `<slot>` and `visibleChildren` *does* include all the documents necessary.
   * So, sometimes an assignedNode of a slot can be found in the lightDOM's lightDOM.
   * Or an element is transposed to a shadowDOM's shadowDOM.
   */
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

