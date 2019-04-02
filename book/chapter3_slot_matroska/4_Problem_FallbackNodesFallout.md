# Problem: FallbackNodesFallout

In [WhatIs: slot fallback nodes](3_WhatIs_slot_fallback_nodes), we looked at how a gentleman 
web component developer should treat his `<slot>`s: 
makers of web components should provide their users with `<slot>` elements so that their users can 
adapt the content of the component to their own use cases; 
users of web components should not overwrite the default value (the fallback nodes) in another
web component if they don't need to do so.

But, what do we do in a SlotMatroska? The SlotMatroska gives us a couple of use cases that 
we need to consider.

## Use-case 1: Customize fallback nodes

Making a web component that (re)uses other web components, we often need to:

1. chain a `<slot>` elements to an inner web component `<slot>`, and 

2. customize the fallback content of the outer `<slot>` element so that it contains something 
   meaningful if the user does not provide the outer slot with any transposed nodes.

```html
<script>
  class PassePartout extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            border: 20px solid grey;
          }
        </style>

        <div>
          <slot id="inner">
            Picture this in a passe partout!
          </slot>
        </div>`;
    }
  }

  class GreenFrame extends HTMLElement {

    constructor() {
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
            <slot id="outer">Picture this in a green frame!</slot>
          </passe-partout>
        </div>`;
    }
  }

  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>Hello world!</green-frame>
<br>
<green-frame></green-frame>

<p>
  This works fine. Inside the second green frame it says: "Picture this in a green frame!".
  The slot#inner is passed slot#outer, which does not have any transposed nodes. 
  It then uses its fallback nodes.
</p>
```

## Use-case 2: Reuse inner web component fallback nodes

Sometimes though, the inner web component might provide a nice and/or not easily replicated 
fallback node structure that the outer web component wish to reuse. If the inner web component
provides a good fallback, then the outer web component should avoid creating a second redundant 
set of fallback nodes, when their users in turn do not pass in any transposed nodes.

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
          .think {
            border-color: red orange yellow orange;
            border-width:  10px 8px 9px 8px;
            border-style:  dotted dotted dashed dotted;
          }
        </style>

        <div>
          <slot id="inner">
            <div class="think inside the slot">I am a nice elaborate set of DOM nodes!</div>
          </slot>
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
            <slot id="outer" class="redundancy stinks"></slot>
          </passe-partout>
        </div>`;
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>Hello world from the lightDOM!</green-frame>
<br>
<green-frame></green-frame>

<p>
  This example FAILS. There is no "nice elaborate set of DOM nodes!" shown on screen.
  The option of falling back to the nodes specified in slot#inner is impossible.
  If GreenFrame wishes to just use the default content of PassePartout, 
  it cannot at the same time chain its own slot to PassePartout.
</p>
```

## Why FallbackNodesFallout happen

The second example fails because the inner `<slot>` element *is not empty*, but instead filled with
an empty outer `<slot>` element: 
1. `<slot>` placeholders can be filled with each other. 
2. once an outer `<slot>` is chained to an inner `<slot>`, then the outer `<slot>` will fill the 
   inner `<slot>`.
3. When the inner `<slot>` element is filled, then its fallback nodes are permanently lost.
4. Even when the outer `<slot>` has no fallback nodes of its own to offer.

This feels like irregular behavior, but it actually is in line with the logic of SlotMatroska. 
It is not a bug in the browser, it is a bug in the spec.

## Consequence of FallbackNodesFallout

One could argue that FallbackNodesFallout is a feature, and not a bug:
if the logic was reverse, then there would be noe way to replace the content of the inner `<slot>` 
with `empty`. 
But, this is not a good argument: in the opposite scenario, the inner `<slot>` could be wiped clean 
with an empty space text or HTML comment node.

FallbackNodesFallout is not only a problem as it happens. FallbackNodesFallout is also a problem 
for building courteous conventions. FallbackNodesFallout hinder web components in (re)using each other.

## References

 * 

