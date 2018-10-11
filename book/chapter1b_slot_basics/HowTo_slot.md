# `<slot>` is a list of nodes

The `<slot>` element differs from other HTML elements in two ways:

1. `<slot>` elements are HTML variables. We saw how that worked in the previous chapter.  
`<slot>` only reserve space for other DOM nodes that will be transposed there 
when the DOM is flattened.

2. In the flattened DOM the `<slot>` elements will be swapped out for their `.assignedNodes()`.
But, more than one node might be assigned into the same `<slot>`.
So, in the flattened DOM, the `<slot>` node may be replaced by either 
zero, one or several other DOM nodes. Hence, in the flattened, normalized DOM 
the slot no longer represent an individual DOM node, but rather a **list** of DOM nodes.
This behaviour is unique to `<slot>` elements; 
all other HTML elements represent singular DOM nodes in both 
the shadowDOM, lightDOM and flattened DOM.
(The HTML `<template>` element with its `.content` property echoes this behavior,
but it is not transformed in such a way when the DOM is flattened).

A single <slot> element represent a **list** of DOM nodes.

To see which nodes are assigned to a `<slot>` element, use `.assignedNodes({flatten: true})`.
To see only which *elements* are assigned to a `<slot>`, use `.assignedElements({flatten: true})`.

By default, you should use these two methods with `{flatten: true}` setting set.
The reason for this, as we will discuss more in depth later, 
is that your custom element can be used inside the shadowDOM of other custom elements.
When this happens, your element's slot can be filled with the slot elements of the outer custom element.
And when this happens, you are rarely interested in these elements as slots, 
but would like to work against them as *flattened*.
Rule of thumb is: Always use `.assignedNodes({flatten: true})` and `.assignedElements({flatten: true})`
unless you explicitly know you only want the immediate child of the parent.

## Example: Different usages of GreenFrame
In this example we use the same `<green-frame>` custom element to 
frame 4 different set of HTML elements: 
an `<img>` node, a `<div>` node, two `<img>` nodes, and no nodes.

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

<!--1-->
<green-frame id="one">
  <img src="aNicePicture.jpg" alt="a nice picture">
</green-frame>
<!--2-->
<green-frame id="two">                                                
  <div style="width: 100px; height: 166px;">This is a div with some text</div>
</green-frame>
<!--3-->
<green-frame id="three">                                                
  <img src="picture1.jpg" alt="a picture" />          
  <img src="picture2.jpg" alt="another picture" />          
  <div style="width: 100px; height: 166px;">And some text</div>
</green-frame>
<!--4-->
<green-frame id="four"></green-frame>                                  
```
1. The **`assignedElements({flatten: true})`** of the `<slot>` inside `<green-frame#one>` is simply `[<img>]`.
2. The **`assignedNodes({flatten: true})`** of the `<slot>` inside `<green-frame#two>` is 
`[textNode, <div>, textNode]`.
The textNodes are the new-line and whitespace in front of and after the `<div>`.
3. The `assignedNodes({flatten: true})` of the `<slot>` inside `<green-frame#three>` is 
`[textNode, <img>, textNode, <img>, textNode, <div>, textNode]`.
Several elements are added.
4. The `assignedNodes({flatten: true})` of the `<slot>` inside `<green-frame#four>` is `[]`.
When no DOM nodes are assigned, the `<slot>` is empty and essentially just removed in the flattened DOM.

## References
 * [MDN: assignedNodes](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedNodes)

#### OLD Function: `HTMLSlotElement.assignedNodes({flatten: true})` and `HTMLSlotElement.assignedElements({flatten: true})`
For DOM nodes that do not have a `<slot>` child, 
the list of child nodes in the flattened DOM is the same as the list of child nodes in the lightDOM: `.childNodes`.
But, DOM nodes that a) are *inside* a ShadowDOM and b) has a `<slot>` child,
the list of child nodes displayed in the view (in the flattened DOM) is not `.childNodes`:
when the DOM is flattened, `<slot>` element are replaced by their `.assignedNodes()`, recursively.

To do so, use `.assignedNodes({flatten: true})`. 
The `.assignedNodes` function now replaces all `slot` nodes in a node list
with their `.assignedNodes()`, recursively, and returns a completely flattened version 
of the node list.

You also have `.assignedElements()` and `.assignedElements({flatten: true})` which produce the 
same result, only this time only including the element nodes, not text or comment nodes.


 
<!--
`<slot>` elements can only be used inside a shadowDOM. 
When a `<slot>` element is instantiated in a shadowDOM document as a `<slot>` node, 
the `<slot>` node will get zero, one or several other "normal" nodes *assigned* to it.
These nodes are retrieved from the lightDOM of the children of the `host` node.
Once placed in an actual DOM, the `<slot>` node's variable value gets resolved and the result 
of this can be retrieved with the `<slot>` node's `.assignedNodes()` method.

The view in the browser uses the DOM as it's basis of representation.
Before shadowDOM and `<slot>` elements this was just one thing.
But in the post shadowDOM era, the actual DOM now has two representations:
1. **the (normal) DOM** with `<slot>` nodes still in place, and
2. **the flattened DOM** where all the `<slot>` nodes are replaced with their `.assignedNodes()`.

> ?? todo a diagram of the flattened DOM. With a picture describing the `assignedNodes()` of each slot
And pointer's to what is the lightDOM and shadowDOM of each entity.??
-->