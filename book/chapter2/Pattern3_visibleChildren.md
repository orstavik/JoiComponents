# Pattern: visibleChildren

We start this discussion by coining a new term: `visibleChildren`.
`visibleChildren` means all the child elements that would be "visible" for an element.
For elements in the main document *outside* any ShadowDOM, 
the `visibleChildren` equals the `.children` of the element.

But. For an element *inside* a ShadowDOM, 
the list of children displayed under the element is no longer simply its `.children`.
*Inside* a shadowDom, the `.children` of an element *might contain* `<slot>` elements.
`<slot>` elements are HTML variables, not normal HTML elements;
When a `<slot>` is instantiated in a shadowDOM document, 
the `<slot>` placeholder element will be replaced by zero, one or several "actual" elements 
retrieved from the `host` element's lightDOM *when the view is created*. 

In the new ShadowDOM era, `visibleChildren` is:
* An element *in the main, top-level document*: the element's `.children`.
* An element *inside a shadowDom document*: the element's `.children` where all `slot` elements 
are flattened (ie. replaced with their `.assignedNodes()`).

In the view, it slotted or normal elements appear identical.
In many run-time contexts, slotted and normal elements should therefore also be treated equally.
Enter `visibleChildren`. 
The purpose of `visibleChildren` is to flatten so as to equate normal and slotted elements.

## function `getVisibleChildren(el)`
The `visibleChildren` pattern can be implemented as a small function.
This function retrieves and flattens the list of `visibleChildren` for *all* elements.

```javascript
function getVisibleChildren(el) {
  let res = [];
  for (let i = 0; i < el.children.length; i++) {
    let child = el.children[i];
    if (child.constructor.name === "HTMLSlotElement") {
      let assignedNodes = child.assignedNodes();
      for (let j = 0; j < assignedNodes.length; j++)
        res.push(assignedNodes[j]);
    } else {
      res.push(child);
    }
  }
  return res;
}
```

## Example 1: `BucketList`
To illustrate the concept of `visibleChildren`, 
we start with a simple example with low ambitions: `BucketList`.
The `BucketList` anticipates to be filled with a series of `<div>`s with text.
To make the list look a bit "churchy", it will center-align the text.
To implement this, `BucketList` uses a `<slot>` element as a placeholder in the shadowDOM document 
for a set of actual elements that we will transpose in from the lightDOM document.

```javascript
class BucketList extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode:"open"});
  }
  
  connectedCallback(){
    this.shadowRoot.innerHTML =`
      <style>text-align: center;</style>
      <slot></slot>
    `;
  }  
}

customElements.define("bucket-list", BucketList);
```
Used in "another document" like so:
```html
<bucket-list id="list">
  <div id="one">fix bike</div>
  <div id="two">slice cucumbers</div>
</bucket-list>
```
When the `<bucket-list>` is instantiated in the DOM, 
the `<slot>` inside its shadowRoot document refers to `div#one` and `div#two`.
`getVisibleChildren(this.shadowRoot)` would return `[style, div#one, div#two]`.
This creates a simple distinction between the shadowDOM and the lightDOM 
from the point of view of the `BucketList` element:
The shadowDOM is the DOM under the attached shadowRoot, ie. `style` and `slot`;
The lightDOM is the "another document" with the elements `bucket-list#list, div#one, div#two`.

## Example 2: ManBucketList
Let's up our ambitions a bit and make a bucket list for men: `ManBucketList`.
Being simple creatures, men's ambitions are driven by what they see around them every day.
By this logic, men's bucket lists should therefore also look different during weekdays and weekends.
During weekdays, men are stuck in long ques driving to work and fantasize about owning a red Ferrari.
During weekends, men stay at home, fiddle around the house and worry about their lawns, then drought 
and then global warming. 

Therefore, on weekdays, the `ManBucketList` automatically adds an element "Buy Ferrari" to its list.
On weekends, the `ManBucketList` instead adds "Invent atmosphere decarbonizer".

```javascript
class ManBucketList extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode:"open"});
  }
  
  connectedCallback(){
    const day = new Date().getDay();
    const task = day < 5 ? "Buy Ferrari" : "Invent atmosphere decarbonizer";
    this.shadowRoot.innerHTML =`
      <style>text-align: center;</style>
      <div id="man">${task}</div>
      <slot></slot>
    `;
  }  
}
customElements.define("man-bucket-list", ManBucketList);
```
We use it in *another document*:
```html
<man-bucket-list id="list">
  <div id="one">fix bike</div>
  <div id="two">slice cucumbers</div>
</man-bucket-list>
```
This time, things get a little more complex.
Now, `getVisibleChildren(this.shadowRoot)` would return `[div#man, div#one, div#two]`.
The elements added in the list of things to do before the man dies now clearly originates from different origins.
The composition of list elements is *mixed* together from two different HTML documents.
Let's see how this evolves.

## Example 3: `MarriedManBucketList`

In this last example we will see how this list can evolve when 
we add yet another document source for bucket list items for men: marriage.
When men get married, their original ambitions and goals in life gets wrapped up in the goals of marriage.
A good way to illustrate this is to keep the original `ManBucketList` and place that in the
shadowDOM of a new custom element: `MarriedManBucketList`.

```javascript
class MarriedManBucketList extends HTMLElement {
  constructor(){
    super();                                                                      
    this.attachShadow({mode:"open"});                     
  }
  
  connectedCallback(){
    this.shadowRoot.innerHTML =`
      <man-bucket-list id="original">
        <div id="love">love your wife</div>
        <div id="romance">surprise her with a gift</div>
        <div id="duties">make money</div>
        <div id="sacrifice">paint the house</div>
        <div id="inventive">fix her car</div>
        <div id="dirtywork">fix the plumbing</div>
        <div id="hardwork">make more money</div>
        <div id="pain">paint the fence, again</div>
        <div id="suffering">bite your tongue</div>
        <div id="slave">paint the house in a different color</div>
        <slot></slot>
      </man-bucket-list>`;
  }  
}
customElements.define("married-man-bucket-list", MarriedManBucketList);
```
In *another document*:
```html
<married-man-bucket-list id="list">
  <div id="one">fix bike</div>
  <div id="two">slice cucumbers</div>
</married-man-bucket-list>
```
This example illustrate the problem of using one custom element inside the shadowDom of another custom element.
(cf. Web components gold standard on content assignment).
Here, `getVisibleChildren(this.shadowRoot)` returns a much longer list:
`[div#love, div#romance, ..., div#man, div#one, div#two]`.
The bucket list items of `ManBucketList` are still there, 
the only difference being that they now come at the tail end of 
a long list of goals intrinsic to `MarriedManBucketList`.

From the point-of-view of `ManBucketList`, the shadowDOM is still only `[style, div#man, slot]`.
But, what is `MarriedManBucketList`'s shadowDOM? 
In the DOM, `ManBucketList` shadowDOM elements are organized *under* the shadowDOM of `MarriedManBucketList`.
Is this sub-document part of `MarriedManBucketList`'s shadowDOM?

The answer is "no".
The sub-document's elements are not directly part of the `MarriedManBucketList` document;
Elements in the sub-document cannot be directly styled or querySelected from the scope of `MarriedManBucketList`;
And the developer of `MarriedManBucketList` should not manipulate the shadowRoot of sub-documents.
So even though the document of `ManBucketList` is wrapped in and subsumed under the shadowDOM of 
`MarriedManBucketList`, the shadowDOM scope of `MarriedManBucketList` does not *reach into* that of `ManBucketList`.

The lightDOM scopes are the reverse of the shadowDOM scopes.
From the point-of-view of `MarriedManBucketList` the lightDOM is simply *another document*.
One level down, the lightDOM is the main document.
But, the two `<slot>` elements in `MarriedManBucketList` and `ManBucketList` form a chained reference.
This chain transposes elements from *another document* via `MarriedManBucketList` all the way down into `ManBucketList`.
The lightDOM of `ManBucketList` thereby spans both *another document* and the shadowRoot document of `MarriedManBucketList`.
Or does it?

Again, the answer is "no".
Even though actual elements can be transposed across three or more documents using `<slot>`s,
the term lightDOM is still only used about the document in which the `host` of the custom element is instantiated.
In this instance, the lightDOM of `ManBucketList` is the shadowDOM of `MarriedManBucketList`.
This also illustrate that two or more levels down, the lightDOM is *not* the main document, but another shadowDom document.

### Semantic confusion replaced with definite conclusion

To summarize, shadowDOM is only the scope of the shadowRoot-document. 
This scope does include child elements with shadowRoot, but it does not reach into such descendant documents.
Similarly, lightDOM is only the scope of the document in which the custom element is instantiated,
the document with the `host` node.
Yes, `<slot>` elements can form reference chains that can transpose elements across three or more connected documents. 
But no, the scope of what we call lightDOM still remains only the document with the `host` element.

However, the `<slot>` elements and the `visibleChildren` *can* span across several documents.
Therefore, the scope of `<slot>` and `visibleChildren` include all the documents necessary 
to resolve a slot reference.
The `<slot>` from the static, template context and `visibleChildren` from the dynamic, JS context 
*both* has a scope that can span several documents both up and down the full DOM tree.

## How to cross the borders of DOM documents?

By convention, elements should try to avoid crossing document borders *outside* of established pathways.
In addition to adding and removing whole elements from the DOM,
`HTML attributes` and `<slot>` are the primary pathways to compose HTML.
In CSS land, `css-variables` and styles are so far open and trodden paths.
JS provides methods on the element object itself.

From an element, one should try to avoid reaching into other documents above or below in the full DOM 
querying the `document.host` (parent) or a child elements `.shadowRoot`.
If you see such queries in your custom element's methods, you are likely doing something wrong and 
following an anti-pattern.
If you are reaching up into your parent, you are likely modelling your element too deeply and 
should instead make the custom element for some ascendant parent of your element.
If you are reaching down into a child's `.shadowRoot`, 
you likely need to set-up one of the other established pathways between your components,
making your own custom child component if you need to [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 

This is the general purpose of shadowDOM: 
to establish borders between parts of the DOM that should only be crossed using a select set of established conventions/pathways.
The more strictly this convention is followed, the safer and more reusable the element becomes,
both from an HTML, a CSS, and a JS standpoint.

## Opinion about HTML composition using `<slot>`
HTML composition is to create new DOM structures by combining html elements.
HTML composition using `<slot>`s is always complex, and especially when:
* `<slot>` elements are chained like in the `MarriedManBucketList` example, and
* when elements that are slotted or siblings of slotted elements are dynamically added and removed from the DOM.

To reduce the complexity, try to avoid dynamically (from JS) altering slotted elements inside shadowDOMs, 
and reserve dynamically adding elements that are slotted for the main, top-level document.
Also, when you make elements that you intend to use inside other elements,
use ChildrenChangedMixin if you need to react to the dynamic DOM and try to follow 
the patterns described in chapter 4.
There are many requirements that needs to be preserved when making a custom elements reusable 
from both HTML, CSS and JS at the same time,
and the complexity cost of HTML composition shortcuts should *not* be underestimated.

## References