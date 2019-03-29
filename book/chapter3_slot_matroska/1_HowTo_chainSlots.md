# HowTo: chain slots

## Why reuse web components?

Custom elements and ShadowDOM give the developer the ability to encapsulate HTML, CSS, and JS code 
into web components. These (web) components can be reused and then accessed from both HTML, CSS and JS,
just like regular, native HTML elements. Imagine: you make an app, and then instead of writing
the same HTML, CSS, and JS code again and again, you simply reuse a web component.
That is nice! Reuse frees up developer time, and reuse affords more testing and higher component 
quality. Its not easy to make such tested, high quality, reusable (web) components, but it can now 
be done.

And, apps are not the only thing on the web that can benefit from reusing web components: 
web components themselves can also reuse other web components.
Most of the benefits of reusing web components also applies for web components themselves.
Therefore, many web components *do* use other web components from in their own shadowDOM.
In fact, if you develop a web component for reuse, I recommend you to anticipate that your web 
component can be layered as deep as three or four web components beneath the main html document.

## WhatIs: to chain slots

When a web component is wrapped inside the shadowDOM of an outer web component,
the lightDOM elements that are transposed into the outer web component can be *passed on* to 
the inner web component. To transpose elements across several shadowDOMs we must **chain slots**.

To chain slots is neither as difficult nor strange as it sounds. To chain slots the developer
or the outer web component must only place one of his `<slot>` elements as a child of the host element
of the inner web component. Lets look at an example:

## Example: `<green-frame>` with `<passe-partout>`

In this example we will add a passepartout to our green frame.
To do so, we create another web component called `PassePartout`.
The `PassePartout` adds a grey border around the image, and
then the `GreenFrame` web component uses the new `PassePartout` element as
an extra inner frame around its slotted content.

```html
<script>
  class PassePartout extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            border: 20px solid grey;
          }
        </style>

        <div>
          <slot id="inner"></slot>
        </div>`;
    }
  }
  class GreenFrame extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            border: 10px solid green;
          }
        </style>

        <div>
          <passe-partout>
            <slot id="outer"></slot>
          </passe-partout>
        </div>`;
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>Picture this!</green-frame>

<ul>
  <li>
    The text "Picture this!" is transposed from the lightDOM of the main document to slot#outer.
  </li>
  <li>
    The slot#outer is then transposed from the shadowDOM of GreenFrame to the shadowDOM of PassePartout.
  </li>
  <li>
    Here, the shadowDOM of the particular GreenFrame _is_ the lightDOM for the particular PassePartout element.
    PassePartout elements can be reused in many different settings, and
    so PassePartout elements can have many different lightDOMs.
  </li>
</ul>
```

## What happened?

When the browser flattens the DOM, it needs to move (ie. transpose) each slotable node *into*
their corresponding `<slot>`. The flattening of the DOM does not(!) *replace* the `<slot>`
elements with their assigned nodes; flattening of the DOM resolves slot chains by virtually *moving*
the transposed elements into their `<slot>` element child position and *keeping* the `<slot>` element.
We saw this clearly in [HowTo: style slot](../chapter2_slot_basics/6_HowTo_style_slot).

Thus, when looking at a slot chain like the one above, 
we can think of this process happening recursively from the inside out.

First, `<slot id="inner">` inside `PassePartout` "grabs" the `<slot id="outer">` 
inside `GreenFrame`. This produces this partially flattened piece of DOM:
```html
<slot id="inner">
  <slot id="outer"></slot>
</slot>
```

Second, `<slot id="outer">` inside `GreenFrame` then "grabs" the `Picture this!`
from the main html document. This produces the final flattened piece of DOM:
```html
 ...
  <green-frame>
    <div>
      <slot id="inner">
        <slot id="outer">
          Picture this!
        </slot>
      </slot>
    </div>
  </green-frame>
 ... 
```

Note 1: The order of the `<slot>`s in the SlotMatroska is **inside-out**.
In the flattened DOM, the `<slot>` elements appear in the reverse document order. 

Note 2: Neither `<slot id="inner">` nor `<slot id="outer">` are replaced in the flattened DOM. 
It is **WRONG** to think of the flattened DOM like this:
```html
 ...
  <green-frame>
    <div>
      Picture this!  (!!WRONG!!)
    </div>
  </green-frame>
 ... 
```

## References

 * 