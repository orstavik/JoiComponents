# Problem: Styling `<SLOT>`s and flattening `<SLOT>`s

## Example 1: FancyHeader
                                         
In the following example an HTML is created with a custom element called `<fancy-header>`.
The `<fancy-header>` has a shadowDOM with a `<header-impl>` node.
The `<header-impl>` element only contains a `<style>` and a `<slot>`. 
The `<fancy-header>` uses a `<slot>` that it places in the slottable position of its `<header-impl>` node,
thus chaining its own `<slot>` to the `<slot>` in `<header-impl>`.

```html
<script>
  class FancyHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          slot {
            color: blue;
            text-decoration: line-through;
          }
        </style>
        <header-impl>
          <slot id="fh"></slot>          
        </header-impl>
      `;
    }
  }

  class HeaderImpl extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          slot {
            color: red;
            text-decoration: underline;
          }
        </style>
        <slot id="hi"></slot>
      `;
    }
  }
  customElements.define("fancy-header", FancyHeader);
  customElements.define("header-impl", HeaderImpl);
</script>
<style>
  span {
    text-decoration: overline;
  }
</style>
<fancy-header><span>Hello World!</span></fancy-header>
```
This results is:

Hello World!  (with underline, overline, line-through) and RED.

## What happened?

First, `<span>Hello World!</span>` is transposed into the `<slot id="fh">`, and then into `<slot id="hi">`.
Now, looking at `<slot id="hi">` from a variable resolution perspective, 
we would think that the `<slot id="hi">` had been replaced with `<span>Hello World!</span>`.
But wait, that isn't how `<SLOT>`s are flattened! No, the `<span>Hello World!</span>` is
wrapped inside `<slot id="hi">`, so the end result in the flattened DOM should be:
```html
<slot id="hi">
  <span>Hello World!</span>
</slot>
```
But wait again, now that isn't true either. What happened with the middle slot? And its `line-through`?
Ok, so the end result in the flattened DOM turns out to be something like this.
```html
<slot id="fh">
  <slot id="hi">
    <span>Hello World!</span>
  </slot>
</slot>
```
Ooops, I did a mistake there, switching the `<slot>` order. The correct result is:
```html
<slot id="hi">
  <slot id="fh">
    <span>Hello World!</span>
  </slot>
</slot>
```
And that is why all of the text-decoration styles are applied *and* 
why the `red` color of `<slot id="fh">` has a higher specificity than `<slot id="hi">`.

## Example 2: ::slotted(*)

To style nodes that gets assigned, a special CSS selector called `::slotted(*)` is used. 
The `::slotted(*)` selector is a CSS pseudo-class, but what you really need to know, is that
you can *only* use it to style the directly assigned nodes, and not those nodes descendants.
**`::slotted(*)` rules *only* apply to assigned children, *not* assigned descendants**. 

Let's look at our fancy example, but this time we use `::slotted(*)`.

```html
<script>
  class FancyHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(*) {
            color: blue;
            text-decoration: line-through;
          }
        </style>
        <header-impl>
          <slot id="fh"></slot>          
        </header-impl>
      `;
    }
  }

  class HeaderImpl extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(*) {
            color: red;
            text-decoration: underline;
          }
        </style>
        <slot id="hi"></slot>
      `;
    }
  }
  customElements.define("fancy-header", FancyHeader);
  customElements.define("header-impl", HeaderImpl);
</script>
<style>
  /*nothing ever gets ::slotted(*) at the root level*/
</style>
<fancy-header><span>Hello World!</span></fancy-header>
```

Take a guess! What color do you think the text will be? red? or blue?
Which way is the `::slotted(*)` prioritized? Same way as document order, inner trumps outer?
Or the reverse chained-slot-order that we saw before, 
outer trumps inner, because inner `<SLOT>` becomes outer wrapper?

## Example 3: fallback nodes and ::slotted(*)
 
Child nodes of a `<SLOT>` element is that `<SLOT>` element's fallback nodes.
The principle is simple. 
If a `<SLOT>` element does not get any nodes assigned to it from outside (the lightDOM),
use the childNodes from the inside (the shadowDOM).

But, there is a catch. Since `<SLOT>`s are filled with assigned content, not replaced,
these fallback nodes are not regarded as `::slotted(*)`.
But but, there is a catch 22 also. 
When an inner `<SLOT>` *is* assigned to another middle `<SLOT>` that happens *not*
to be assigned to any slotable nodes in its lightDOM, but happens to have a set of fallback nodes,
then those fallback nodes *would be* a) regular, not-slotted fallback nodes in the middle document,
but b) assigned and slotted nodes in the inner document. Or would they? 
Let us bring out our `FancyHeader` and investigate:

```html
<script>
  class FancyHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(*) {
            color: blue;
            text-decoration: line-through;
          }
        </style>
        <header-impl>
          <slot id="fh">Inner Header</slot>          
        </header-impl>
      `;
    }
  }

  class HeaderImpl extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(*) {
            color: red;
            text-decoration: underline;
          }
        </style>
        <slot id="hi">Middle Header</slot>
      `;
    }
  }
  customElements.define("fancy-header", FancyHeader);
  customElements.define("header-impl", HeaderImpl);
</script>
<style>
  span {
    text-decoration: overline;
  }
</style>
<fancy-header><span>Upper Fancy Header</span></fancy-header>
<fancy-header></fancy-header>
<header-impl><span>Upper Header Impl</span></header-impl>
<header-impl></header-impl>
```

To fully illustrate the situation, we need style rules that are inherited.
Because, hold on to your hats, the middle `<SLOT>` element is not removed, but
transposed itself. Or are just the childNodes transposed? Who can really remember?
Who has the mental capacity and interest in keeping the neurons describing such paths
alive in their mind?

There are several key questions a developer must answer when using `<slot>` fallback child nodes?
Different rules seem to the `<SLOT>` elements and their children depending on which level
they come from. 
Is the middle slot removed in the middle layer, but the inner slot will not get removed?
Which rules apply when, where and to what?

If you feel that this is a jungle, you are correct. You should think of styling `<SLOT>`s as a jungle.
There are several sets of selectors, and how you should view the selectors of `<SLOT>`s 
differs when it is in the lightDOM and shadowDOM 
(and root level without a shadowRoot, as we will discover in our next example). 
In the jungle things creep around. With `<SLOT>`s and slotted content, CSS rules are also creepy.

//old
althought `<SLOT>` are filled with assigned content, not replaced,
these fallback nodes are not regarded as `::slotted(*)`.
These childNodes are not treated as slotted, 
meaning `::slotted(*)` css rules do not apply to them. 
Unless they were passed on from their 

## Example 4: top level slot nodes are not removed when assigned

The last example we will address here is the special case were a `<SLOT>` node
is placed in the main document, that has no shadowRoot.
This would be a strange place to put such a `<SLOT>` element, but 
there are situations where it might occur.
 
For example. Someone is making a game with a set of characters. 
One of these characters is defined as the fallback guy for a `<SLOT>` inside another custom element. 
This other custom element you don't have access to, so you can't change its templating structure.
So when someone needs this character in the main document template, 
he uses the template whose root node is a `<SLOT>`. 
He anticipates that the top level `<SLOT>` simply would be *replaced* by 
its fallback nodes as it will get no assigned nodes 
(of course, because there is no lightDOM outside the main document).
But that is, as we know it wrong, because 
*`<SLOT>`'s assigned content fills it, it does not replace it*.

Anywho, when such a confusing situation arises, the browser might still show the text.
It will just maybe style it wrong. It will perhaps include some styles that you have set, but not others.
If there is *one* thing that is missing here, it would be our beloved *fancy* example:

```html
<script>
  class FancyHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(*) {
            color: blue;
            border-top: 2px solid black;
          }
        </style>
        <header-impl>
          <slot id="fh">Inner Header</slot>          
        </header-impl>
      `;
    }
  }

  class HeaderImpl extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(*) {
            color: red;
            border-bottom: 2px solid black;
          }
        </style>
        <slot id="hi">Middle Header</slot>
      `;
    }
  }
  customElements.define("fancy-header", FancyHeader);
  customElements.define("header-impl", HeaderImpl);
</script>
<style>
  span {
    text-decoration: overline;
  }
</style>
<fancy-header><slot><span>Upper Fancy Header</span></slot></fancy-header>
<header-impl><slot><span>Upper Header Impl</span></slot></header-impl>
```

## Guide to managing CSS and slot in the wild

This example is simple. This example contains the bare minimum needed to illustrate 
how `<SLOT>`s get styled when chained. It has:
 * 2-3 elements per document,
 * 1-2 styles per document,
 * the style selectors apply directly to the affected elements,
 * and the styles are non-inheritable.
 
In the real world, you should watch out for the following:

1. You forgot to view `<SLOT>` elements as variables being *filled with* content, 
   and not *replaced* by content.
   You might have forgotten that the middle slot is not replaced/vanished, but still alive and kicking
   in your CSSOM for the slotted elements.
   If there are styles that are applied that you don't understand, make a flattened DOM rendition of 
   the slotted elements with its nested slots on the outside.
   
2. Remember that lots of CSS selectors can hit your `<SLOT>`s.
   Therefore, check the devltools, to see which selectors in which document gets activated and prioritized.
   
3. Remember that some CSS rules are inheritable. That means that not only styles that are 
   directly applied to your nested `<SLOT>` elements, but also to their ancestors, 
   in all three documents, can have a say.
   
4. Remember that ::slotted(*) only applies to the immediate assignedNodes of the Slot, and 
   that descendants deeper down the tree will not be affected.
   
5. Remember that the elements own fallback nodes are not ::slotted, 
   but that slotted fallback nodes are?? todo check this
   
6. Remember that any <SLOT> node that do not have a shadowDOM as rootNode will not get flattened at all.

7. Rest knowingly that you can always blame the person using your custom element for styling it the wrong way.
   As there is little CSS encapsulation for slotted nodes, there is little you can do to control the style
   when you make the custom element.


