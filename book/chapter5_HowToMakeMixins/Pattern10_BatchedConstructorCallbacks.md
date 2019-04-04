# Pattern: BatchedConstructorCallbacks

> The problem of redundant slotchange events is not easy.
Neither is the solution to the problem.
But here goes!

It is natural for a custom elements to create new custom elements in their shadowDOM as
part of their constructor process.
When they do, these constructors will nest inside each other, and so 
when the inner constructor process finishes, 
the outer process might is still left open.

This can create some problems if you want to run a post-construction process for the element 
that not only anticipate that the individual element which triggers the process is completed,
but also that the process that construct the parent or child nodes of the element is completed.
We can call such a process a "DOM-branch-dependent" process.

## slotchange: a DOM-branch-dependent process

A prime example of such a DOM-branch-dependent-process is the triggering of "slotchange" events.
A slotchange is an event that reflect a DOM branch constellation that:
 * involves at least a slot element and a slotted node, and
 * that spans across at least two DOM documents.
 
When a portions of HTML template is parsed, many such initial constellations of DOM-branches
are "immediately" setup.
When a custom element creates another custom element, many more such constellations of DOM-branches
are also "immediately" setup.
However, the machine behind this construction must go through many different steps in order to set up
the final constellation. It has to build one element at a time, and by doing so needs to create several
"temporary" DOM branch constellations.
And for some of these "temporary" DOM branch constellations, ie. when slot elements are chained,
the browser will dispatch different slotchange event for different temporary constellations.

However, when setting up their elements, the developer only *sees* one such "immediate" constellation,
the final one.
The different, temporary DOM branch constellation that happen within the black box of the custom element construction,
are therefore extremely hard to access conceptually for the HTML template author.
Additionally, these temporary slotchange events are overwritten by the last slotchange event
that occur when the final DOM branch constellation is setup.

As such, slotchange is a process that depends on a branch on DOM nodes being setup, not just a single 
element construction is completed.
And therefore, you wish to delay processing, since you can't delay triggering slotchange events, 
until the entire DOM-branch on which it depends is completed.

## The completion of DOM-branch construction: 1) Main document parser

There are two modes of DOM construction. First, parsing of the main document. Second, sync mode. 

The parser of the main document creates custom elements one by one in the main DOM document.
To explain how the construction of elements happen here, is beyond the scope of this book, 
let alone this chapter,
but to make a long story short, the end of the construction of the main DOM branch is *marked* by 
the `domContentLoaded` event (DCL).

Before DCL, the main dom branch is still being constructed.
Some smaller branches of the main dom branch might be complete, but 
the browser gives no "partial-dom-branch-loaded" events as it goes along.
This means that if you wish to delay an event until a batch of dom nodes in the main DOM document
is constructed, you need to delay the event until all the DOM branches in the main DOM document is complete:
ie. delay until DCL.
For custom elements this means that you wish to delay processing slotchange events until after DCL;
To BatchedConstructorCallbacks of the main document, you therefore wish to delay triggering the process until DCL.

```javascript
/** First, block flushing of the que until DCL, and on DCL, open the que and try to flush it **/
let ready = document.readyState === "complete" || document.readyState === "loaded";
ready || window.addEventListener("DOMContentLoaded", function() {ready = true; runQue();});
```

## The completion of DOM-branch construction: 2) SYNC

The second mode of DOM construction is sync.
Sync mode can both be triggered by JS initialized constructors and the sync parser `.innerHTML`.
These can be dynamically triggered during the setup of the main document (thus already delayed until DCL)
or after DCL.

To delay processing events after DCL, you need another pattern: BatchedConstructorCallbacks.

### BatchedConstructorCallback

The BatchedConstructorCallback uses the constructor to both
1. register the element in a global register *as started*, and 

2. On the first element added, use a delayed microtask to start flushing the que.
   This delayed microtask will only kick in after all the other microtask frames has completed.
   The delayed microtask will allow all the other "normal" construction processes to finish
   before it flags the element as constructed.
   
3. When the element starts flushing its que, it does this in LIFO order (last in, first out).
   It then processes each task, and then register that task as completed.
   
4. Since the tasks being flushed might start new constructors that gets added to the que,
   the process must check if all started constructors are completed for each element it processes.
   
5. When all the elements in the *constructors started* que have been *processed*,
   then the ques are reset and the flushing batched processes ends.

Below is a SIF (self invoking function) that implements such a que:

```javascript
const batchedConstructorCallback = function(){
  
  //pure function to find the last in toRun, that !hasRun
  const findLastNotChecked = function (toRun, hasRun){
    for (let i = toRun.length - 1; i >= 0; i--){
      let el = toRun[i];
      if (hasRun.indexOf(el) < 0) 
        return el;
    }
    return null;
  }
  
  //Ques for batched tasks
  let startedQue =[];
  let completed = [];
  let isStarted = false;

  //First, block flushing of the que until DCL, and on DCL, open the que and try to flush it
  let dcl = document.readyState === "complete" || document.readyState === "loaded";
  dcl || window.addEventListener("DOMContentLoaded", function() {dcl = true; flushQue();});
  
  //process for flushing que
  const flushQue = function(){
    //step 1: check that dcl is ready.
    if (!dcl) return;
    //step 2: all elements started has been processed? reset and end
    const fnel = findLastNotChecked(startedQue, completed);
    if (!fnel) {
      startedQue =[];
      completed = [];
      return;      
    }
    //step 3: run function, add the element to the completed list, and run again with TCO
    fnel[0](fnel[1]);
    completed.push(fnel);
    flushQue();
  }
  return function batchedConstructorCallback(fn, el){
    startedQue.push([fn,el]);
    if (!isStarted){
      isStarted = true;
      Promise.resolve().then(()=>{
        flushQue(); 
        isStarted = false;
      });
    }
  }                                                        
}();
```

### Mixin: DOMBranchReady

In this example we create a mixin that provides a `.domBranchReady()` callback.
`.domBranchReady()` is first delayed until DCL, and then delayed in the microtask que.
The code you put in `.domBranchReady()` you can be sure will be called as soon as possible
after the DOM branch in which your element has been constructed is ready.

```javascript
//pure function to find the last in toRun, that !hasRun
function findLastNotChecked(toRun, hasRun){
  for (let i = toRun.length - 1; i >= 0; i--){
    let el = toRun[i];
    if (hasRun.indexOf(el) < 0) 
      return el;
  }
  return null;
}

//Ques for batched tasks
let startedQue =[];
let completed = [];
let isStarted = false;

//First, block flushing of the que until DCL, and on DCL, open the que and try to flush it
let dcl = document.readyState === "complete" || document.readyState === "loaded";
dcl || window.addEventListener("DOMContentLoaded", function() {dcl = true; flushQue();});

//process for flushing que
function flushQue(){
  //step 1: check that dcl is ready.
  if (!dcl) return;
  //step 2: all elements started has been processed? reset and end
  const fnel = findLastNotChecked(startedQue, completed);
  if (!fnel) {
    startedQue =[];
    completed = [];
    return;      
  }
  //step 3: run function, add the element to the completed list, and run again with TCO
  fnel[0](fnel[1]);
  completed.push(fnel);
  flushQue();
}

function batchedConstructorCallback(fn, el){
  startedQue.push([fn,el]);
  if (!isStarted){
    isStarted = true;
    Promise.resolve().then(()=>{
    //Promise.resolve().then(()=>{      //trick add this second Prt if you wish to delay the batchedConstructorCallback post `slotchange` event in all instances.
      flushQue(); 
      isStarted = false;
    //});                               
    });
  }
} 

const fn = function(el) { 
  el.domBranchReady();
}

function DOMBranchReadyMixin(Base){
  return class DOMBranchReadyMixin extends Base {
    constructor(){
      super();
      batchedConstructorCallback(fn, this);
    }
  }
}
```
## Example: OuterMiddleInner

This is a bit of a technical example. 
It just shows the status of each element when the callback is made.
Important here is to note that the flattened assigned nodes and the attributes 
are both ready to be used when this callback is made, and it is made 
as soon as possible when this happens. 

```html
<script type="module">

  import {DOMBranchReadyMixin} from "src/DOMBranchReadyMixin.js";

  class Inner extends DOMBranchReadyMixin(HTMLElement) {
    constructor() {
      super();
      console.log("Constructor", this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<b><slot></slot></b>";
    }
    domBranchReady() {
      const slot = this.shadowRoot.children[0].children[0];
      console.log("domBranchReady", this);
      console.log("isConnected", this.isConnected);
      console.log("flattenedAssignedNode", slot.assignedNodes({flatten: true})[0]);
      console.log("attribute", this.getAttribute("a"));
    }
    connectedCallback(){
      console.log("connected", this);
      Promise.resolve().then(()=>{console.log("connectedEnd", this);});
    }
  }
  
  class Middle extends DOMBranchReadyMixin(HTMLElement) {
    constructor() {
      super();
      console.log("Constructor", this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<inner-inner a='innerAttr'><slot></slot></inner-inner>";
    }
    domBranchReady() {
      const slot = this.shadowRoot.children[0].children[0];
      console.log("domBranchReady", this);
      console.log("isConnected", this.isConnected);
      console.log("flattenedAssignedNode", slot.assignedNodes({flatten: true})[0]);
      console.log("attribute", this.getAttribute("a"));
    }
    connectedCallback(){
      console.log("connected", this);
      Promise.resolve().then(()=>{console.log("connectedEnd", this);});
    }
  }
  
  class Outer extends DOMBranchReadyMixin(HTMLElement) {
    constructor() {
      super();
      console.log("Constructor", this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<middle-middle a='middleAttr'><slot></slot></middle-middle>";
    }
    domBranchReady() {
      const slot = this.shadowRoot.children[0].children[0];
      console.log("domBranchReady", this);
      console.log("isConnected", this.isConnected);
      console.log("flattenedAssignedNode", slot.assignedNodes({flatten: true})[0]);
      console.log("attribute", this.getAttribute("a"));
    }
    connectedCallback(){
      console.log("connected", this);
      Promise.resolve().then(()=>{console.log("connectedEnd", this);});
    }
  }
  customElements.define("inner-inner", Inner);
  customElements.define("middle-middle", Middle);
  customElements.define("outer-outer", Outer);
</script>
<outer-outer a='outerAttr'>.</outer-outer>
```


## DoublePrtPostSlotchangeTrick 
If you want to add an event listener for `slotchange` events, 
but not capture the initial slotchange event, do this inside the `domBranchReady()` callback:

```javascript
function batchedConstructorCallback(fn, el){
  startedQue.push([fn,el]);
  if (!isStarted){
    isStarted = true;
    Promise.resolve().then(()=>{
    //Promise.resolve().then(()=>{      //trick add this second Prt if you wish to delay the batchedConstructorCallback post `slotchange` event in all instances.
      flushQue(); 
      isStarted = false;
    //});                               
    });
  }
} 
```
Now, the flushQue() will only trigger its methods after the initial slotchange events have 
been dispatched and passed your custom element by.

## TODO tests!
test BatchedPostConstructorCallback and especially DoublePrtPostSlotchangeTrick.

Does The BatchedConstructorCallback only work from the level of the first element you call it from???
I'm not sure this is the case anymore. As the main parser mode is fixed with DCL, 
I think that the sync methods such as `innerHTML` and JS construction will work fine as they work within 
the same Prt frame.. I think..

## References

 * dunno