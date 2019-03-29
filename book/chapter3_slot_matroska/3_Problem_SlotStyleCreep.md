# Problem: SlotStyleCreep

> CSS style creep: CSS rules applied in one part of the document that 
> styles an element in another part of the document, without the developer's awareness.

In [HowTo: style slots](../chapter2_slot_basics/6_HowTo_style_slot) we saw how we could style
the `<slot>` elements themselves, both intentionally and accidentally, in our shadowDOM.
In this chapter, we illustrate this behavior in a SlotMatroska. We start with the example.

## Example 1: SlotStyleCreep non-inherited

```html
<script>
  class PassePartout extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          *:not(style) {
            display: block;
            border: 8px solid grey;
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
          *:not(style) {
            display: block;
            border: 8px solid green;
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
    This example uses a trick CSS selector to capture all elements in the DOM: "*:not(style)".
    The idea is that we want to apply the non-inherited border to all elements, except the style element.
  </li>
  <li>
    However, there are several aspects of the StyleMatroska that becomes relevant here.
    First, the "*:not(style)" selector applies to the slot element too.
    Second, when we set "display: block;", this drastically alters the behavior of the slot element.
    Third, the green and grey border is the added to the slot element too,
    in addition to the div in both web components and the passe-partout in GreenFrame.
  </li>
  <li>
    Finally, we are exposed to the fact that slots are nested in reverse document order in the flattened DOM.
    Thinking about the structure, it would be natural to think of the slot element of PassePartout being
    wrapped inside the slot element of GreenFrame. However, the opposite is true. And therefore, an
    extra green frame appears _inside_ the PassePartout.
  </li>
  <li>
    Although confusing, non-inherited CSS properties are manageable. Controlling and understanding inherited CSS
    properties is much trickier.
  </li>
</ul>
```

## Example 2: SlotStyleCreep inherited

```html
<script>
  class PassePartout extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            color: grey;
          }
          * {
            font-style: normal;
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
            color: green;
          }
          * {
            font-style: italic;
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
    Green and italic is specified in the outermost web component;
    grey and normal in the innermost.
    The result? grey italic.
  </li>
  <li>
    The reason is that the CSS rules are applied in the normal DOM, then the DOM is flattened, and
    then the inheritance of CSS properties are calculated.
  </li>
  <li>
    For the "font-style", it looks like this:
    <pre>
...
  < green-frame >                   italic
    < div >                         italic
      < passe-partout >             italic
        < div >                     normal
          < slot id="inner" >       normal
            < slot id="outer" >     italic
              Picture this!           => italic
    </pre>
  </li>
  <li>
    For the "color", it looks like this:
    <pre>
...
  < green-frame >
    < div >                         green
      < passe-partout >
        < div >                     grey
          < slot id="inner" >
            < slot id="outer" >
              Picture this!           => grey
    </pre>
  </li>
</ul>
```

## Discussion

To understand how non-inherited CSS styles are applied in a SlotMatroska require mainly that
the developer remembers that:

1. all the `<slot>` elements *remain* in the flattened DOM hierarchy
2. in *reverse document order*.

For non-inherited styles this is not that problematic, as many of them are not activated unless
the `<slot>` elements also alters its `display` altered. Thus, if you do not write too wide
CSS selectors such as `*:not(style)` and you don't alter the `<slot>` `display` property, then
you likely will not experience SlotStyleCreep for non-inherited CSS properties.

But. The same cannot be said about inherited CSS properties. It is not unlikely that a `<slot>` 
styles its inherited properties, either by accident or by design. And it is not unlikely that 
the developer will guess the flattened DOM `<slot>` order wrong, either temporarily or permanently.
Thus, that an inherited CSS style from the outer web component `<slot>` happens to overwrite an
inherited CSS style from an inner web component, without developer intent or awareness, will occur.

Thus:

1. Be aware of SlotStyleCreep. It is a SlotMatroskaNipSlip. Especially for inherited CSS properties.

2. To avoid SlotStyleCreep for all CSS properties, ensure that the CSS selectors inside your shadowDOM
   does not match the `<slot>` elements.

## References

 * [CCS spec: flattening DOM](https://drafts.csswg.org/css-scoping/#flattening)
 
## todo

-> style chained slots ::slotted
   discussion: "no ::slotted(*) presents for the children of slots"
   kids behvaing badly gets no presents from santa.

