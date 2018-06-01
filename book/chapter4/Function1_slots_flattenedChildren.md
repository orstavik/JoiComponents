# Function: `.flattenedChildren(el)` (and `<slot>`)

## What is an HTML `<slot>` and `.assignedNodes()`?
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

## Function: `.flattenedChildren()`
For DOM nodes that do not have any `<slot>`s amongst its children, 
the `.flattenedChildren` equals `.children`.
As `<slot>`s are only used inside shadowDOMs, 
this applies by default to all nodes in the main, top-level DOM.
However, if an element is a) *inside* a ShadowDOM and b) has a `<slot>` child,
the `.flattenedChildren` needs to be resolved by replacing all `slot` nodes 
with their `.assignedNodes()`.

```javascript
function flattenedChildren(el) {
  let res = [];
  for (let i = 0; i < el.children.length; i++) {
    let child = el.children[i];
    if (child.constructor.name === "HTMLSlotElement") {
      let assignedNodes = child.assignedNodes();
      for (let j = 0; j < assignedNodes.length; j++)
        res.push(assignedNodes[j]);
    } else {
      res.push(child);
    }
  }
  return res;
}
```
This function will function for all elements whether or not they have `<slot>` children.

## Opinions

HTML composition using `<slot>` is complex and powerful.
To get the most power you must minimize complexity.
Here is my advice to minimize complexity:

1. Avoid dynamically adding, removing or altering `<slot>` elements inside the shadowDOM. 
As far as you can, let `<slot>` elements be a static fixture of your custom element.
While it is possible to dynamically alter `<slot>` elements, 
it makes for super complex code for usually little gain.

2. Be careful with a slot's siblings.
The node that is parent for both the slot and its siblings, 
will have multiple document sources for its children.
 
2. If you can, attach `<slot>` elements directly to the shadowRoot.
Do not wrap the `<slot>` in a div if all you need to do is add `:host {display: block;}` 
to the style of the customElement.
Familiarize yourself with `this.shadowRoot` as the root node of the shadowDOM.
Todo: Check if this is good advice.. 

3. The `slot` attribute must be added to the children of the host element.
Adding named slots to grandchildren of a host-element will create confusion as to which 
element is the attended recipient of the node with the named slot attribute.
Todo check if it is possible to add `slot` Do not add the to grandchildren

4. In the flattened DOM (and view in the browser), slotted or normal nodes appear identical.
This often means that slotted and normal nodes also require equal treatment by the custom element.
(cf. HelicopterParentChild example).

5. Anticipate chained `<slot>`s. `<slot>` elements can be chained (cf. `MarriedManBucketList`). 
If your element is truly reusable, this will be needed and occur more frequently than you might think. 

6. If you have chained `<slot>`s, 
try to keep such dynamic manipulation of the DOM from JS to the top-level, main document only.
This will keep the template inside the shadowDOM more static and simpler to relate to.
Do not attempt to add same-level slots as it grows (cf. `MarriedManBucketList`). 

7. If your custom element needs to react to changes of its `.flattenedChildren`,
use the SlotChangeMixin.

## References
 * mdn on slot
 * mdn on assignedNodes
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom
 * [cf. HelicopterParentChild](Pattern2_HelicopterParentChild.md). 
