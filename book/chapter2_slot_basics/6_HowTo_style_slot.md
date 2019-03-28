# HowTo: style `slot`

A primary purpose of the shadowDOM is to prevent CSS rules in the lightDOM to affect elements
in the shadowDOM, and vice versa, to protect elements in the lightDOM to be styled by CSS rules
in the shadowDOM. This means that the **primary** method of styling the content of `<slot>` 
elements is by adding rules in the DOM in which that content is declared. We can summarize these 
rules as **five facts** about styling (the content of) `<slot>` elements:

1. As we described in [2_HowTo_slot](2_HowTo_slot), when lightDOM elements are transposed into
   a `<slot>` element, they do *not* replace the `<slot>` element in the lightDOM. 
   Furthermore, when fallback nodes are used to fill a `<slot>` element, the `<slot>` element 
   remains as a wrapper around the fallback nodes. Thus, the `<slot>` element exists in the flattened 
   DOM, and the `<slot>` element *itself* can be *styled*.

2. LightDOM nodes that are transposed *keep* their CSS properties from the lightDOM. You can think
   of it as if CSS is calculated first, and then the already styled nodes are moved from the
   lightDOM document to the shadowDOM document. 
   
3. The child elements of a `<slot>` can be styled as any regular element in the shadowDOM.
    
4. Inherited CSS properties for transposed *elements* are first picked from the lightDOM and 
   then from the shadowDOM.

5. Text nodes inherit no CSS properties directly from the lightDOM context, but indirectly via the
   host node and then slot element inside the shadowDOM.

This means that you can style: 

1. the `<slot>` element *itself* with CSS properties specified in the shadowDOM,
2. the `<slot>` elements' *fallback nodes* with CSS properties specified in the shadowDOM, and
3. transposed *nodes* with CSS properties specified in the lightDOM.
4. Inherited CSS properties for transposed *nodes* can be declared in the shadowDOM if the value
   of that CSS property coming from the lightDOM is `inherit`.

## Example: Non-inherited CSS properties from normal CSS selectors

```html
<script>
  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =
        `<style>
          slot {
            display: inline-block;
            border-left: 4px solid green;
          }
          span {
            border-left: 4px solid red;
            border-bottom: 4px solid red;
          }
        </style>

        <div>
          <slot><span>Hello shadow element!</span></slot>
        </div>`;
    }
  }

  customElements.define("green-frame", GreenFrame);
</script>

<style>
  span {
    border-left: 4px solid blue;
    border-top: 4px solid blue;
  }
</style>

<green-frame>Hello light text!</green-frame>
<br/>
<green-frame><span>Hello light element!</span></green-frame>
<br/>
<green-frame></green-frame>

<ul>
  <li>
    Besides all three elements is a green border left. This green border is associated with the slot element itself,
    which being "display: inline-block;" gets a border.
  </li>
  <li>
    "Hello light element!" has a blue border top and left, as the span element is given this CSS property in the lightDOM
    in which it is declared. It has no red border, neither left nor bottom, as the CSS rules inside the shadowDOM
    does not apply to elements transposed into it.
  </li>
  <li>
    "Hello shadow element!" has a red border bottom and left, as the span element is given this CSS property in the
    shadowDOM in which it is declared. It has no blue border, neither left nor top, as the CSS rules in the lightDOM
    does not apply to elements in the shadowDOM.
  </li>
</ul>

```
   
## Example: Inherited CSS properties from normal CSS selectors

```html
<script>
  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =
        `<style>
          slot {
            font-weight: bold;
            font-style: italic;
          }
        </style>

        <div>
          <slot><span>Hello shadow element!</span></slot>
        </div>`;
    }
  }

  customElements.define("green-frame", GreenFrame);
</script>

<style>
  #container {
    color: green;
  }
  green-frame > * {
    font-style: normal;
  }
  span {
    font-weight: normal;
  }
</style>

<div id="container">
  <green-frame>Hello light text!</green-frame>
  <br/>
  <green-frame><span>Hello light element!</span></green-frame>
  <br/>
  <green-frame></green-frame>
</div>
<ul>
  <li>
    The three "Hello..." are all green as they inherit this CSS property from the #container in the lightDOM.
  </li>
  <li>
    The span in "Hello light element!" has both a normal font-style and font-weight.
    These CSS properties are applied directly to the span element in the lightDOM.
    The inheritance from the lightDOM wins over inheritance from the slot in the shadowDOM.
  </li>
  <li>
    The other two "Hello..." are bold italic because they are text nodes without any style that inherit from the
    slot element inside the shadowDOM. When text nodes are transposed as the top node, they come without style.
  </li>
</ul>
```
 
## References

 * dunno