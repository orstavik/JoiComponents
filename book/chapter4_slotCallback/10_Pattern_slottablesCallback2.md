# Pattern: `slottablesCallback` based on "`tagName` position"

Native elements, such as `<details>`, do not use the `slot` attribute to position/slot elements. Instead, they rely on another three-step method:

1. A `MutationObserver` that observes all changes to the `<details>` element's host node's `childList`. 

2. The observer looks for the presence of either one or both of the following criteria:
   1. **element `tagName`**. In the case of the `<details>` element, the `SUMMARY` tag. The `tagName` cannot be changed of an `HTMLElement`, even if you dynamically change the `prototype` of the element to something else.
   2. **element position** in the host node's `children` list. In the case of the `<details>` element, a `:first-of-type` CSS selector.
   * Note! The criteria to select slot position *must* trigger a `MutationObserver` observing `childList` changes. Examples of properties that can change in the lightDOM *without* triggering a `childList` in a `MutationObserver` are:
        * HTML `attributes` 
        * element's `prototype` and `instanceof` checks.
   * Note 2! It is possible to observe other properties on the children of the host node using `MutationObserver` that observes one or more particular attributes on all lightDOM children. This might be added in a followup mixin later. However, if you can keep it to only a) `tagName` and b) `tagName` position, this is lighter and faster. 
        
3. The shadowDOM (ie. a function within the web component) then sets an invisible, hidden, "slot"-like property on the lightDOMs children.  

## Which is better? `slot` attribute vs. `tagName` position?
 
The design of the `slot` system is full of minor quirks and bugs. Many problems arise because the `slot` is setup as an element, and not a document fragment. But. The problem of the `slot` attribute being the mechanism for guiding slot position, is not that. Instead, the `slot` attribute problem is that it gives too few abilities for the shadowDOM to *select* its elements, and forces too much control to the lightDOM developer.

## Man in the middle and slot positioning

When you have a two level DOM, one lightDOM and one shadowDOM, both solutions work fine. The problem arise when you have a SlotMatroschka. This is true for both the `slot` attribute and `tagName` position approach.

With the `tagName` position, you might wish to super-transpose a `<slot>` into the position of the `<summary>` element, so as to enable other elements to be slotted in.

We look at the `<details><summary>` element. You are working in a law firm, and this recurring problem arise. Everytime there is a `<details><summary>` in contracts, you are tasked by adding this fine print to the details text: "And if something goes wrong, it is all your fault and you owe us money.".

We do this by wrapping the `<details>` element, like so:   

```javascript
class DevilDetails extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
      <details>
        <summary>
          <slot name="summary"></slot>
        </summary> 
        <slot></slot>
        <h6>And if something goes wrong, it is all your fault and you owe us money.</h6>
      </details>
    `;
    const observer = new MutationObserver(function(data){
      this.slottablesCallback();
    }.bind(this));
    observer.observe(this, {childList: true});
  }

  slottablesCallback(){
    for (let child of this.children) 
      child.slot = "";
    this.querySelector(":scope > summary:first-of-type").slot = "summary";
  }
}
```

When this is used, it looks like so:

```html
<devil-details>
  <summary>
    <h2>This is a good deal</h2>
  </summary>
  You get A, and you give us B.
</devil-details>
```

The technical "problem" is that when you flatten this DOM such as in the composedPath, you get two `<summary>` elements. The `composedPath()` if you click on `<h2>This is a good deal.</h2>` is:
```
h2, summary, slot, summary, details, devil-details
``` 
You might wish that inside the man in the middle, inside the DevilDetails, you 
1. could mark the `<slot>` as the `summary` like element. Ie. that inside the DevilDetails, that you could set the `slot` property of the `<slot>` element, like you can with the `slot` attribute practice.
2. prevent the lightDOM from adding more than one element to the `<summary:first-of-type>` slot position.

To accomplish this, you would need custom logic to observe the `slot` attribute, on children.

```javascript
class DevilDetails extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
      <details-2>
        <slot name="summary" slot="summary-2"></slot>
        <slot></slot>
        <h6>And if something goes wrong, it is all your fault and you owe us money.</h6>
      </details-2>
    `;
    const observer = new MutationObserver(function(data){
      this.slottablesCallback();
    }.bind(this));
    observer.observe(this, {childList: true});
  }

  slottablesCallback(){
    for (let child of this.children) 
      child.slot = "";
    this.querySelector(":scope > summary:first-of-type").slot = "summary";
  }
}

class Details2 extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
      <slot name="summary-2"></slot>
      <slot></slot>
    `;
    const slotAttributeObserver = new MutationObserver(function(mutationList){
      for (let mutation of mutationList) {
        if(mutation.attributeName === "slot" && mutation.target[mutation.attributeName]  === "summary-2"){
          this.slottablesCallback();
          return; //we need only one relevant change.
        }
      }
    }.bind(this));
    const observer = new MutationObserver(function(data){
      //todo we need to remove the slotAttributeObserver when the element is removed from the childList.
      for (let child of this.children) 
        slotAttributeObserver.observe(child, {attributeFilter: ["slot"]});
      this.slottablesCallback();
    }.bind(this));
    observer.observe(this, {childList: true});
  }

  slottablesCallback(){
    const first = this.querySelector(":scope > summary:first-of-type, :scope > [slot=summary-2]");
    for (let child of this.children) 
      child.slot = "";
    first.slot = "summary-2";
  }  
}
```
 
The naive Details2 element above would require lots of hoops to avoid having two summary elements in the composedPath. The path is still riddled with slots and Details. It is not better. Far from it.

On the contrary, the second `<summary>` element signifies that there is actually a two step process for the summary, and not only for the details element. In fact, the summary should be renamed to devil-summary. Like so:

```javascript
class DevilDetails extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
      <details>
        <summary>
          <slot name="summary"></slot>
        </summary> 
        <slot></slot>
        <h6>And if something goes wrong, it is all your fault and you owe us money.</h6>
      </details>
    `;
    const observer = new MutationObserver(function(data){
      this.slottablesCallback();
    }.bind(this));
    observer.observe(this, {childList: true});
  }   

  slottablesCallback(){
    for (let child of this.children) 
      child.slot = "";
    this.querySelector(":scope > summary:first-of-type").slot = "summary";
  }
}

customElements.define("devil-details", DevilDetails);
customElements.define("devil-summary", HTMLElement);
```

and used like so:

```html
<devil-details>
  <devil-summary>
    <h2>This is a good deal</h2>
  </devil-summary>
  You get A, and you give us B.
</devil-details>
```

Which illustrates the structure of the DOM in the composedPath:
```
h2, devil-summary, slot, summary, details, devil-details
``` 

## References

 * 
 
