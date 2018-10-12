# WhatIs: `<SLOT>`

## Introduction: The concept of HTML slots
HTML is a language of HTML tags. 
You can put tags next to eachother, and you can put tags inside each other. 
The act of putting together an HTML document by placing HTML tags next to and inside each other is 
called HTML composition.

## HTML tags composed side by side

When you put HTML tags next to each other, 
they will be presented as beads on a string. You may of course use CSS to 
style the structure of this string, make it go upside down, right to left, 
stop after the fifth bead, etc. But, regardless of the shape of the string, 
the beads you put on it is one after the other, sequential.

When you make a web component (a custom HTML tag with an inner html document (a shadowDOM)), 
and place it next to other HTML tags, the web component will
place itself on the screen next to the other tags and 
present its inner html document as its children.
Using web components like this is simple, straight forward.
(And it is a good way to encapsulate HTML and CSS code, 
hiding low level from view and creating several local scopes for CSS, which we really like).  

## HTML tags composed within each other

When you put HTML tags inside each other, you can think of them as frames within frames.
When you set up the first tag, the outer frame, it will fill its own border, 
and create a space for the next frame.
The space for the inner frame we can think of as **a slot**, an opening inside the HTML tag
into which we can put our other tags.

Sometimes, the size of the HTML frame is static, meaning it is fixed from above.
But most HTML frames are elastic, like rubber, meaning that their size and shape 
depends on the size of what is put in the slot.
If the frame receives a small pass photo, it will shrink and wrap itself around the matchbox sized slot.
If the frame receives a large man-sized portait of a medieval king, 
it will grow and wrap itself around that.
And, if there is not enough space around the sides of the frame, 
some frames will adjust their border size, while others will remain fixed and rigid.

HTML tags can also be put inside each other in many levels, like frames within frames within frames etc. etc.
The outer element gives the frame, then comes a passepartout, then another passpartout and on and on,
until the final atomic photo is put in place.
Each frame will preserve **a slot** for its inner content, and each frame will contain its own rules
of whether it should stretch to fill the slot from its parent frame, remain a fixed size, or shrink
to fit the content of its slot.

HTML tags can also *both* contain **several slots** *and* fill **several elements in each slot**.
Each HTML frame control how their different inner slots are positioned against each other.
They can decide to show them side by side, one on top of the other, hide one of them,
stretch one to fit the other, etc. etc.
But, when several HTML tags are put together into the same slot of another the outer tag,
the outer tag will treat the elements as a group. The outer HTML frame will therefore strech to accomodate 
or statically define the frame around this group of HTML tags.

When you make a web component for and place other HTML tags inside that component, 
you therefore need to define the *slot(s)* for those inner HTML tags.
This is done by simply placing a special HTML tag for that element called **`<SLOT>`** 
somewhere in the inner html document of your web component. 
The `<SLOT>` marks the square around which the HTML frame of your web component will wrap itself.

##Example: `<green-frame>` with `<slot>`
In this chapter I will describe how you can use web components in your HTML.    


<img width="100%" src="svg/overview.svg" />

In the beginning I will give a strict rule. Do not use the term "assigned" about the nodes 
that gets slotted 

We start with a simplified overview of some basic principles:

* The **DOM** is the dynamic representation the browser has of the living html document 
that it will display on the screen. The DOM forms a tree of DOM nodes.

* A **DOM node** can be either an HTML element, a text node, or 
a root node to represent another HTML document.
A DOM node is the actual entities that the browser can show on the screen.

* An **HTML element** is a DOM node that is created from an HTML tag.
HTML elements are created and added to the DOM *both* when the browsers parses the main HTML documents
*and* by particular JS functions such as `document.createElement("div")`.

* In addition to the DOM, a browser can also have a series of javascript objects and 
functions living in its memory. These objects and functions are not visible per se,
but can produce dom nodes dynamically that will be visible when added to the DOM.

However, with the advent of shadowDOM, we need a bigger vocabulary to describe the DOM.

* **ShadowDOM** are pieces of DOM that are encapsulated *inside* custom elements as a *separate document*.
A shadowDOM is attached to an element as a `.shadowRoot` property.
As different custom elements are added, the DOM is broken into different parts, different shadowDOMs.
When custom elements are used inside each other's shadowDOMs, 
they also divide the DOM into several layers.

* The **LightDOM** for a particular custom element is the part of the DOM where 
that element's `host` node is placed.

* The **`host` node** is the DOM node of a custom element with a shadowDOM.
The custom element with its `host` node *and* `.shadowRoot` property forms a link
between two different parts and layers of the DOM, between a lightDOM and a shadowDOM.
You can see this layered structure in dev tools.

* A **`<slot>`** is an HTML variable. 
The `<slot>` is a particular type of DOM node that functions as a placeholder for other DOM nodes.
The `<slot>` should only be used inside a shadowDOM, and 
it will essentially "kidnap" one or more of the `.childNodes` of the `host` node in the lightDOM and 
present them as its own children in the "flattened DOM".

* **assignable nodes** are DOM nodes that can be transposed from a DOM 
into the shadowDOM of a custom element.
It is only the direct children of a `host` node that are assignable.
But when a child of a host is assigned, all its descendant are transposed with it.

* A **slot chain** is a series of nested slot nodes.
As custom elements can be used inside the shadowDOM of other custom elements,
slot elements can also be linked to other slot elements. 

* **`.assignedNodes()`** are the set of actual nodes that one `<slot>` element will transpose.
In practice, the `.assignedNodes()` are the `.childNodes` of the `host` node of the custom element.
However, if one of the host node's child nodes also happen to be a `slot`, 
then that `slot` will also be replaced by its `host` `.childNodes`, and so on.

* The **flattened DOM** is the DOM where all `host` nodes are resolved, 
all the assignedNodes are transposed into their shadowDOM positions and 
the lightDOM and shadowDOM are "flattened" as they will be displayed.

## Example: GreenFrame
In this example we create a simple custom element with a shadowDOM. 
The custom element called GreenFrame will add a green border 10px wide around its content.

```html
<script>
  class GreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          :host {
            display: block;                                  
            border: 10px solid green;
          }
        </style>
        <slot></slot>`;                      //[2]  //[5]
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>                                                <!--3-->
  <img src="aNicePicture.jpg" alt="a nice picture">          <!--4-->
</green-frame>
```
1. A `.shadowRoot` is added to the custom element.
2. A `<slot>` element is added in this shadowDOM.
3. A `<green-frame>` host node is created in an HTML document.
The document in which this `host` node exists is the lightDOM 
for the `<green-frame>` custom elements.
4. An `<img>` element is added as child node for the `<green-frame>` host element.
As a direct child of the host node, 
the `<img>` node is an *assignable* node for the `<green-frame>` custom element.
5. The `<slot>` element is assigned to `<img>`.
`.assignedNodes()` on this slot element will return a list with `[textNode, <img>, textNode]`
(the textNodes are the new-line and whitespace characters around the `<img>` element).

We can imagine the flattened DOM looking something like this:
```html
<green-frame>                                                <!--1-->
  <style>                                                    <!--2-->
    __special_selector__ {                                   <!--3-->
      display: block;                                  
      border: 10px solid green;
    }
  </style>
  <slot>
    <img src="aNicePicture.jpg" alt="a nice picture">          <!--4-->
  </slot>
</green-frame>
```
1. The `<green-frame>` host node still exists
2. `<style>` element from the shadowDOM is pulled up into the lightDOM.
3. We can imagine the browser creating a `__special_selector__` CSS selector 
that only applies to this particular branch of the DOM, 
starting from the parent node of this particular style node.
No such node-specific rules exists in normal CSS.
4. First, the `<slot>` node is replaced by its `.assignedNodes()`.
Then these `.assignedNodes()` are pulled up into the lightDOM like the `<style>` element.

## References
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom