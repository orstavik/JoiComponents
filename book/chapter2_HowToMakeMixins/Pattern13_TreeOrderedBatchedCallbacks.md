# Pattern: TreeOrderedBatchedCallbacks

todo simplify this into a chapter about TreeOrdered iteration on a mutable DOM instead.

When you run a batch of processes, they can often alter the batch register itself.
The previous Pattern BatchedCallbacks solved this by simply iterating on a clone of the register,
and skipping any elements in the register clone that had been removed from the original register.
This works fine, but there are three use-cases this simple `runBatchProcess` procedure does not
tackle:

1. processing the callbacks in DOM TreeOrder.
2. *allow* the `runBatchProcess` to add elements *below* the current point of iteration to be added
   to the current batch cycle. 
3. *disallow* elements *above* or *beside* the current point of iteration to be mutated 
   (altered, removed or moved).

## The problem of iterating over a DOM in which elements can be moved

These above use-cases are *not* simple to fulfill. Here is why.

When elements are added or removed as a side-effect of running a `batchCallback`,
then this would trigger the `addToBatch(el)` or `removeFromBatch(el)` functions. 
When these functions are triggered, the batch register could fairly simply ensure that
elements are *only* added and removed *below* the current point of iteration.
This is definitively doable.

However, things are not that simple: the elements are DOM nodes! As DOM nodes, elements can be moved 
around in the DOM without triggering the `connectedCallback()` nor `disconnectedCallback()`.
This means that:
1. if the `runBatchProcess` calls
2. a `batchCallback()` on an element that either
   1. directly alters DOM nodes above or beside itself or
   2. indirectly causes DOM nodes above or beside itself to be
      altered by for example 
      1. accidentally triggering an event that bubbles and triggers an event listener above or 
      2. changes an HTML attribute that is observed by a `MutationObserver` or
      3. changes the application state in a way that alters the DOM above or beside it or
      4. changes `localStorage` or some other global state that causes the DOM to be altered
3. then even though the register has exactly the same elements *before and after* the 
   `batchCallback` is processed, 
4. the TreeOrder of the element can be something completely different.

## How to iterate over a mutating DOM in TreeOrder?

The BatchedCallbacks pattern simply:
 1. exclude any alterations from the current cycle of `runBatchProcess` and  
 2. ignore any mutations that alters the TreeOrder of the DOM during the current cycle of `runBatchProcess`.
      
In this pattern we can't do the BatchedCallbacks pattern simplicity because 
we want to **always iterate in TreeOrder** and also **allow** changes to the batch register 
*below* the current point of iteration to be included.

This has some consequences. For every iteration of the batch process, the `runBatchProcess` needs to 
check that:
1. no elements in the registry that has not yet been processed has been placed higher in the TreeOrder 
   than the current point of iteration.
2. no elements in the registry that has *already* been processed is placed lower in the TreeOrder 
   than the current point of iteration.
3. that no elements are added or removed that are not directly below the current point of iteration.
4. that the next element of iteration is the next element in the registry that has not yet been processed.

The simple way to check this is:
1. no node in the processed list has moved below the pointOfIteration after execution
2. top-left-most element in the unprocessed list is not above pointOfIteration
3. keep two mutable lists, one unprocessed and one processed. The iteration ends when unprocessed list is empty.


## The cost of TreeOrder iteration on a mutatable DOM

TreeOrderedBatchedCallback is heavy. The simplest implementation of this would require the entire 
registry to be iterated fully for each element being processed, 
making the batch iteration an n*n order magnitude.

However, as the DOM can be mutated for each callback, there is no way around this sorting.
There are some extenuating circumstances:

1. A global function can be added that turns off some or all of the TreeOrder checks that developers
   who are certain that no element in their app will cause any side-effects that alters the DOM in
   a way that affects above or beside TreeOrder. Apps that follow good coding concepts can then test
   with the check in place and then in production/run-time turn off the TreeOrder checks to improve performance.

2. The registry will often not run all the elements. The two most notable implementations of 
   TreeOrderBatchProcess will only run a small selection of the elements (for example 5%) in a small 
   selection of the `runBatchProcess` invocations (for example 2%). This means that performance problems
   will only be a "rush hour" issue, not an overall performance issue.

3. In many apps, such a registry will likely not contain many elements. 
   Sure, a registry of 5 activated elements will perform 25 checks, 
   but as these individual checks are not heavy, maintaining TreeOrder will not cause problems
   until the number of activated elements at least hits a couple of dozens.
   In short, as the TreeOrderedBatchedCallback enable large performance improvements and developer 
   ergonomics in use, it is likely that the performance benefits TreeOrderBatchedCallbacks substantially
   outweigh its performance cost.

#### What to do when TreeOrder breaks during iteration?

When a `batchCallback` is run that causes the DOM to mutate in a way that would cause the
ongoing `runBatchProcess` to either a) break TreeOrder or b) not run all the registered elements,
it is an `Error`. So then, throw an `Error`.

The `Error` needs to be dispatched signaling which `batchCallback` on which element that caused the
mutation that broke the TreeOrdered iteration of all the registered elements.

1. When an element is added or removed in the registry 
   *above or before* the current point of iteration, it is an *absolute* error.
2. When an element is added or removed in the registry 
   *after, but not below* the current point of iteration, it is a *likely* error.
   Strictly speaking, this behavior does not need to cause the iteration to break.
   It would be up to the implementation to decide whether or not this should throw an wrror or just
   a warning.
3. When an element that has not yet been processed is moved *before* the current point of iteration,
   it is an *absolute* error.
4. When an element that has been processed is moved *after* the current point of iteration,
   it is a *likely* error.
   
## Example: TreeOrderBatchedCallbacksMixin

```javascript
let processed = [];
let unprocessed = [];
let pointOfIteration = undefined;

function checkAcceptableDomMutation(el, root, type, callbackName){
  if (root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)  //adding something
    throw new Error(callbackName + " on element of type: "+ el.className +" causes the DOM to mutate " +
     "so as to " +type +" a " + callbackName + ".");
  if (!(root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_CONTAINS))
    console.warn("warning");
  return false;
}                 

function addToBatch(el) {
  pointOfIteration && checkAcceptableDomMutation(el, pointOfIteration, "add", ".batchCallback()");
  unprocessed.push(el);
}

function removeFromBatch(el){
  pointOfIteration && checkAcceptableDomMutation(el, pointOfIteration, "remove", ".batchCallback()");
  unprocessed.splice(unprocessed.indexOf(el), 1);
}

export function runBatchProcess(){
  while (unprocessed.length){
    unprocessed = unprocessed.sort(function(a, b){
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING;
    });
    let next = unprocessed.shift();
    if (pointOfIteration && pointOfIteration.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_PRECEDING)
      throw new Error();
    for (let done of processed) {
      if (next.compareDocumentPosition(done) & Node.DOCUMENT_POSITION_PRECEDING)
        throw new Error();
    }
    pointOfIteration = next;
    processed.push(pointOfIteration);
    pointOfIteration.batchCallback();     //this callback can cause DOM and batch register mutations.
  }
  unprocessed = processed;
  processed = [];
  pointOfIteration = undefined;
}

export function BatchMixin(type) {
  return class BatchMixin extends type {
    
    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }
    
    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }
  };
}
```

## Demo: three elements that can cause DOM mutations

```html
<h4>Double-click on the page to run the batch process</h4>
<one-one>one</one-one>
<hr>
<two-two>two</two-two>
<hr>
<three-three>three</three-three>

<script type="module">
import {BatchMixin, runBatchProcess} from "BatchMixin.js";

class One extends HTMLElement{
  batchCallback(){
    this.dispatchEvent(new CustomEvent("one-event", {bubbles: true}));
  }
}

class Two extends BatchMixin(HTMLElement){
  batchCallback(){
    this.dispatchEvent(new CustomEvent("two-event", {bubbles: true}));
  }
}
class Three extends BatchMixin(HTMLElement){
  batchCallback(){
    this.dispatchEvent(new CustomEvent("three-event", {bubbles: true}));
  }
}

customElements.define("one-one", One);
customElements.define("two-two", Two);
customElements.define("three-three", Three);

window.addEventListener("dblclick", runBatchProcess);
window.addEventListener("one-event", function(){
  let anotherOne = document.createElement("one-one");
  document.body.prependChild(anotherOne);
});
window.addEventListener("two-event", function(){
  let two = document.querySelector("two-two");
  let three = document.querySelector("three-three");
  three.appendChild(two); //this will break the shit
});
</script>
```

## References
 * 