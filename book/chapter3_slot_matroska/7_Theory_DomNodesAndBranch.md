# Theory: DOM branch vs. DOM node operations

## HTML: instant DOM declaration

When we declare HTML elements in HTML, we do several operations *in an instant*.

HTML:
1. creates a set DOM nodes, 
2. gives the DOM nodes attributes,
3. implicitly connects the DOM nodes to the DOM, and
4. organize these DOM nodes as a hierarchy (positioned both inside and next to each other).

It looks like this:
```html
<div box="big">
  <h1>Hello world!</h1>
</div>
```
The important thing to note here is that HTML is *declarative*. Here, declarative means that 
these four operations above are considered *simultaneous*. They happen within *a single moment*,
*as one*. If you struggle to understand this, it is just because it is *too* obvious. The word 
"declarative" is just fancy programmer tech speak for a thing you already know very well: 
the very basic makeup of HTML.

What you need to take from the fact above is that declaring a little piece of HTML like the one
above is a *single* HTML statement/expression. It would be akin to writing 
`var string = "box" + "Big" + "H1" + "HelloWorld!";` in JS. It is *one* statement.

## JS: step-wise DOM declaration
   
However, when we declare the same piece of DOM in JS, this *singular* HTML statement *becomes* 
six JS statements:

```javascript
const bigBox = document.createElement("div");      
const h1 = document.createElement("h1");           
h1.innerText = "Hello world!";                     
bigBox.setAttribute("box", "big");                 
document.querySelector("body").appendChild(bigBox);
bigBox.appendChild(h1);                            
```

JS is an *imperative* programming language, and it needs six JS statements to perform one HTML statement.
This leads to quite an interesting concept. Here, HTML time is 6x slower than JS time. And when HTML
is declaring larger DOM branches, there can be several thousands of mini JS steps for each HTML step.

## DOM node vs. DOM branch operations

If we look at the JS operations, we can divide them into two categories:
DOM node and DOM branch operations.

DOM node operations are the operations that only require and affect *only* one DOM node:

 * **DOM node A**: To create an atomic element such as a `<div>`.
 * **DOM node B**: To set an attribute on a node.

DOM branch operations are the operations that require or affect *more than* one DOM node:

 * **DOM branch A**: To append an element as a child of another DOM node.
 * **DOM branch B**: To remove an element as a child of another DOM node.
 * **DOM branch C**: To change the position of the children of a DOM node.

A side effect of appending/removing a DOM node as a child of another DOM node, is that
it can connect/disconnect that DOM node to/from the DOM. For practical purposes, we say that the 
connecting/disconnecting a DOM node to/from the DOM, is a DOM node operation:
 
 * **DOM node C**: To (dis)connect a node to the DOM.

((Theoretically, (dis)connecting a node to the DOM is a DOM branch operation. It affects only *one*
DOM node, but requires *two*. However, the difference between DOM node and DOM branch operations
will later only matter in how they *affect* the DOM nodes, ie. when the DOM nodes need to *react* to
the operation. When we later make this divide between *DOM node reactions* and *DOM branch reactions*,
it is much simpler to keep (dis)connecting in *DOM node reaction time*, than to move it to *DOM branch 
reaction time*. And that is why we, for practical purposes, consider it a DOM node operation.))

## a DOM node operation can be multiple DOM branch operations

A *single* JS statement can also trigger *multiple* DOM node and DOM branch operations. For example,
JS can via the function `.innerHTML` create our example branch as a single JS statement:

```javascript
parentNode.innerHTML = `
<div box="big">
  <h1>Hello world!</h1>
</div>
`;
```

This blurs the distinctions between DOM node and DOM branch operations also in JS, as 
a singular JS statement can spawn hundreds of intrinsic DOM node and DOM branch operations, that
from the viewpoint of JS *still* is performed as individual operations.

Web components with shadowDOM *also* trigger this JS spawning process. 
The *DOM node A* operation of creating a single web component *becomes* many DOM node and DOM branch 
operations as the whole shadowDOM inside the web component is created too, *immediately*.
From the declarative viewpoint of HTML, these nested operations happens *instantly, at the same time*;
from the imperative viewpoint of HTML, these nested operations happens *immediately, the operations 
are performed next*.

## DOM node and DOM branch reactions

Creating a DOM node or DOM branch can be viewed as a sequence of imperative operations.
As the browser gradually steps forward in this sequence of operations, 
it continuously creates temporary DOM branch constellations that it then discards, 
on its path to produce the result DOM branch.

These temporary DOM branch constellations "should be" inconsequential for DOM node operations:
DOM node operations *should remain constant* in all possible DOM branch contexts.
This "independence from DOM branch context" of DOM node operations is neither absolute nor logically
required:
1. This DOM branch independence is mostly enforced by convention: you should not read the outside 
   DOM branch functions like `HTMLElement.constructor()`, `attributeChangedCallback(..)` or 
   `connectedCallback()` (hereafter: DOM node reactions).
2. DOM node reactions often *do* depend on the existence of an internal shadowDOM. However,
   the DOM node reactions are always written with this in mind: if the `connectedCallback()` needs
   the shadowDOM up and running, either it or the `constructor()` ensures that it will be.
   
But, these temporary DOM branches constellations do have consequences for reactions to DOM branch
operations: the `slotchange` event. The `slotchange` event differs from `HTMLElement.constructor()`,
`connectedCallback()`, and `attributeChangedCallback(..)`: `slotchange` is an event, not a 
lifecycle callback (obviously), but `slotchange` is also dependent on/triggered by DOM branch 
constellations.

This means that:
1. as the browser imperatively steps forward creating different DOM branches step by step,
2. a new DOM branch constellation is potentially created after each step.
3. If a `slotchange` reaction is to be triggered "immediately", in an imperative, JS sense, 
4. then many `slotchange` reactions can be triggered during this sequence, 
   potentially as many as one reaction for every DOM branch operation.
5. If a `slotchange` reaction is only to be triggered for every "instant" DOM branch declaration,
6. then only *one* `slotchange` reaction should be performed per `<slot>` element.

The dilemma above can be summed up as follows. 
When a DOM branch is declared, should DOM branch reactions such as `slotchange` be run synchronously 
in:

1. an imperative, immediate sense between the different JS mini operations? or
2. a declarative, instantaneous sense between the different HTML declarations?

Today, the browsers process `slotchange` synchronously in an imperative (JS) sense \[1]. 
But, the browsers *should* process `slotchange` synchronously in a declarative (HTML) sense \[2].
I explain why in the next chapter [SlotchangeNipSlip #3](8_Problem_SlotchangeNipSlip3).

## References

 * 