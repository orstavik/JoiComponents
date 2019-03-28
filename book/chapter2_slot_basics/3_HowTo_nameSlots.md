# WhatIs: `slot` and `name` attributes

A web component can contain several different slots.
By including several different slots, the browser can place different lightDOM elements in different
positions in its shadowDOM.

To place different lightDOM elements in different positions in the shadowDOM, 
the web component needs to differentiate:
 * between the different `<slot>` elements in the shadowDOM, and 
 * which slotable node in the lightDOM belongs to which shadowDOM `<slot>` element.

To distinguish between different `<slot>` elements in the shadowDOM, 
each `<slot>` element is given a `name` attribute, for example:
`<slot name="label">`. If a `<slot>` element has no `name` attribute, 
the `name` value is *the empty string `""`*, the same as an empty `name` attribute would produce.

To identify which slotable node belongs to which `<slot>`,
the lightDOM elements is given a `slot` attribute.
If you assign no `slot` attribute to a slotable element or node,
the `slot` attribute value would still be considered `""`.
Thus, the `slot` and `name` attributes echo each other.
As text DOM nodes cannot be given an attribute value, all slottable text node would be filled into 
the default, empty-name `<slot>` element.

## Example: `<green-frame>` with a label

In this example we use the same `GreenFrame` web component,
but this time we will add a label to our frame.
To do so, we need to add a second `<slot name="label">` element in `GreenFrame`'s shadowDOM,
and we add two slottable elements in the lightDOM, the second with a `slot="label"` attribute.

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
            position: relative;
          }
          slot[name="label"]{
            position: absolute;
            bottom: -4px;
            margin: auto;
            height: 8px;
            background: white;
            font-size: 8px;
          }
        </style>

        <div>
          <slot></slot>
          <slot name="label"></slot>
        </div>`;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>
  <img src="picThis.jpg" alt="can you imagine">
  <span slot="label">Yes we can!</span>
</green-frame>
```

Below is the diagram that illustrates how the two different elements gets flattened.

todo

## What happened?

1. The browser constructs and processes the source file as in the previous chapters/examples.
2. When flattening the DOM, the browser sorts the slotable DOM nodes into a map based on their `slot` attribute.
   Any dom node without a `slot` attribute, is assigned to the empty-string `""` group.
3. In the flattened DOM it then transposes (moves) these slotable nodes under each corresponding `<slot>`.

 * If there are several `<slot>` elements with the same `name` value within a shadowDOM, 
   the first `<slot>` in tree-sort order gets all the slotted nodes, and the redundant `<slot>` 
   elements get none.
   

## References
  
 *