# WhatIs: shadowDOM

**ShadowDOM** is the name we use about the inner HTML documents inside web components.
It is called the shadowDOM because:
1. when you look at this document from the HTML document in which a custom element is placed, then 
2. the inner document of that custom element is intended **not** to be seen, 
   to be encapsulated in a black box and hidden from view, metaphorically "in the shadows".
   
Conversely, the **lightDOM** is the name of the HTML document where the custom element (`host` node)
is used. All the HTML elements in this document is supposed to be seen. As they are visible and open,
the developer should both know about them and from this context use JS to manipulate them.
These nodes are "in the light".

Soon, we will make these terms a bit more complicated as we start using web components inside 
other web components. But until then, think of the **shadowDOM** as the document inside 
the web component and the **lightDOM** as the document around the web component's `host` node.

## Example: `<green-frame>` with two slotted nodes

In this example we use the same `GreenFrame` web component, 
but this time we will fill it with two slottable nodes.

```html
<script>
  class GreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 10px solid green;
          }
        </style>

        <div>
          <slot></slot>
        </div>`;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>
  <h1>Hello </h1>
  <p>world!</p>
</green-frame>
```

Below is the diagram that illustrates how this all fits together.
The diagram also illustrate what is the **shadowDOM** and the **lightDOM**
for the `GreenFrame` custom element in this example.

<img width="100%" src="svg/2slots.svg" />

## What happened?

1. The browser constructed and processed the source file in the same manner as in 
   the previous chapter and example.
2. This time, however, two elements: `<h1>Hello </h1>` and `<p>world!</p>`,
   was placed as slottable nodes for the `<green-frame>` element.
3. Both of these nodes therefore gets "transposed"/"kidnapped" by the inner `<slot>` element
   when the DOM is flattened.
4. But, we end up getting 5 DOM nodes being slotted. This is because `<slot>` elements can be filled
   with both HTML elements and HTML text nodes.
   When the browser flattens the DOM, whitespace between element start and end tags are considered text nodes.
   These text nodes are therefore also kidnapped/transposed. 
   
   We can illustrate this by adding dots and newline symbols in the above text, 
   like this: 
   
```
   <green-frame>↵
.....<h1>Hello </h1>↵
.....<p>world!</p>↵
...</green-frame>
```

   The five slottable nodes that end up being slotted are therefore:
   1. text node: `↵.....`
   2. element node: `<h1>Hello </h1>`
   3. text node: `↵.....`
   4. element node: `<p>world!</p>`
   5. text node: `↵...`

## References
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom