# Pattern: TimedLifecycleCallbacks

TimedLifecycleCallbacks extends the [BatchedCallback](Pattern11_BatchedCallbacks).
Timed lifecycle callbacks is a callback on a web component that are triggered as a group for 
all web components that implements it. The callbacks are triggered automatically by a system
timer such as `setInterval` and `requestAnimationFrame`. Once the timer triggers, it will run through
all the web components implementing it and call the lifecycle callback method on them.

TimedLifecycleCallbacks are useful because they enable us to *batch and time* the execution of 
certain lifecycle callbacks. This helps us:
1. coordinate the processing of shared resources (such as CSSOM or layout calculation),
2. debounce and delay functions that otherwise could be called too often and then consume too much resources, and
3. separate different task groups in time so to avoid conflicts between them and make their execution
   more efficient.

## Example: SetIntervalBatchMixin

TimedLifecycleCallbacks are very simple to implement.
In addition to the [BatchedCallback mixin's](Pattern11_BatchedCallbacks) 
batch register and its three functions `addToBatch(el)`, `removeFromBatch(el)`, and `runBatchProcess()`, 
all we need is:

1. `startBatchCallbacks()`. 
   A global function activates the timer that will trigger the lifecycle callback at set intervals. 
   
2. `stopBatchCallbacks()`. A global function deactivates the timer.

3. To trigger `startBatchCallbacks();` by default.

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
      addToBatch(this);
    }
    
    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
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
<h4>Double-click to toggle the batch process</h4>
<one-one>one</one-one>
<hr>
<two-two>two</two-two>
<hr>
<three-three>three</three-three>

<script type="module">
  import {BatchMixin, stopBatchCallback, startBatchCallback} from "BatchMixin.js";
  
  class One extends HTMLElement{};
   
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
