# Problem: FlattenTrueIsFalse

In [HowTo: `assignedNodes()`](../chapter2_slot_basics/5_HowTo_assignedNodes), we saw how
`.assignedNodes()` can be used to introspect the flattened DOM state of a `<slot>`.
In this chapter we will look at how `assignedNodes()` behaves in a SlotMatroska.

To introspect transposed nodes in a SlotMatroska, `assignedNodes({flatten: true})` is an option. 
When calling `assignedNodes({flatten: true})` on a `<slot>` element, all
the `<slot>` elements in the SlotMatroska are *replaced* by either their transposed nodes or their
fallback children in the resulting list. This "flattens" and removes the `<slot>` elements from 
the `assignedNodes()` list.

## Problem #1: a strange main document `<slot>`

There is one exception to the `assignedNodes({flatten: true})` described above. When a `<slot>` 
elements is placed in the main document, the top-level lightDOM, then that `<slot>` element will
a) not be replaced by its `.childNodes`, but b) be kept in the result list from 
`assignedNodes({flatten: true})`. 

Such a main document `<slot>` is strange. What is the purpose of a `<slot>` element in the top-most
lightDOM? But, this quirkiness is not lessened by having `assignedNodes({flatten: true})` giving it
special treatment. Even if a script happens to put a quirky `<slot>` element in the main document, 
`assignedNodes({flatten: true})` should still unwrap it along side all the other `<slot>` elements 
in a SlotMatroska.

## Problem #2: The flattened DOM is `{flatten: false}`

To unwrap all `<slot>` elements in a SlotMatroskas by removing all the `<slot>` elements and 
replacing them with either transposed or fallback lightDOM nodes, *feels* nice. To replace `<slot>` 
elements with these other nodes is after all what flattening the DOM means, right? Wrong!!
This does not echo the state of the flattened DOM. As we have so thoroughly illustrated in this 
chapter, the flattened DOM is *not* "flat" like that. "Flat" has *two* different meanings:

1. "Flat" in `assignedNodes({flatten: true})` means to *replace* `<slot>` elements with transposed 
   or fallback nodes (except for the strange main document `<slot>` elements).

2. "Flat" in the "flattened DOM" means to *wrap* `<slot>` elements around their transposed or
   fallback nodes, as SlotMatroskas.

The flattened DOM is `{flatten: false}`! Do not let `assignedNodes({flatten: true})` fool you 
into believing otherwise.

## How to flatten a non-flat world

The `<slot>` structure in the flattened DOM is not flat. Thus, the truest representation of a
`<slot>` elements flattened DOM child nodes is:

```javascript
function flatDomChildNodes(slot){
  const transposed= slot.assignedNodes();
  if (transposed.length === 0)
    return slot.childNodes;
  return transposed;
}
```

However, if you really wish to disregard `<slot>` elements in your introspection, then
this logic should be applied to main document `<slot>` elements too:

```javascript
function simplifiedFlatDomChildNodes(slot){
  const flattenedChildren = slot.assignedNodes({flatten: true});
  if (flattenedChildren.length === 0)
    return slot.childNodes;
  const flatFlat = [];
  for (let node of flattenedChildren) {
    if (node.tagName === "SLOT"){
      for (let child of node.childNodes)
        flatFlat.push(child);
    } else {
      flatFlat.push(node);
    }
  }
  return flatFlat;        
}
```

## Example: FlatDomChildNodes

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
          <slot id="inner">Hello grey world</slot>
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
            <slot id="outer">Hello green world</slot>
          </passe-partout>
        </div>`;
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame id="one"><slot id="strange">hello world</slot></green-frame>
<br>
<slot id="two"><h1>hello sunshine</h1></slot>

<script>
  function flatDomChildNodes(slot){
    const transposed= slot.assignedNodes();
    if (transposed.length === 0)
      return slot.childNodes;
    return transposed;
  }

  function simplifiedFlatDomChildNodes(slot){
    const flattenedChildren = slot.assignedNodes({flatten: true});
    if (flattenedChildren.length === 0)
      return slot.childNodes;
    const flatFlat = [];
    for (let node of flattenedChildren) {
      if (node.tagName === "SLOT"){
        for (let child of node.childNodes)
          flatFlat.push(child);
      } else {
        flatFlat.push(node);
      }
    }
    return flatFlat;
  }

  const onePassePartout = document.querySelector("#one").shadowRoot.children[1].children[0];
  const one = onePassePartout.shadowRoot.children[1].children[0];
  const two = document.querySelector("#two");

  console.log("--------one--------------");
  console.log("assignedNodes({flatten: true}): ", one.assignedNodes({flatten: true}));
  console.log("flatDomChildNodes(slot): ", flatDomChildNodes(one));
  console.log("simplifiedFlatDomChildNodes(slot): ", simplifiedFlatDomChildNodes(one));
  console.log("--------two--------------");
  console.log("assignedNodes({flatten: true}): ", two.assignedNodes({flatten: true}));
  console.log("flatDomChildNodes(slot): ", flatDomChildNodes(two));
  console.log("simplifiedFlatDomChildNodes(slot): ", simplifiedFlatDomChildNodes(two));
</script>
```

# References

 * 