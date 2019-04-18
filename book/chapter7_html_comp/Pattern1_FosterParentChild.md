# Pattern: FosterParentChild

> todo test this out

```html
<script>
  class UlLi extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(*)::before {
            content: " * ";
          }
        </style>
        <slot></slot>`;
    }
  }

  customElements.define("ul-li", UlLi);
</script>

<ul-li>
  <div>one</div>
  <div>two</div>
  three
</ul-li>
```

## the DOM is always a one-way, one-to-many parent-child tree

By default, the DOM is structured as a tree of nodes.
Instances of HTML elements can be connected to the DOM tree as DOM nodes.
Every DOM node has two properties: `.children[]` and `.parent`.
The `.children[]` of a DOM node can point to several other elements, but 
the `.parent` property can only have *one parent at the same time*.
The browser makes sure that every time a DOM node is added, removed or moved,
all the `.children[]` and `.parent` are always properly updated.
This means that an instance of an HTML element can *only* be placed 
in *one* position in *one* DOM tree at the same time, and
we therefore say that the DOM is structured one-way, top-down, parent-to-child.

So, when we put together *instances* of HTML elements as DOM nodes in a DOM tree,
we can think of each node as always *both* a parent to a collection of other nodes,
and as one of several children of yet another node.
Each list of children is always open-ended, while each parent is always singular.

The purpose of any new HTML element is to be put inside a DOM:
it is only in the DOM we can see it, and 
it is only in the context of the DOM JS code of an HTMLElement *should* run.
So, when we make new *types* of HTMLElement, 
we can and should always assume the context of the DOM surrounding new instances of it.  
When we use it, the new HTMLElement will be a DOM node, and 
DOM nodes always has a) a single parent and b) an open-ended set of children.
Therefore, we do not *have to* specify this one-way, one-to-many parent-child relationship
between HTMLElements because it's just there, it's a fact of life for 
any meaningful instance of HTMLElement.

But, what does this mean? 
How does the always present list of `.children[]` and `.parent` 
shape the way we think of new *types* of HTMLElement?

## FosterParentChild - generous parents and flexible children

When an element always has a parent, it is always a child.
And when an element always has a set of children, it is always a parent.
However, the DOM context does *not* specify which element type that should be another elements 
parent, *nor* what type of elements can be another's children.
Furthermore, the DOM context anticipates elements being moved from one parent to another at short notice.

This means that an HTMLElement by default should expect to get new children elements.
Other elements can be added to its list of children at any time *from the outside*.
It is like a FosterParent who generously accepts that new children of any type 
both come and leave on short notice.                      
Because of this potentially temporary connection, the parent cannot assume 
to neither be in control nor have access to the child.
Therefore, the parent element do and should keep bindings to its children loose and generic.
For example, if the parent reserves an area in its viewport to a particular child,
and that child is then moved away, that area will leave a blank hole.

This also means that an HTMLElement by default does not have a fixed parent type.
The element can be moved from parent to parent at any time *from the outside*.
It is like a FosterChild who must flexibly adapt to new surroundings and 
who is still expected to remain intact and whole.
Again, because the connection to its parent is potentially temporary, 
the child cannot depend too much on its parent, 
because that particular parent might not be there in the future.
For example, if data about the child is stored under the parent, 
that data is no longer accessible through the `.parent` property if the child is later moved.

Because the HTMLElements can be moved, we can therefore formulate the following guiding 
principles for the FosterParentChild pattern:
* Positive: store its state information within itself.
  * Negative: state information should not be stored in neither parent, children, nor siblings in the DOM
* Plus: keep its functions free of bindings to its outside apart from the DOM as a whole.
  * Negative: do not rely on a particular parent, ancestor, sibling, child, nor descendant in its functions and methods.

Examples of native HTML elements that follow the FosterParentChild pattern are 
`<div>`, `<p>`, and `<h1>`.
A `<div>` can be placed and moved anywhere, display and receive any child element. 
However, in HTML there are also many exceptions, or extensions, of this pattern:

1. Some element types do not accept children([CulDeSacElements](Pattern3_CulDeSacElements.md)).
Examples of such an element are `<img>`, `<style>`, and `<script>`.
These elements follow the FosterChild patterns, but not the FosterParent pattern.

2. Some element types depend on a special, unbreakable bond between parent and child
(see [HelicopterParentChild](Pattern2_HelicopterParentChild.md)).
Examples of such elements are `<table>`+`<tr>` and `<html>`+`<head>`&`<body>`. 
In this pattern the HelicopterParent breaks the FosterParent pattern but not the FosterChild pattern,
while the HelicopterChild breaks the FosterChild pattern but not the FosterParent pattern.

3. the root `document` node that defines the DOM tree has no parent.

To better understand FosterParentChild pattern, I will reimplement the 
classic HTML `<ul>`+`<li>` (Unordered List) as a single custom element called `<ul-li>`.
This aims to illustrate how the `<li>` element also can be viewed as 
a FosterChild, ie. adoptable by any parent and whole and intact on its own.
                     
### The `<ul-li>` element example
First, let's look at what the normal `<ul>`+`<li>` looks like:

```html
<ul>
  <li>one</li>
  <li>two</li>
  <li>three</li>
</ul>
```
Which becomes:

<ul>
  <li>one</li>
  <li>two</li>
  <li>three</li>
</ul>

The `<ul>...</ul>` element signifies the start and the end of the list. 
The `<li>...</li>` the start and end of each item. So far, so good.
But as we saw above, all the `<li>` elements listed sequentially are implicitly children of a list. 
So, is `<ul>...</ul>` really necessary? Can't we just make an element `<ul-li>...</ul-li>` that does
not require a particular `<ul>` parent? Let's try!

```html
<ul-li>one</ul-li>
<ul-li>two</ul-li>
<ul-li>three</ul-li>
```
Such a `<ul-li>` would need to:
1. add a bulletpoint infront of its content, 
2. some paddding, and 
3. "display: block". 

Sure, that sounds simple enough. Let's define the custom element in JS:

```javascript
class UlLi extends HTMLElement{
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
                                                                                
  connectedCallback() {                                           
    super.connectedCallback();
    this.style.display = "block";
    this.style.padding = "1em";
    this.innerHTML = "<span style='margin-left: -0.6em'>*</span><slot></slot>";
  }
}

customElements.define("ul-li", UlLi);
```
