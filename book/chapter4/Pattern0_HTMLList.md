# Pattern: OrphanElements

## Default structure of HTML elements
Because every element is always implicitly part of a list, 
when making HTML elements that are essentially list items or pieces in a collection,
the element(s) is(are) often exclusively defined as an item relying solely on 
the default, implicit list they are part of as a child of whatever element happen to be their parent.
This is counter-intuitive if you look at the problem as a JS developer. 
If a JS developer would organize elements in a list, 
he/she would also think about and construct that array or collection that element should be a part of.
In HTML this parent is often deliberately avoided, so as to free the element to be placed 
under many different types of parent elements without a problem.
The HTML element is designed as an "orphan" that can be adopted by parent elements 
of many different types, and also dynamically passed around between different parents at run-time.

Most HTML elements function like this: `<div>`, `<p>`, `<img>`, `<h1>`, `<table>`, etc. 
They all are orphans, potential children of most other elements. Their parent is not designated 
until it is actually housed somewhere. Using HTML you might be familiar with this logic.
But, to develop such elements, especially working with them with your JS thinking cap on, 
it can be a bit puzzling. When developing orphan HTML elements, you must consciously **not** 
make the container, only the item to be put there.
                     
### The `<ul-li>` element example
This is a curve ball for the mind. And so to help you understand it, I will implement the 
classic HTML `<ul>`+`<li>` (Unordered List) as a single custom element called `<ul-li>`. 
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