# Problem: FlattenTrueIsFalse

In [HowTo: `assignedNodes()`](../chapter2_slot_basics/5_HowTo_assignedNodes), we saw how
`.assignedNodes()` can be used to introspect the flattened DOM state of a `<slot>`.
In this chapter we will look at how `assignedNodes()` behaves in a SlotMatroska.

To introspect transposed nodes in a SlotMatroska, `assignedNodes()` provide an option called
`{flatten: true}`. When calling `assignedNodes({flatten: true})` on a `<slot>` element, all
the `<slot>` elements in the SlotMatroska are *replaced* by either their transposed nodes or their
fallback children in the resulting list. `assignedNodes({flatten: true})` thus "flattens" and 
removes the `<slot>` elements from the `assignedNodes()` list.

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
   fallback nodes.

The flattened DOM is `{flatten: false}`! Do not let `assignedNodes({flatten: true})` fool you 
into believing otherwise.

## How to flatten a non-flat world

The `<slot>` structure in the flattened DOM is not flat. When you are not making web components
intended for reuse in contexts unknown, this `<slot>` structure might have meaning.

But, when you need to disregard `<slot>` elements, you should do so consistently. 
When `<slot>` elements are considered inconsequential, there is no reason why that should not
apply this logic to main document `<slot>` elements:

```javascript
function flatDomChildNodes(slot, options){
  const flattenedChildren = slot.assignedNodes(options);
  if (flattenedChildren.length === 0)
    return slot.childNodes;
  if (!options || !options.flatten)
    return flattenedChildren;
  const flatFlat = [];
  for (let node of flattenedChildren) {
    if (node.tagName === "SLOT"){
      for (let node of node.childNodes) {
        flatFlat.push(node);
      }      
    } else {
      flatFlat.push(node);
    }
  }
  return flatFlat;        
}
```

## Example: FlatDomChildNodes



# References

 * 

