# Pattern: MiniMeDom 

Do you need an EvilTwin? Or to just double-down on your DOM?
How do you mirror parts of your DOM branch when you need it? 

## Why and how to make multiple views of a single data structure?
Sometimes you need to make a dual presentation of a single data structure:
In a book the index gives a mini summary of the books content as a list of the chapter headings;
In a newspaper you need a magnifier function on an image that zooms in and displays on an image selection;
In a code editor a minimap can display the entire text of document in micro letters;
Or maybe you want to do something artistic like creating a skewed reflection of an image so as to
imitate an object standing on glass surface.
In any case, you have a single data structure (an image or a group of text elements) that you need to 
present in two parts of your view.

The best way to achieve such an effect is to clone parts of the original data structure and 
add it to the view.
By programmatically cloning the elements 
you avoid managing a double, redundant data structure manually in your template.
In a web app this is simple.
The template is the HTML document.
The data structure is the DOM, the Data Object Model. 
And so you write a single branch with one or more data entries in your HTML template, and 
then in the DOM you clone that branch, manipulate the cloned branch to suit your need, and 
then attach it somewhere else in the DOM.

However, problems might arise *after* the clone has been added. 
Let's exemplify such problems in the newspaper with the magnify-image function.
1. Let's say the newspaper updates its images during a live event. 
If a user is watching a preview of an image that is suddenly updated, 
how should the magnify function react to that?
2. Let's say the newspaper uses an old function that reports every time an image 
is presented in the newspaper in order to calculate provisions for the photographers.
How should this function avoid charging the newspaper twice for the same image simply being magnified?

When making a clone of a branch in the DOM, the clone must: 
1. React appropriately to any changes made to the original in the DOM. 
Such changes might be the original being added, removed or moved in the DOM.
And when a wider branch is cloned, these changes applies to all parts of the original that affect the clone.
2. The cloned DOM should most often be separated from other functionality in the DOM.
The cloned view is rarely relevant for other functions in your web app,
and should therefore most often be separated and hidden in order not to interfere with other functions.

## cloned DOM => ShadowDom + HelicopterParentChild => MiniMeDom
ShadowDom provides a great fit for many of these problems.
First, shadowDom enables you to easily separate and hide the cloned view from the main DOM, solving issue 2.
Second, shadowDom is an encapsulation mechanism that can bind the adding/removing of an original data 
entity with the adding and removing of the cloned view entity via 
`connectedCallback()`/`disconnnectedCallback()`.

One problem remains though. What if the branch of the DOM that you need to clone is more than a single root element?
How do you watch the changes of relevant child entries?
There are two mechanisms to accomplish this.
The first is to add an observer to the root node that observes the children of all the relevant decendants.
However, if only a particular selection of your DOM needs to be observed,
an alternative approach is to use the HelicopterParentChild for the original structure to be cloned,
intercept the `connectedCallback()`/`disconnnectedCallback()` for the HelicopterChild,
and use the HelicopterParent to construct and display the cloned view, the MiniMeDom.
The MiniMeDom requires the `.getVisibleChildren()` function from the `SlotchangeMixin`:

```javascript
//todo change to flattenNodes(nodes)!!
function getVisibleChildren(el) {
  let res = [];
  for (let i = 0; i < el.children.length; i++) {
    let child = el.children[i];
    if (child.constructor.name === "HTMLSlotElement") {
      let assignedNodes = child.assignedNodes();
      for (let j = 0; j < assignedNodes.length; j++)
        res.push(assignedNodes[j]);
    } else
      res.push(child);
  }
  return res;
}
```
## Example: a book with an index

```javascript

class theBook extends HTMLElement {

  constructor(){
    super();
    this.attachShadow({mode:"open"});
    this._newChapterListener = this.newChapter.bind(this);
    this._delayedRenderer = undefined;
  }

  connectedCallback(){
    this.addEventListener("new-chapter", this._newChapterListener);
    this.shadowRoot.innerHTML = `
      <div id='index'></div>
      <slot></slot>
    `;                                               
  }

  disconnectedCallback(){
    this.removeEventListener("chapter-changed", this._newChapterListener);
  }
  
  newChapter(){
    if (this._delayedRenderer)
      return;
    this._delayedRenderer = requestAnimationFrame(() => {
      const index = this.shadowRoot.children[0];
      index.innerHTML = "";
      const listOfChapters = this.getAllChapters();
      const chaptersAsLinks = listOfChapters.map(entry => this.makeIndexLink(entry));
      for (let link of chaptersAsLinks) {
        index.appendChild(link);
      }
      this._delayedRenderer = undefined;
    });
  }

  getAllChapters(){
    let result = [];
    let chapters = this.getVisibleChildren().filter((c) => c instanceof aChapter);
    for (let i = 0; i < chapters.length; i++) {
      let chapter = chapters[i];
      result = result.concat(chapter.getChapters([i+1]));
    }
    return result;
  }
  
  makeIndexLink([pos, title]){
    const link = document.createElement("a");
    link.innerText = pos.join(".") + ": " + title;
    link.href= "#chapter_" +pos.join(".");
    return link;
  }

  getVisibleChildren(){
    for (let i = 0; i < this.children.length; i++) {
      let child = this.children[i];
      if (child.constructor.name === "HTMLSlotElement") {
        let assignedNodes = child.assignedNodes();
        for (let j = 0; j < assignedNodes.length; j++)
          res.push(assignedNodes[j]);
      } else
        res.push(child);
    }
    return res;
  }
}

class aChapter extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = "<h2>x: Chapter title</h2><slot></slot>";
    this.dispatchEvent(new CustomEvent("chapter-changed", {composed: true, bubbles: true}));
  }
  
  disconnectedCallback() {
    this.dispatchEvent(new CustomEvent("chapter-changed", {composed: true, bubbles: true}));
  }
  
  getChapters(pos) {
    this.id = "chapter_" +pos.join(".");
    const title = this.getAttribute("title");
    this.shadowRoot.children[0].innerText = pos.join(".") + " " + title;
    let result = [[pos, title]];
    const childChapters = this.getVisibleChildren().filter(c => c instanceof WcChapter);
    for (let i = 0; i < childChapters.length; i++) {
      let child = childChapters[i];
      result = result.concat(child.getChapters(pos.concat([i+1])));
    }
    return result;
  }
}

customElements.define("the-book", theBook);
customElements.define("a-chapter", aChapter);
```

These two components are then used like this:

```html
<style>
  the-book,
  a-chapter {
    display: block;
  }
</style>
<the-book>
  <a-chapter title="Chapter one">                               <!--adding the DOM to be cloned as an attribute-->
    Text introducing Chapter one.
    <a-chapter title="Chapter one dot one">
      Text inside the first sub-chapter.
    </a-chapter>
    <a-chapter title="Chapter one dot two">
          Text inside the second sub-chapter.
    </a-chapter>
  </a-chapter>
  <a-chapter title="Chapter two">
    Text introducing Chapter two.  
  </a-chapter>
</the-book>
```
which looks like:


### Discussion of the cloneable structure
Should one use attributes in the child? 
Or look for some particular value in the lightDOM of the child?
There are benefits and drawbacks from both approaches..

DOM in attributes, or from the content of the children? Attributes.
This pattern is based on top of the HelicopterParentChild.
A. You need info about a group of elements in two separate branches of the DOM.
Add a custom attribute or two to the element, pick them up and make a new DOM tree from it.
This second tree is non-composeable, only ONE of the subtrees can be composed.
