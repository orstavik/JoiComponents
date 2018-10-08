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
But wait again, now that isn't true either. What happened with the middle slot? And its `line-through`
was added too? Ok, so the end result in the flattened DOM turns out to be something like this?
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
                                         

How to understand that? The inner slot element gets 
The reason is that 

