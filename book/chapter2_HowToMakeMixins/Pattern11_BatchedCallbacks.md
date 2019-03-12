# Pattern: BatchedCallbacks

Sometimes, you want a lifecycle callback to be called at the same time for all the web components 
in your app. To do so is "to batch these callbacks". All the big three lifecycle callbacks 
for web components presented in this book, `slotCallback`, `styleCallback`, and `layoutCallback`,
depend on this pattern at their core.
 
To batch a lifecycle callback, you need to do the following:
1. create a global registry in which all the web components whose callback you want batched can be added.
2. register and remove all your web components from this register (this is most often done in the 
   `connectedCallback()` and `disconnectedCallback()` respectively).
3. trigger a function that will iterate the register of elements and call all the functions on them.

In addition, we want two functions on the web component:
1. startBatchCallback()
2. stopBatchCallback()

## Example: BatchMixin

In this example we create a mixin with a dummy callback `batchCallback()`.
The mixin will register/deregister the element in a MixinSingleton array of elements
when the element connects/deconnects to the DOM.
The mixin also exports a global `runBatchProcess()` function that can be used to manually 
trigger an iteration of the elements in the batch and that runs the `batchCallback()` on them.

There is one important problem with the `runBatchProcess()` iteration.
If the `batchCallback()` functions triggered during the batch causes elements to be added or removed
from the batch register, this can cause the iteration to crash or jump around.
To avoid such problems, the `runBatchProcess()`, `addToBatch(el)`, and `removeFromBatch(el)`
would require some custom logic suited the particular purpose of that batch.
In this simple example, we only ensure that the `runBatchProcess()` iteration operates on its unique
array instance and that it ensures that any elements in the iteration list is still present in the
original register (ie. that the element it will invoke the callback on has not been removed from 
the register *during* the same `runBatchProcess()`).

```javascript
const batch = [];

function addToBatch(el) {
  const index = batch.indexOf(el);
  if (index === -1)
    batch.push(el);
}

function removeFromBatch(el){
  const index = batch.indexOf(el);
  if (index >= 0)
    batch.splice(index, 1);
}

export function runBatchProcess(){
  const els = batch.slice();
  for (let el of els) {
    if (batch.indexOf(el)>=0)                      //[x] 
      el.batchCallback();
  }
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
    
    startBatchCallback(){
      addToBatch(this);      
    }
    
    stopBatchCallback(){
      removeFromBatch(this);      
    }
  };
}
//x. we could use if (el.isConnected) here instead. In this case, this check would be faster and simpler.
//   however, this solution require us to know the logic of the element using the callback, and
//   the semantics of (dis)connectedCallback and isConnected, so to keep the example tidy, I have 
//   opted for a more expensive, but simpler solution of checking whether the element is still present
//   in the original register.
```

## Demo

In this demo we add the mixin to two out of three custom elements.
we implement a simple marker to show how the two elements changes color when triggered.

```html
<h4>Double-click on the page to run the batch process</h4>
<one-one>one</one-one>
<hr>
<two-two>two</two-two>
<hr>
<three-three>three</three-three>

<script type="module">
import {BatchMixin, runBatchProcess} from "BatchMixin.js";

class One extends HTMLElement{}
 
class Two extends BatchMixin(HTMLElement){
  batchCallback(){
    this.innerText = "batched";
  }
}
class Three extends BatchMixin(HTMLElement){
  batchCallback(){
    this.innerText = "batched";
  }
}

customElements.define("one-one", One);
customElements.define("two-two", Two);
customElements.define("three-three", Three);


window.addEventListener("dblclick", function(){
  document.querySelector("two-two").stopBatchCallback();
  runBatchProcess();
});
</script>
```

## References
 * 
