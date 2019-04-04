# HowTo: `<slot>` fallback nodes

What happens if a `<slot>` element in a shadowDOM is not matched with any slotable node from the
lightDOM? What happens if no lightDOM elements are assigned to a `<slot>`? If no nodes are transposed
from the lightDOM into a `<slot>` in the shadowDOM, then that `<slot>` element will simply be 
empty or filled with its fallback nodes, its children.

Put in reverse, the principle is that:
1. a `<slot>` element will show its children elements, unless 
2. it *instead* can show slotable nodes transposed from the lightDOM.

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
```

1. The browser constructed and processed the source file as in the previous chapters/examples.
2. `<green-frame id="one">` was declared with *absolutely no* child nodes.
   This causes the `<slot>` element to use its child nodes as fallback, default value in the flattened DOM.
3. However, `<green-frame id="two">` was declared *with* a child text node 
   containing just an invisible whitespace newline: `↵`.
   This whitespace text node *is* slottable and slotted into the shadowDOM document belonging to the second
   DOM element.
4. The diagram above also illustrates that when you use a custom element multiple times 
   in the same document, the browser will create one new shadowDOM document for each element.

## `<slot>` gotya #1: no-show-fallback-nodes
 
Sometimes, you try to use a `<slot>`s fallback nodes, but the `<slot>` element still turn up empty.
Why? Is there something wrong with the fallback nodes? 

No. Most likely the fallback nodes are just fine. Most likely, it is just a whitespace text node in your
lightDOM that gets transposed into the shadowDOM. Remember, text nodes will also be moved into a
`<slot>` element, and space and line-breaks are HTML text nodes too.

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

<green-frame id="two">
</green-frame>
```

3. However, `<green-frame id="two">` was declared *with* a child text node 
   containing just an invisible whitespace newline: `↵`.
   This whitespace text node *is* slotable and slotted into the shadowDOM document belonging to the second
   DOM element.

## Pattern: the GentleMan

The GentleMan pattern describes when to use `<slot>` and `<slot>` fallback nodes.

First, a web component should always provide its users with `<slot>`s for content that could vary in 
different contexts. And, to make web components more reusable, content such as labels and logos 
are often well considered context dependent. Instead of locking the user of a web component into a
particular use case by permanently fixing a label or logo, a web component might be well served 
offering several named `<slot name="xyz">` elements filled with fallback nodes, instead of locking
in the user and use case to a particular label or image. Thus, to be a GentleMan, 
most fixed content in a web component is likely best wrapped in a named `<slot>`.

Second, when you use a web component, you do not have to overwrite the fallback nodes of every `<slot>`.
If you need to do so, sure, go right ahead. But, if it is all the same, then the best thing to do is
to leave the `<slot>`s fallback nodes active. This will give the user of the web component the ability
to benefit from updates and yield one less binding to the web component used.

Third, apply the same style to both slotted and fallback children alike. This requires implementing
both regular CSS styles and `::slotted` CSS styles or styling the `<slot>` element itself. 
We will return to this in later chapters.

## References
 * [light DOM vs shadow DOM](https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom)
