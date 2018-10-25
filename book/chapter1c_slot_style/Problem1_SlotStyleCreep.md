# Problem: SlotStyleCreep

> CSS style creep: CSS rules applied in one part of the document that 
> styles an element in another part of the document, without the developer's awareness.

CSS is not simple. Transposing slotable nodes is not simple. 
Lets for good measure add CSS to a slot chain and see how creepy things get.

## Example 1: FancyHeader

In the following example an HTML is created with a custom element called `<fancy-header>`.
The `<fancy-header>` has a shadowDOM with a `<header-impl>` node.
The `<header-impl>` element only contains a `<style>` and a `<slot>`. 
The `<fancy-header>` uses a `<slot>` that it places in the slotable position of its `<header-impl>` node,
thus chaining its own `<slot>` to the `<slot>` in `<header-impl>`.
In sum, a basic slot chain.

Then, we add the styles. We only work with one, non-inheritable CSS property to begin with:
`text-decoration`. 
We add the `text-decoration` property to both `<slot id="inner">`, `<slot id="middle">`, and 
the outermost, slotted `<span>` element in document order:
 * top document => `overline`
 * middle document => `line-through`
 * inner document => `underline`

```html
<script>
  class FancyHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          slot {
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

Hello World!  (with both underline, overline, and line-through).

## Diagram


## What happened?

First of all, `<slot>` are styled too.

First, `<span>Hello World!</span>` is transposed into `<slot id="middle">` and 
then into `<slot id="inner">`.
Now, if we start with the concept that `<slot id="inner">` is a regular variable, 
then we would expect that the `<slot id="inner">` is replaced with `<span>Hello World!</span>`.
But, as we know, this is not how `<SLOT>`s are flattened. Instead, `<span>Hello World!</span>` is
*filled into*/wrapped inside `<slot id="inner">`, giving us a structure in the flattened DOM like this:
```html
<slot id="inner">
  <span>Hello World!</span>
</slot>
```
But, as we saw in the chapter And, we are not finished! We must also include the `<slot id="middle">`. 
So, we must wrap the linking `<slot id="middle">` too which gives us this structure:
```html
<slot id="middle">
  <slot id="inner">
    <span>Hello World!</span>
  </slot>
</slot>
```
Ooops, I did a mistake there! I switched the `<slot>` order. When `<slot>`s are wrapped, 
they will go in the **reverse document order**. The inner becomes the outer, and vice versa.
So, the "correct" expectation is this:
```html
<slot id="inner">
  <slot id="middle">
    <span>Hello World!</span>
  </slot>
</slot>
```
All this is evident in the diagram of course, but 
it is useful to remember that you don't have a diagram in front of you when you work with `<slot>`
nodes in the real world. 

Now, the `text-decoration` property with its different value is added to all three of these elements.
`text-decoration` does not inherit, so the application of 

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

 1.2. -> style chained slots regularly
         discussion on style creep both for directly assigned, but also and especially inherited styles
      -> style chained slots ::slotted
         discussion: "no ::slotted(*) presents for the children of slots"
         kids behvaing badly gets no presents from santa.
      -> theory on variable resolution vs transposition

## References

 * [CCS spec: flattening DOM](https://drafts.csswg.org/css-scoping/#flattening)