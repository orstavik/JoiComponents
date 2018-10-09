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
          <slot id="middle"></slot>          
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
        <slot id="inner"></slot>
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

Hello World!  (with red underline, blue overline, and blue line-through) and BLUE(!).

## What happened?

First, `<span>Hello World!</span>` is transposed into `<slot id="middle">` and then into `<slot id="inner">`.
Now, looking at `<slot id="inner">` as variable to be resolved, 
we would expect that the `<slot id="inner">` is replaced with `<span>Hello World!</span>`.
But, wait, this is not how `<SLOT>`s are flattened! No, the `<span>Hello World!</span>` is
*filled into*/wrapped inside `<slot id="inner">`, so the end result in the flattened DOM would 
look something like:
```html
<slot id="inner">
  <span>Hello World!</span>
</slot>
```
But, wait again! This isn't exactly true either. What about `<slot id="middle">`? 
And the `blue` text color and `line-through`?
Ok, so the end result is wrapped in the `<slot id="middle">` too making the 
flattened DOM look something like this:
```html
<slot id="middle">
  <slot id="inner">
    <span>Hello World!</span>
  </slot>
</slot>
```
Ooops, I did a mistake there! I switched the `<slot>` order. When `<slot>`s are wrapped, 
they will go in the **reverse document order(!!)**. The inner will become the outer, and vice versa.
And so the "correct" expectation would be something like this:
```html
<slot id="inner">
  <slot id="middle">
    <span>Hello World!</span>
  </slot>
</slot>
```
And with this prescient mental image of the flattened DOM, the styles *finally* start to make sense.
First, the styles attributed to `<slot id="inner">` are attributed, red text and red underline.
Second, `<slot id="middle">` overwrites the text color in blue, and adds a line-through.
Third, the `<span>` adds an overline, that is blue because the text color is now blue.

The take-away from this example is the importance of:
1. making a mental model of the slotted nodes as **wrapped** in potentially several nested `<slot>`s.
2. The this embrace-of-the-slots is in **reverse document order**, 
   since flattening of `<slot>`s traverse the documents bottom-up.
3. That **all the styles of all the `<slot>`s apply**.

And if you are feeling confused, embrace it like a `<SLOT>`, 'cause there's more comin'!

## Example 1b: `<SLOT>`s inherit their parents style too

Let's play with this example a bit. Let's make it even more difficult, just for kicks!
Let us not apply the styles in the middle, `FancyHeader`, and the top level directly to the `<slot>`.
What happens then?

```html
<script>
  class FancyHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          b {
            color: blue;
            text-decoration: line-through;
          }
        </style>
        <b>
          <header-impl>
            <slot id="middle"></slot>          
          </header-impl>
        </b>
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
        <slot id="inner"></slot>
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
Before we look at the result, let's look at some possible expectations:

Now, this time the text will be bold, from the `<b>` element. That is simple.
Also, another spoiler. There will be no `line-through`. As this property does not inherit. 
But, what about the text color? Which CSS rule will apply?
(And we pretend that it is not necessary to care about the color of the `overline`. 
Red or blue overline? Doesn't matter, they are both equally beautiful!)

There are two alternatives for text color: red and blue.

It could be blue. The rationale here would be that `color` is an inheritable CSS property. 
That means that `<slot id="middle">` inherits this property from its parentNode 
(which, spoiler alert, devtools shows).
So, even though the `<slot>` isn't directly colored anymore, it inherits color, and 
that inherited color trumps the more specific CSS selector from the inner document 
*because the owner documents of these rules are ordered in reverse-document-order*, 
making higher document rules trump lower document rules, regardless of specificity.

It could be red. The rationale here would be that CSS rules that are directly assigned to a node,
ie. *not* inherited, always trumps inherited properties, regardless of document order.

The result is...

"Hello World!"  (red text, red overline, red underline)

This shows us that specificity of CSS selectors for SLOT trumps CSS document order.
Feeling a bit more confused? Not to worry, the ride is not over yet, 
we have much more of the good stuff coming! :D

## Example 2: ::slotted(*)

To style nodes that get assigned, a special CSS selector called `::slotted(*)` is used. 
The `::slotted(*)` selector is a CSS pseudo-class, but what you really need to know, is that
you can *only* use it to style the directly assigned nodes, and not those nodes descendants.
**`::slotted(*)` rules *only* apply to assigned children, *not* assigned descendants**. 

Let's look at our fancy example, but this time we use `::slotted(*)`.
In this example we also sprinkle an extra css property to the middle layer `font-style: italic`.
It can never be too fancy!

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
          <slot id="middle"></slot>          
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
            font-style: italic;
          }
        </style>
        <slot id="inner"></slot>
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

Take a guess! What color do you think the text will be? Red? or Blue? 
And will it be underlined, strike-through or both?
Which way is the `::slotted(*)` prioritized? Same way as document order, inner trumps outer?
Or the reverse chained-slot-order that we saw before, 
outer trumps inner, because inner `<SLOT>` becomes outer wrapper?

Hello World! (in blue, line-through, italics)

First, if you are reading this, I just have to say: you are a superhero!! 
You *can* take more ups and downs than the next guy, you are truly the last man standing.
I do not expect this ever to happen, in the real world I am just writing this for myself.

But, back to business! If you look at the slotted `<span>` node in devtools, you will see 
that *both* the `::slotted(*)` rules gets attached to the `<span>` node.
The inner `::slotted(*)` rule just went right *past* the `<slot id="middle">` node.
And if you missed that one, that's on `::slotted(*)`, not you.
Second, as all the rules gets attached to the same `<span>` node, they will overwrite each other.
You will not get one text-decoration for a `<slot id="middle">` node and one for the `<slot id="inner">`
this time, you will get only one. The outer one, of course, since applying CSS rules to slotted
elements goes ... **reverse document order**.

And now, for the truly good stuff: CSS fallback nodes.

## Example 3: disappearing fallback nodes

To provide a default value for a `<SLOT>` if no elements are assigned to it,
you simply add a set of childnodes under it.
Child nodes of a `<SLOT>` element is that `<SLOT>` element's fallback nodes.
The principle is simple. 
If a `<SLOT>` element does not get any nodes assigned to it from outside (the lightDOM),
use the childNodes from the inside (the shadowDOM).

But, there is a catch. Since `<SLOT>`s are filled with assigned content, not replaced,
these fallback nodes are not regarded as `::slotted(*)`.
And, there is another catch. What if: 
1. an inner `<SLOT>` *is* assigned to a middle `<SLOT>` that 
2. is *not* assigned to any slotable nodes in its lightDOM, but 
3. *do* have a set of fallback nodes?

*Would* the inner `<SLOT>`:
 * use its own fallback nodes of the middle slot, or
 * the fallback nodes from the other `<SLOT>` element it is assigned to?
   
Let's have another `FancyHeader` and investigate:

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
          <slot id="middle">Inner Header</slot>          
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
        <slot id="inner">Middle Header</slot>
      `;
    }
  }
  customElements.define("fancy-header", FancyHeader);
  customElements.define("header-impl", HeaderImpl);
</script>
<fancy-header></fancy-header>
```

The real question is, do we really bother with another investigation?
Can we just conclude with guilty and send all nodes to prison?
Does `!important` work? And if so, how could I use it? But, enough digression,
let's get back on track.

The example yields good insight. 
When `<slot id="inner">` asks `<slot id="middle">` for its `assignedNodes`, 
`<slot id="middle">` will not return its fallback nodes to `<slot id="inner">` 
when it has no assigned nodes.
**Slot fallback childnodes does NOT work recursively**.
So while the `<slot>` element works recursively for assigned nodes, 
it does not work recursively for fallback nodes.
If you missed that one, its not on you, blame the `<SLOT>`.

Secondly, the `::slotted(*)` rules do not apply. *Fallback child nodes are not considered slotted*.
If you missed that one, that is on you! No.. Just kidding:) 
This is also a perfectly understandable misunderstanding. 
You just didn't know that CSS applies different rules to the `<SLOT>`s own children 
than it does with the children that gets assigned to the `<SLOT>`. 
No `::slotted(*)` for Christmas for you kids!

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
          <slot id="middle">Inner Header</slot>          
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
        <slot id="inner">Middle Header</slot>
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

0. It is naive to expect a `<SLOT>` to behave nicely. 
   Sure, they often do, and things work out ok in the end.
   But, when `<SLOT>`s get chained, things start going out of control, fast.
   The sad news is that you have to chain `<SLOT>`s. 
   You want to use them across many elements in many situations.
   And so, the most important guideline is to anticipate style creep when chaining `<SLOT>`s.
   Expect the worse, and the chained `<SLOT>`s will hopefully pleasantly surprise you.

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


