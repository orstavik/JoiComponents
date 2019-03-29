# Problem: FallbackNodesFallout

In [WhatIs: slot fallback nodes](3_WhatIs_slot_fallback_nodes), we looked at what it means
to be a gentleman developer of web component and `<slot>`s. 
Makers of web components should provide their users with `<slot>` elements so that they can 
adapt the content of the component to their own use cases; and 
users of web components should avoid overwriting the default value (the fallback nodes) if they
don't really need to.

But, what do we do in a SlotMatroska? We have a couple of use cases that we need to consider.

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
  This essentially works fine. Inside the second green frame it says: "Picture this in a green frame!".
  The slot#inner is passed slot#outer, which does not have any transposed nodes. It then uses its fallback nodes.
</p>
```

## Use-case 2: Reuse inner web component fallback nodes

Sometimes though, the inner web component might provide a nice and/or not easily replicated 
fallback node structure that the outer web component wish to reuse. If the inner web component
provides a good fallback, the outer web component should avoid creating a second redundant set of
fallback nodes.

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
  This example fails. The option of falling back to the nodes specified in slot#inner is impossible!
  If GreenFrame wishes to just use the default content of PassePartout, it cannot at the same time
  chain its own slot to PassePartout.
</p>
```

## Discussion

The second example fails because the inner `<slot>` element *is not empty*, but instead filled with
an empty outer `<slot>` element. This feels like irregular behavior, but it actually is in line with
the logic of SlotMatroska. As the `<slot>` placeholders are filled, also with each other. This means 
that once `<slot>` is chained to another `<slot>`, then their fallback nodes are permanently lost.
This is not only a problem as it happens, this is also a problem for building courteous conventions:
if `<slot>`s fallback nodes cannot be relied on once web components are nested, to give user web
components the *option* to overwrite certain content that is anticipated to remain constant in say 80%
of its use, becomes a liability as other web components then often must fill this slot with their own
fallback nodes.

One could argue that this is a feature, and not a bug. That if the logic was reverse, then there would
be noe way to replace the content of the inner `<slot>` with nothing. But, this is a bad argument.
First, the `<slot>` could be filled with a simple space text node, thus likely wiping the slate clean.
Second, the use case of filling a `<slot>` with nothing is less frequent and less problematic to 
overcome. 

## References

 * 

