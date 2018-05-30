# lightDOM and shadowDOM

## Example 1: `BucketList`
To illustrate the concept of lightDOM and shadowDOM, 
we start with a simple example with low ambitions: `BucketList`.
The `BucketList` is a list of important things to do in life.
It anticipates to be filled with a series of `<div>`s with text, which it will center-align.
Here is what it looks like:

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
The `BucketList` uses a `<slot>` element as a placeholder in its shadowDOM document 
(ie. `this.shadowRoot`).
When the `<bucket-list>` is instantiated in the DOM, 
the `<slot>` refers to `div#one` and `div#two`.
`flattenedChildren(this)` would return `[div#one, div#two]`;
`flattenedChildren(this.shadowRoot)` would return `[style, div#one, div#two]`.

So far, there is a simple distinction between the shadowDOM and the lightDOM 
from the point of view of the `BucketList` element:
The shadowDOM is the DOM under the attached shadowRoot, ie. `style` and `slot`;
The lightDOM is the "another document" with its elements `bucket-list#list, div#one, div#two`.
We say that the `<slot>` transposes a set of actual elements from the lightDOM into the shadowDOM.

## Example 2: ManBucketList
Let's up our ambitions a bit and make a bucket list for men: `ManBucketList`.
Being human, men's ambitions are driven by what they see around them every day.
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
The elements added in the list of things to do before the man dies now clearly originates 
from different origins.
The elements in our `BucketList` is *mixed* together from two different HTML documents, 
from both the shadowDOM and the lightDOM of our `man-bucket-list#list`.
We can see this clearly by calling `flattenedChildren(this.shadowRoot)` which returns 
`[style, div#man, div#one, div#two]`.
Let's see how this evolves.

## Example 3: `MarriedManBucketList`

In this last example we will see how this list can evolve when 
we add yet another document source for bucket list items: marriage.

When men get married, their original ambitions and goals in life gets wrapped up in their marriage.
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
        <div id="dirtywork">fix her car</div>
        <div id="dirtywork2">fix the plumbing</div>
        <div id="hardwork">make more money</div>
        <div id="suffering">paint the fence, again</div>
        <div id="pain">bite your tongue</div>
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
This example illustrate the problem of using one custom element 
inside the shadowDom of another custom element.
(cf. Web components gold standard on content assignment).
Here, `flattenedChildren(this.shadowRoot)` returns a much longer list:
`[style, div#man, div#love, div#romance, ..., div#one, div#two]`.
The bucket list items of `ManBucketList` are still there, 
the only difference being that they now also include
a long list of goals intrinsic to `MarriedManBucketList`.

### What exactly is shadowDOM and lightDOM?

From the point-of-view of `ManBucketList`, the shadowDOM is still only `[style, div#man, slot]`.
But, what is `MarriedManBucketList`'s shadowDOM? 
In the DOM, `ManBucketList`'s shadowDOM is organized *under* `MarriedManBucketList`'s shadowDOM.
It is a sub-document.
So, are such sub-documents part of a shadowDOM?

The answer is "no".
The sub-document's elements are not directly part of the `MarriedManBucketList` document.
Sub-documents cannot be directly styled or querySelected from the scope of a parent document in the DOM.
And, although possible, elements in sub-documents should not be directly queried nor manipulated from the scope of the parent document.
So even though the document of `ManBucketList` is wrapped in and subsumed under the shadowDOM of 
`MarriedManBucketList`, the shadowDOM scope of `MarriedManBucketList` does not *reach into* that of `ManBucketList`.
If it does, then that is a hack and breach of contract.

The lightDOM scopes are the reverse of the shadowDOM scopes.
From the point-of-view of `MarriedManBucketList` the lightDOM is simply *another document*.
For custom elements added to the main document, the lightDOM is always the main document.
But, the two `<slot>` elements in `MarriedManBucketList` and `ManBucketList` form a chained reference.
This chain transposes elements from *another document*, via `MarriedManBucketList` shadowDOM, and 
down into `ManBucketList`.
Does that mean that the lightDOM of `ManBucketList` spans both 
*another document* and the shadowDOM of `MarriedManBucketList`?

Again, the answer is "no".
Even though actual elements can be transposed across three or more documents using `<slot>`s,
the term lightDOM is still only used about the document in which the `host` 
of the custom element is instantiated.
In this instance, the lightDOM of `ManBucketList` is the shadowDOM of `MarriedManBucketList`.
This also illustrate that for custom elements used inside another custom elements,
the lightDOM is always the other shadowDom document and *never* the main document.

However, references in `<slot>` elements *can* span across several documents.
And this means that the resolution of `assignedNodes()` and thus `visibleChildren` also span several documents. 
The scope of `<slot>` and `visibleChildren` *does* include all the documents necessary.
So, sometimes an assignedNode of a slot can be found in the lightDOM's lightDOM.
Or an element is transposed to a shadowDOM's shadowDOM. 

# HTML composition / Interaction between lightDOM and shadowDOM

HTML composition is to create new DOM structures by combining html elements.

## How to politely cross the borders of DOM documents? 

The well-trodden pathways to cross document borders are:
 * Adding and removing elements that are "slotted" into shadowDOMs.
 * Passing data as attributes.
 * Setting css classes on elements and CSS variables.
 * Calling methods on JS objects and dispatching events (props down, events up).
 
These pathways should be followed strictly.
Keeping to these pathways makes the element safe and reusable,
both from an HTML, a CSS, and a JS standpoint.
And this is the general purpose of shadowDOM: 
to establish borders between parts of the DOM that should only be crossed using 
a select set of established pathways.

### Webcomponent rudeness: the `DocumentReaching` anti-pattern

Aside from these established pathways, 
altering, passing data or querying inside the scope of another document is an anti-pattern: 
DocumentReaching.
Symptoms of this antipattern are references to:
1. `this.ownerDocument`. This is a reference to the lightDOM document, and should rarely be used.
2. `document.querySelector("xyz")`. This is a reference to the main document, and 
should not be accessed from inside a custom element.
3. `someElement.shadowRoot`. If someElement is not `this` element (and then you should write `this.shadowRoot`), 
you should not interfere with that custom elements orchestration of its shadowDOM elements.

If you are *reaching* across document borders, try to replace the rude approach with a polite approach.
If you are *reaching* up into your parent (1. & 2.), 
you likely need to create a custom element for that ancestor element you are trying to reach.
An alternative solution is switch the position of control from the custom element where you are reaching from 
and into the parent document where you are reaching to.
If you are *reaching* down into a custom element,
you likely need to set-up one of the other established pathways in the custom element 
so that the custom element itself can assume control of the orchestration of its shadowDOM elements.

So, be on your best behavior!
Don't stare at or touch a MarriedMan's wife. 
And don't directly query, manipulate or style another element's shadowDOM.

* Do not underestimate the *cost of complexity* of HTML composition.
Do not *reach* into other documents in order to for example avoid creating another custom element.
It will cost you more in the long run.


## References
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom
 * [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 
