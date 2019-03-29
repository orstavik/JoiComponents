#HowTo: `HTMLSlotElement.assignedNodes()`

`<slot>` elements have two methods to discover which nodes are assigned to them:

 * `.assignedNodes()` 
   Returns an array of all the assigned DOM nodes for a slot element, 
   both text and element DOM nodes (cf. `.childNodes`).
 * `.assignedElements()`
   Returns an array of all the assigned html elements, 
   excluding for example text and comment nodes (cf. `.children`).

## `.assignedNodes()` vs `.flatDomChildNodes(slot)`

The `.assignedNodes()` return a list of all the lightDOM nodes that are transposed into a `<slot>`.
But, if the `<slot>` content is fallback nodes of the `<slot>` itself, ie. its `.childNodes`, 
then `.assignedNodes()` returns an empty list. This means that `.assignedNodes()` does *not* return
a `<slot>` elements flattened DOM childNodes, but only the `<slot>` elements flattened DOM childNodes
if they are transposed. That means that to ask for an element's flattened DOM childNodes, you need to:

```javascript
function flatDomChildNodes(slot){
  let flattenedChildren = slot.assignedNodes();
  if (flattenedChildren.length === 0)
    return slot.childNodes;
  return flattenedChildren;        
}
```

## Example: `.assignedNodes()` and `.flatDomChildNodes(slot)`

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
<green-frame id="two">hello world</green-frame>
<green-frame id="three">
  <h1>hello sunshine</h1>
</green-frame>
<green-frame id="four">
</green-frame>

<script >
function flatDomChildNodes(slot){
  let flattenedChildren = slot.assignedNodes();
  if (flattenedChildren.length === 0)
    return slot.childNodes;
  return flattenedChildren;        
}

const one = document.querySelector("#one").shadowRoot.children[1].children[0];
const two = document.querySelector("#two").shadowRoot.children[1].children[0];
const three = document.querySelector("#three").shadowRoot.children[1].children[0];
const four = document.querySelector("#four").shadowRoot.children[1].children[0];

console.log(one.assignedNodes());
console.log(flatDomChildNodes(one));
console.log(two.assignedNodes());
console.log(flatDomChildNodes(two));
console.log(three.assignedNodes());
console.log(flatDomChildNodes(three));
console.log(four.assignedNodes());
console.log(flatDomChildNodes(four));
</script>
```

## References

 * 