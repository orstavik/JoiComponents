 
 
### OLD


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

 