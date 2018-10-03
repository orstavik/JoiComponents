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
We can call such post-construction process a "DOM-branch-dependent-process".

## slotchange: a DOM-branch-dependent-process

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

## The completion of DOM-branch construction

There are two modes of DOM construction. First, the sync mode. Second, the parser of the main document.

The parser of the main document creates custom elements one by one in the main DOM document.
To explain how the construction of elements happen here, is beyond the scope of this book, let alone this chapter,
but to make a long story short, the construction of the main DOM branch is *marked* by the triggering
of domContentLoaded event (DCL).

Until dcl, the main dom branch is still being constructed.
Some smaller branches of the main dom branch might be complete, but 
the browser gives no "partial-dom-branch-loaded" events as it goes along.
This means that if you wish to delay an event until a batch of dom nodes in the main DOM document
is constructed, you need to delay the event until all the DOM branches in the main DOM document is complete:
ie. delay until DCL.
For custom elements this means that you wish to delay processing slotchange events until after DCL;
To BatchedConstructorCallbacks of the main document, you therefore wish to delay triggering the process until DCL.

The second mode of DOM construction is sync.
Sync mode can both be triggered by JS initialized constructors and the sync parser .innerHTML.
These can be dynamically triggered during the setup of the main document (thus already delayed until DCL)
or after DCL.

To delay processing events after DCL, you need another pattern: BatchedConstructorCallbacks.

## BatchedConstructorCallback

The BatchedConstructorCallback uses the constructor to both
1. register the element in a global register *as started*, and 

2. use a delayed microtask to register the element in another global register *as ended*.

   The delayed microtask will allow all the other "normal" construction processes to finish
   before it flags the element as constructed.
   
3. When the element constructor is registered *as ended*, 
   the BatchedConstructorCallback also checks if all constructors that were started have now ended.
   This it does by just checking the length of the *constructors started* against the length of
   *constructors ended*.
   
   When all the started constructors have also ended, the element starts flushing its que.
   It does this by taking the last element registered and running the process it intends on it.
   You can think of this process as for example slotchange processing.
   
4. As the process being run on the element might start new constructors,
   the process must check if all started constructors are completed for each element it process.
   
5. When all the elements in the *constructors started* que have both *ended* and *processed completely*,
   then the ques are reset and the flushing batched processes ends.

### Example: WebComp with afterAllConstructorsEnded

In this example we create a mixin that provides a `.afterAllConstructorsEnded(...)` callback.
`.afterAllConstructorsEnded(...)` is first delayed until DCL, and then delayed in the microtask que.

```html
<script>
  /*First, block flushing of the que until DCL, and on DCL, open the que and try to flush it*/
  let ready = document.readyState === "complete" || document.readyState === "loaded";
  ready || window.addEventListener("DOMContentLoaded", function() {ready = true; runQue();});
  
  
  let startedQue =[];
  let endedQue =[];
  let completed = [];
  
  function findLastNotChecked(toRun, hasRun){
    for (let i = toRun.length - 1; i >= 0; i--){
      let el = toRun[i];
      if (hasRun.indexOf(el) < 0)
        return el;
    }
    return null;
  }

  function addToQue(el){
    startedQue.push(el);
    Promise.resolve().then(()=>{endedQue.push(el); runQue();});
    
    //alternative que timing
    //requestAnimationFrame(()=>{endedQue.push(el); runQue();});    //que timing 2
    
    //This should have been que timing 1.
    //but, the problem is normal template constructor in Chrome.
    //this constructor does not provide a proper .assignedNodes() at any time during the microtask cycle of either constructor nor connectedCallback.
    //this leaves the next raf as the best, but not ideal callback time.
    //The postBatchedConstructorTiming should be:
    //1. as soon as possible, and as sync with first, outermost, triggering constructor as possible
    //2. but after all started constructors are finished,
    //3. and after all the attributes are available (not a problem)
    //4. and after all the final assignedNodes chain is available (problem in normal template parsing in Chrome).
    //
    //Two alternative solutions:
    //A. use raf, + similar behavior in all browsers,
    //            - delay the callback longer than desired, maybe strange race conditions.
    //
    //B. use microtask que
    //   - this will in normal construction in Chrome cause the batchedConstructorCallback
    //     to run on all the constructed elements *when the top level is likely empty*.
    //     The batchedConstructorCallback would then add childList MutationObserver, 
    //     which would trigger asap a second time later.
    //     This option is not bad.
  } 

  function runQue(){
    if (!ready) return;
    //step 1:
    //there are outer constructor microtask ques that has still not ended
    //do nothing, and wait for the next one to be called
    if (startedQue.length !== endedQue.length)  return;
    //alternative if elements are removed from ques:
    //  let el = findLastNotChecked(startedQue, endedQue);
    //  if (el) return;
    
    //step 2:
    //check if all the elements started has also been completed
    //then, the que with elements is flushed.
    //alternative if elements are removed from ques:
    //if (startedQue.length === completed.length) {  3x ques = []; return; }
    const el = findLastNotChecked(startedQue, completed);
    if (!el) {
      startedQue =[];
      endedQue =[];
      completed = [];
      return;      
    }
    //step 3:
    //call the function on the element
    //mark the element as completed
    //run the que again from scratch
    //(in case new elements has been added to startedQue as a side-effect of running the function)
    fn(el);
    completed.push(el);
    return runQue();
  }
  
  function HTMLElement2(Base){
    return class HTMLElement2 extends Base {
      constructor(){
        super();
        addToQue(this);
      }
    }
  }
  
  const fn = function(el) { el.afterAllConstructorsEnded();}

  class WebComp3 extends HTMLElement2(HTMLElement) {
    afterAllConstructorsEnded() {
      console.log("afterAllConstructorsEnded", this);
      const slot = this.shadowRoot.children[0].children[0];
      console.log(this, this.isConnected);
      console.log(this, slot.assignedNodes()[0]);
      console.log(this, this.hostNode);
    }
    connectedCallback(){
      console.log("connected", this);
      Promise.resolve().then(()=>{console.log("connectedEnd", this);});
    }
  }
  
  class Inner extends WebComp3 {
    constructor() {
      super();
      console.log("Constructor", this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<b><slot></slot></b>";
    }
  }
  
  class Middle extends WebComp3 {
    constructor() {
      super();
      console.log("Constructor", this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<inner-inner a='innerAttr'><slot></slot></inner-inner>";
    }
  }
  
  class Outer extends WebComp3 {
    constructor() {
      super();
      console.log("Constructor", this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<middle-middle a='middleAttr'><slot></slot></middle-middle>";
    }
  }
  customElements.define("inner-inner", Inner);
  customElements.define("middle-middle", Middle);
  customElements.define("outer-outer", Outer);
</script>
<outer-outer a='outerAttr'>.</outer-outer>

```


The 


That means that you likely wish to delay the processing of slotchange events until this point.
This is a little bit problematic as the main dom branch consists of many smaller dom branches,
but as the browser gives , if you wish to batch DOM element constructors 
created by the main document parser, dom content loaded is your best bet.

## Purpose: establish your own que

The BatchedConstructorCallback ensures that once a constructor is called on one of its children,
it will not trigger the callback until this constructor and all such constructor that implement 
BatchedConstructorCallback pattern have all completed.

The BatchedConstructorCallback only works when you have access to all constructors.
This is not the case with custom elements, as you might use other custom elements developed by others
using different patterns and resources.
This is neither the case when other developers are using your custom elements within 
their own custom elements.
Thus, when applied to custom elements, the BatchedConstructorCallback only gives you the time of
the latest custom element, and fully works if you have 
access to the outermost element being constructed. 
This pattern is therefore best employed when:
 * all custom elements use it, ie. *globally*, either in the browsers themselves or in a custom framework,
 * when you have access to the outermost elements, such as all the app-level elements,
 and they all employ it.

If you don't have access to all custom elements 
or in a global framework. If you have access to the outermost element being constructed
, 

The BatchedConstructorCallbacks pattern aims at creating its own async callback time.
BatchedConstructorCallback-time can transcend microtask ques in the browser, 
ie. it can be later than a `Promise.resolve().then(...)` callback placed after it.


But it will still run immediately, it is not delayed in a rAF.

within the synchronous domain of the such as `requestAnimationFrame(...)` and `Promise.resolve().then(...)`.
And it will 

special within synchronously the microtask cycle.
point

This pattern is a fairly complex beast. Do not worry if you do not understand it immediately.
It is really not intended to be used by "normal" elements, not even by "normal" mixins.
It is a pattern intended to establish a point in time that establish what can be seen as a que
akin to .

## important:

2. must add the empty default slotchange event when nothing is slotted.