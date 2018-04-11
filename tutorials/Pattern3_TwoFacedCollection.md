# Pattern two-faced-collection (OlLi)

Two-faced-collection is a pattern for creating a certain type of custom element collections.
An HTML collection element is defined as an HTML element that needs to handle a group of items (children) **of unknown quantity**.
The two-faced-collection pattern is needed for HTML collection elements that need to either:
1. control changes for individual child elements based on information from the group as a whole, or
2. work with the spaces between each element.

HTML collections that do not need to interact with individual children based on group status, 
or work with the conceptual space between children elements, 
can simply put all such elements into a single slot and be done with it. 
HTML collections that handles a group of items (children) *of known quantity* 
can simply use named slots.

The container and the item type in the two-faced-collection pattern are strongly codependent.
Do not attempt to generalize the usage of each type to function independently, but treat them as 
inseperable and use them together as a pair.

### Example: custom OL+LI pair
To illustrate the two-faced-collection pattern, I will make a custom implementation of an ordered list (OL+LI).
The example uses [ChildrenChangedMixin](ChildrenChangedMixin.md) so that it automatically updates itself when new
child Li are added to the dynamic DOM and so that it can handle slotted Li elements on par with normal Li elements.

#### Defining and using two custom element types
```javascript
import { ChildrenChangedMixin } from "https://unpkg.com/joicompontents@1.1.0/src/ChildrenChangedMixin.js";

class OlWc extends ChildrenChangedMixin(HTMLElement) {
                                                                                
  connectedCallback() {                                           
    super.connectedCallback();
    this.style.paddingLeft = "20px";
    this.style.display = "block";
  }
  childrenChangedCallback(oldChildren, newChildren, isSlot) {     //[2]
    newChildren
      .filter(item => item instanceof LiWc)
      .forEach((el, i) => el.updateNumber(i + 1));
  }
}

class LiWc extends HTMLElement {

  connectedCallback() {
    super.connectedCallback();
    this.attachShadow({ mode: "open" });
    this.style.display = "inherit";
    this.shadowRoot.innerHTML = `<span>#.</span><slot></slot>`;   //[1]
  }
  updateNumber(num) {                                             
    this.shadowRoot.children[0].innerText = num + ". ";           //[3]
  }
}

customElements.define("ol-wc", OlWc);
customElements.define("li-wc", LiWc);
```
__Explanation__
1. The LiWc item element (LI) sets up a default shadowDom in which the number of the LI element thus far
is unspecified (`#. `).
2. When the OL is first connected, or whenever the list of visible children changes, 
the `childrenChangedCallback(...)` is triggered. This method iterates the list of children 
and notifies all LI children about their LI-only order in the list by calling `el.updateNumber(i+1)`.
3. When the LI element is notified about an updated position in its list, 
it updates it shadowDom to display that position.


The OlWc container element (OL) can contain several LiWc item elements (LI) as children.
These elements can be added in the template (as in the example below), added dynamically via 
`querySelector("ol-wc"").appendChild(newLiChild)`, or as a slot inside another custom element.
```
<ol-wc>
  <li-wc>one</li-wc>
  <li-wc>two</li-wc>
  <li-wc>three</li-wc>
</ol-wc>
```
Which looks like so:

```text
  1. one
  2. two
  3. three
```

## Why do we need a component pair for this type of lists?
we need to avoid updating the DOM of arbitrary child elements. 
The Item type (ie. LI element) functions as a wrapper in which 
the container element can modify the shadowDom and style.

This pattern becomes more important when you need 
1. to add more complex functionality such as custom UIX event handling etc to the element,
2. add more complex template or style to the shadowDom, or
3. handle the children differently either based on their content, their type and/or their position
in the collection.


1. HTML is a declarative language. HTML iteration is based on list of children. 
2. HTML does not have for-loops, instead it has a list of children (and list of attributes). 
The DOM can be manipulated from outside contexts such as JS. 
These contexts can have a changing time dimension, and thus dynamically change the DOM and the list of children for HTML elements. 
Child elements is the HTML equivalent of a for-loop.
3. Because HTML iteration is based on list of children, whenever you need to manipulate the DOM between 
elements in a sequence, you must make wrappers around those elements. This wrapper is the LI-type element.
4. The relationship between the container (UL-type) element and the item (LI-type) element is 
that the child must trigger an organizing function in the parent container in connectedCallback, 
or better in the childrenChangedCallback (that will batch several such connectedCallbacks). 
The parent can then update the content of each individual child.
5. The implied golden rule is that HTML elements should try to avoid changing the DOM of 
unrelated HTML elements. The reason is that in order to achieve some visual or other effect, 
the container component needs to add some style features, attributes, DOM-content or otherwise 
ALTER the child elements ligthDOM or shadowDOM data. To alter a child's data is a breach of the 
HTML contract. It is a golden rule that unrelated elements do not override or alter each other. 
Therefore, when a container needs to do substantial work on its children, then they need to have 
a container element for each child, so that the unrelated child content is not disturbed. Hence, 
the ul-li pair pattern.

### Test
[Test on codepen](https://codepen.io/orstavik/pen/KoeLme)

### Opinion
This pattern might feel a bit wrong at first, especially if you are a javascript developer.
In JS, it would be wrong to create two types (two classes) in order to create a custom collection
with custom behavior into which to put objects: you don't need to create an ItemClass in order to
wrap objects you put in a CustomCollection.
