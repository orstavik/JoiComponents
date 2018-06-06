# HTML `<slot>` and `.assignedNodes()`

A `<slot>` is an HTML variable.
There are two types of `<slot>` elements: 
* the default, "no-name" slot: `<slot></slot>`.
* "named slots": `<slot name="nick"></slot>`.

All `<slot>` elements refer to children elements of the `host` element in the lightDOM.
The no-name `<slot>` simply refers to all the children of the `host` element.
"Named slots" refer to the children (or descendants) of the `host` element 
that has an attribute called `slot` with the same value as the `name` attribute 
of the slot in the shadowDOM inside the custom element.

```html
<script type="module">
  class GreenFrame extends HTMLElement {
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});
    }
    
    connectedCallback(){
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            border: 10px solid green;
          }
        </style>
        <slot></slot>
      `;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>
  <img src="aNicePicutre.jpg" alt="a nice picture">
</green-frame>
<green-frame>
  <div style="width: 100px; height: 166px;">This is a div with some text</div>
</green-frame>
```
 
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

> todo here we need a diagram of the flattened DOM.
With a picture describing the `assignedNodes()` of each slot
And pointer's to what is the lightDOM and shadowDOM of each entity.

## Problems with `<slot>`s

One important problem with a `<slot>` is that you don't know in advance 
if they will have *zero, one or several* assigned nodes to it in the resolved DOM.
They are polygamous.
This mostly affect the parent node of the `<slot>` inside the shadowDOM.
The problem for a parent node of `<slot>` elements no longer knows: 
* how many children it will have, if any, and 
* what type of elements these children might be.

```html
<green-frame>
  <!--nothing to see here-->
</green-frame>

<green-frame>
  <!--wooow, don't do that!-->
  <img src="aNicePicutre.jpg" alt="a nice picture">
  <div style="width: 100px; height: 166px;">This is a div with some text</div>
</green-frame>
```
Thankfully, this is a familiar problem. 
Normal elements can also have unknown quantity of children of unknown types.
As HTML elements are used in many different documents and also moved around and altered dynamically by JS,
it is normal that an HTML element does not know in advance neither how many nor what type of children it has.
So, we already know this problem and how to handle it:
We assume little about neither the *style* nor *behavior* of the children.
And we make sure the elements style and behavior tackles both zero, one and multiple children equally well.

But, there is one thing missing for parent with slots among their children. 
Where can I find a complete list of the children viewable in the flattened DOM?

## References
 * mdn on slot
 * mdn on assignedNodes
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom
 * [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 
