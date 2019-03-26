# WhatIs: `<slot>` fallback nodes

When you create a `<slot>` in a custom element, you can also give them a default value, 
a set of fallback nodes.
These fallback nodes will be used inside the custom element if its host node has no slottable nodes,
and I mean **absolutely no element *nor text(!)* child nodes**.

A `<slot>` element's fallback nodes are its child nodes.
If a `<slot>` gets filled with child nodes via the custom element's `host` node in the lightDOM, 
the child nodes of a `<slot>` will just be ignored and removed when the DOM is flattened.
But, it a `<slot>` can find no slottable nodes in the lightDOM, it will fallback and use its
child nodes instead. A truly slutty family relationship.

## Example: `<green-frame>` with fallback nodes

In this example we use the same `GreenFrame` web component,
but this time, we will give the `<slot>` inside `GreenFrame` child nodes to
fall back on.
We will also create two "empty" `<green-frame>` element nodes, 
one that is truly empty, and one that forgets that empty space is a DOM text node too.

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
          <slot>Now you see me.</slot>
        </div>`;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame id="one"></green-frame>

<green-frame id="two">
</green-frame>
```

Below is the diagram that illustrates how the two different elements gets flattened.


## What happened?

1. The browser constructed and processed the source file as in the previous chapters/examples.
2. `<green-frame id="one">` was declared with *absolutely no* child nodes.
   This causes the `<slot>` element to use its child nodes as fallback, default value in the flattened DOM.
3. However, `<green-frame id="two">` was declared *with* a child text node 
   containing just an invisible whitespace newline: `↵`.
   This whitespace text node *is* slottable and slotted into the shadowDOM document belonging to the second
   DOM element.
4. The diagram above also illustrates that when you use a custom element multiple times 
   in the same document, the browser will create one new shadowDOM document for each element.

## Pattern: the GentleMan

When making a web component, there is a simple principle that can help guide you as to when to 
use `<slot>`s and when to use slot fallback nodes: the GentleMan.

First, the GentleMan pattern states that a web component should always provide its users 
with `<slot>`s for context-dependent, varying content that will either be displayed or iterated over.
The author of a web component should not define inside the shadowDOM content will vary depending
on the lightDOM context in which the web component is used. Be a GentleMan, don't make up your mind 
about something before you have heard what the other's have to say.

Second, when there is no content provided by the users of the web component, fallback gracefully as if 
such a situation was the most natural thing in the world.
If your web component anticipates a `<slot>` being filled with content, provide that `<slot>` with 
fallback nodes so to *both* guide your web components users about which type of content is anticipated,
and so that if your users forget to fill the `<slot>`, such an oversight will not break the look and
feel of your component as a whole.

Third, apply the same style to both slotted and fallback children alike. This requires implementing
both regular CSS styles and `::slotted` CSS styles. We will return to this in later chapters.

## References
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom