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

Make an example like the one above.

Highlight that ::slotted(*) only applies to the first level, not descendants.

## Example 3: fallback nodes.

Different rules on different levels.
Is the middle slot removed in the middle layer?

## Example 4: top level slot nodes are not removed when assigned

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


