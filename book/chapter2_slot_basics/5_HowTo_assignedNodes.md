# HowTo: `HTMLSlotElement.assignedNodes()`

`<slot>` elements have two methods to discover which nodes are assigned to them:

 * `.assignedNodes()` 
   Returns an array of all the assigned DOM nodes for a slot element, 
   both text and element DOM nodes (cf. `.childNodes`).
 * `.assignedElements()`
   Returns an array of all the assigned html elements, 
   excluding for example text and comment nodes (cf. `.children`).

## `{flatten: true}`

The `.assignedNodes()` return a list of all the lightDOM nodes that are transposed into a `<slot>`.
But, if the `<slot>` gets no transposed nodes and instead fallback to its `.childNodes`,
then `.assignedNodes()` returns an empty list. To get the fallback nodes from `.assignedNodes()` 
if there are no transposed nodes, use  `.assignedNodes({flatten: true})`. 
`.assignedNodes({flatten: true})` returns first any transposed nodes, and 
then falls back to the `.childNodes` list. 

## Example: `.assignedNodes()` and `.assignedNodes({flatten: true})`

```html
<script>
  class GreenFrame extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            display: block;
            border: 10px solid green;
          }
        </style>

        <div>
          <slot>Now you see me.</slot>
        </div>`;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame id="one"></green-frame>
<br>
<green-frame id="two">hello world</green-frame>
<br>
<green-frame id="three">
  <h1>hello sunshine</h1>
</green-frame>
<br>
<green-frame id="four">
</green-frame>

<script >
  const one = document.querySelector("#one").shadowRoot.children[1].children[0];
  const two = document.querySelector("#two").shadowRoot.children[1].children[0];
  const three = document.querySelector("#three").shadowRoot.children[1].children[0];
  const four = document.querySelector("#four").shadowRoot.children[1].children[0];

  console.log(one.assignedNodes());
  console.log(one.assignedNodes({flatten: true}));
  console.log(two.assignedNodes());
  console.log(two.assignedNodes({flatten: true}));
  console.log(three.assignedNodes());
  console.log(three.assignedNodes({flatten: true}));
  console.log(four.assignedNodes());
  console.log(four.assignedNodes({flatten: true}));
</script>
```

Naively, `.assignedNodes({flatten: true})` can be considered a `<slot>`'s flattened DOM child nodes. 
But, this is incorrect. In [Problem: FlattenTrueIsFalse](../chapter3_slot_matroska/5_Problem_FlattenTrueIsFalse)
we discuss the problems with `.assignedNodes({flatten: true})` in more depth.

## References

 * 
