# Function: `.flattenedChildren(el)`

## What is an HTML `<slot>` and `.assignedNodes()`?
A `<slot>` is an HTML variable.
There are two types of `<slot>` elements: 
* the default, "no-name" slot: `<slot></slot>`.
* "named slots": `<slot name="nick"></slot>`.

All `<slot>` elements refer to children elements of the `host` element in the lightDOM.
The no-name `<slot>` simply refers to all the children of the `host` element.
"Named slots" refer the children (or descendants) of the `host` element that has an attribute called
`slot` with the same value as the `name` attribute of the slot in the shadowDOM inside the custom element.
 
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

## Difficulties using `<slot>`

One important problem with a `<slot>` is that you don't know in advance 
if they will have *zero, one or several* assigned nodes to it in the resolved DOM.
They are polygamous.
You might think that this primarily leads to problems for the `<slot>` element itself.
But that is not really the case.
The `<slot>` itself is aware of its own behavior and takes that into account.
The assigned nodes are also fairly unaffected as it makes little difference for them
if they are assigned to a parent node or set of siblings directly or indirectly via a `<slot>`.

Surprisingly, it is the parent node of the slot inside the shadowDOM that gets into trouble.
The problem for a parent node of `<slot>` elements no longer knows: 
* how many children it will have, if any, and 
* what type of elements these children might be.

Both of these variables can impact both *style* and *behavior*.
To handle style, the parent node must find a style suitable not only 
for a fixed set and type of children, but for none, one or many children of various different styles.
Thankfully, these are the same problems that HTML and CSS developers already tackle when
they anticipate JS dynamically adding, removing and altering elements in the DOM at run-time.
But, there is one new and unresolved task a parent node of a `<slot>` node needs to do:
what is the list of children in the flattened DOM?

## Function: `.flattenedChildren()`
For DOM nodes that do not have any `<slot>`s amongst its children, 
the `.flattenedChildren` equals `.children`.
As `<slot>`s are only used inside shadowDOMs, 
this applies by default to all nodes in the main, top-level DOM.

However. If an element is a) *inside* a ShadowDOM and b) has a `<slot>` child,
the `.flattenedChildren` needs to be resolved by replacing all `slot` nodes 
with their `.assignedNodes()`. This is done using the following function:

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
This function will function for all elements, 
regardless if they happen to have any `<slot>` children or not.

## Opinions

HTML composition using `<slot>`s is complex and powerful.
To get the most power you must minimize complexity.
Here is my advice to achieve this:

1. Try to avoid dynamically adding, removing or altering `<slot>` elements inside the shadowDOM. 
As far as you can, let `<slot>` elements be a static fixture of your custom element.
While it is possible to dynamically alter `<slot>` elements, 
it makes for super complex code for usually little gain.

2. Be careful using siblings with slots.
This will create multiple document sources for a parent node's children.
While useful in certain situations, it will create tight bindings between more than two DOM documents.
Be especially careful when dynamically adding, removing or altering siblings of slot nodes.
 
2. Try to attach `<slot>` elements directly to the shadowRoot.
Or is this a good advice.. Todo check this later

3. The `slot` attribute must be added to the children of the host element.
Adding named slots to grandchildren of a host-element will create confusion as to which 
element is the attended recipient of the node with the named slot attribute.
Todo check if it is possible to add `slot` Do not add the to grandchildren

4. In the flattened DOM (and view in the browser), slotted or normal nodes appear identical.
This often means that slotted and normal nodes also require equal treatment by the custom element.
(cf. HelicopterParentChild example).

5. Anticipate chained `<slot>`s. `<slot>` elements can be chained (cf. `MarriedManBucketList`). 
If your element is truly reusable, this will be needed and occur more frequently than you might think. 

* When you make elements that you intend to use inside other elements,
use the ChildrenChangedMixin if you need to react to the dynamic DOM.
Also, try to follow the patterns described in chapter 4.
These patterns align with existing, normal HTML elements' behavior, and 
therefore should be simpler to intuitively grasp and keep in mind.

## Opinion about HTML composition using `<slot>`


To reduce the complexity:
* Avoid dynamically altering slotted elements inside shadowDOMs. 
Try to keep such dynamic manipulation of the DOM from JS to the top-level, main document only.
This will keep the template inside the shadowDOM more static and simpler to relate to.


## References
 * slot
 * assignedNodes
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom
 * [cf. HelicopterParentChild](../chapter4/Pattern2_HelicopterParentChild.md). 
