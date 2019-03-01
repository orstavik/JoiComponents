# Pattern: TimedLifecycleCallbacks

Lifecycle callbacks are called automatically. 
They can be trigger by for example a system callback, an event listener, an observed attribute,
timers, a native browser functionality, and a few more. In this pattern, we will look at
how timers can be used to trigger a callback.

TimedLifecycleCallbacks builds upon the [BatchedCallback](Pattern11_BatchedCallbacks).
They are triggered by either `setInterval` or `requestAnimationFrame`.
TimedLifecycleCallbacks are useful because they enable us to batch and delay the execution of 
certain lifecycle callbacks.
Such batching and delaying of lifecycle callbacks is beneficial because it allows us to coordinate
the processing of shared resources (such as CSSOM or layout calculation) and debounce and delay 
functions that otherwise would be called too often and then consume too much resources.

When we time lifecycle callbacks we want to have the following functionality available.

1. Start function. This global function activates the timer that will trigger the lifecycle callback
   at set intervals. This function should be triggered by default.
   
2. Stop function. This global function deactivates the timer. 

## Example: SetIntervalBatchMixin

In this example we extend the `BatchMixin` from the previous chapter [BatchedCallback](Pattern11_BatchedCallbacks).
In addition to having a global register of callbacks, we will trigger the callbacks every 3 seconds.

```javascript
const batch = [];
let interval;

function addToBatch(el) {
  batch.push(el);
}

function removeFromBatch(el){
  batch.splice(batch.indexOf(el), 1);
}

function runBatchProcess(){
  const els = batch.clone();
  for (let el of els) {
    if (batch.indexOf(el) >= 0) 
      el.batchCallback();
  }
}

export function startBatchCallback(){
  interval = setInterval(runBatchProcess, 3000);
}

export function stopBatchCallback(){
  clearInterval(interval);
}

startBatchCallback();

export function BatchMixin(type) {
  return class BatchMixin extends type {
    
    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      batch.push(this);
    }
    
    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      batch.remove(this);
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
<h4>Double-click to toggle the batch process</h4>
<one-one>one</one-one>
<hr>
<two-two>two</two-two>
<hr>
<three-three>three</three-three>

<script type="module">
  import {BatchMixin, stopBatchCallback, startBatchCallback} from "BatchMixin.js";
  
  class One extends HTMLElement;
  class Two extends BatchMixin(HTMLElement){
    batchCallback(){
      this.innerText += ".";
    }
  }
  class Three extends BatchMixin(HTMLElement){
    batchCallback(){
      this.innerText += ".";
    }
  }
  
  customElements.define("one-one", One);
  customElements.define("two-two", Two);
  customElements.define("three-three", Three);
  
  let on = true;
  function toggleBatchCallback(){
    on ? stopBatchCallback() : startBatchCallback();
    on = !on;
  }
  
  window.addEventListener("dblclick", toggleBatchCallback);
</script>
```

## References
 * 