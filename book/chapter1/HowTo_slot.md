# `<slot>` is a list of nodes

The `<slot>` element differs from other HTML elements in two ways.
The first we have already seen. `<slot>` elements are variables. 
They only reserve space for other DOM nodes that will be transposed there when the DOM is flattened.

But! Secondly. In the flattened DOM the `<slot>` elements will be 
swapped out for their `.assignedNodes()`.
So, in the flattened DOM, the `<slot>` node may be replaced by either 
zero, one or several other DOM nodes. Hence, in the flattened, normalized DOM 
the slot no longer represent an individual DOM node, but rather a **list** of DOM nodes.
This behaviour is unique to `<slot>` elements; 
all other HTML elements represent singular DOM nodes in both 
the shadowDOM, lightDOM and flattened DOM.
(The HTML `<template>` element with its `.content` property echoes this behavior,
but it is not transformed in such a way when the DOM is flattened).

In simple custom elements, this **list** behavior of `<slot>`s is easy to grasp.
Let us look at some examples

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
<green-frame id="one"><img src="aNicePicutre.jpg" alt="a nice picture"></green-frame>
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
1. The `assignedNodes()` of the `<slot>` inside `<green-frame#one>` is simply `[<img>]`.
2. The `assignedNodes()` of the `<slot>` inside `<green-frame#two>` is `[textNode, <div>, textNode]`.
The textNodes are the new-line and whitespace in front of and after the `<div>`.
3. The `assignedNodes()` of the `<slot>` inside `<green-frame#three>` is 
`[textNode, <img>, textNode, <img>, textNode, <div>, textNode]`.
Several elements are added.
4. The `assignedNodes()` of the `<slot>` inside `<green-frame#four>` is `[]`.
When no DOM nodes are assigned, the `<slot>` is empty and essentially just removed in the flattened DOM.
