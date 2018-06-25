# Mixin: FirstOpportunity

There are two problems with `FirstConnectedMixin`.

## Problem 1: setup traffic jams
A main point of `firstConnectedCallback()` is to avoid a big setup-traffic-jam at startup. 
A startup setup-traffic-jam might occur if heavy `constructor()`s 
are run for many elements all at once at startup.
`firstConnectedCallback()` solves this by moving all setup activity to the first time elements
are connected to the DOM.

But. `firstConnectedCallback()` can delay setup work too much:
setup-traffic-jams can also occur when too much setup work must be done in 
many elements that get connected to the DOM at the same time.

For example. You have a web app with ten pages that the user can choose from, 
and each page contains many DOM elements.
To avoid a setup-traffic-jam at startup, 
most or all of the setup tasks of these elements are delayed until `firstConnectedCallback()`.
By connecting each page to the DOM only when the user selects them,
`firstConnectedCallback()` can both delay *and* split up the startup setup-traffic-jam.
This will help greatly.

But. When a page gets connected to the DOM for the first time, 
*both* `firstConnectedCallback()` *and* `connectedCallback()`
must be executed for all the page's elements. And the bigger the page and the weaker the CPU, 
the more delay before the page gets ready and rendered.
With ten pages, you are still left with ten mini setup-traffic-jams, 
one for each time a new page gets connected.

Thus, `firstConnectedCallback()` can both split up and delay the setup until *the last possible moment*.
But, `firstConnectedCallback()` can create several mini setup-traffic-jams 
when bigger parts of the DOM gets connected.

## Solution 1: `firstOpportunity`

Often, these mini setup-traffic-jams are unnecessary. 
If only it had been told to do so, 
the browser often would have had time and opportunity to do the setup in advance.
In our example web app with ten pages, the browser might have been idle for lets say 2350ms 
while waiting for the user to choose a page. If the browser had been truly smart, 
it would have performed the setup of the elements during this waiting period, 
instead of 'lazily' waiting to the very last minute at `firstConnectedCallback()`.

So, we have some new setup criteria. 
Firstly, we want the setup callback to conform to the demands of `firstConnectedCallback()`. 
Setup tasks should executed:
 1. *after* the `constructor()` and
 2. *before* the first `connectedCallback()`. 
 
But, additionally, we want setup tasks to be executed:
 3. at **first opportunity**, ie. the first time the browser has spare capacity 
to execute a task that will not block rendering or other crucial tasks.

There is no exact way to identify the *first opportunity*. 
Instead, we will rely on a recursive chain of 1ms `setTimeout`s,
and trust that the browser will schedule new `setTimeout` without disturbing neither 
rendering nor other UI functionality.
This recursive chain will run against a que of all setup tasks organized in a first-opportunity-que.

As with `firstConnectedCallback()`, we make a `firstOpportunityCallback()`.
Elements place their setup tasks in `firstOpportunityCallback()` similar to `firstConnectedCallback()`.
When created, a callback to each element's `firstOpportunityCallback()` is added 
to the first-opportunity-que.
In addition, we ensure that:
1. if `connectedCallback()` is called before an element's `firstOpportunityCallback()`,
2. then `firstOpportunityCallback()` is called first,
3. the element is removed from the first-opportunity-que, and
4. lastly let the `connectedCallback()` run.

## Mixin: FirstOpportunityMixin for element instances
```javascript
var que = [];

function addToQue(el){
  if (que.length === 0)
    setTimeout(startQue, 1);
  que.push(el);
}

function startQue(){
  var firstIn = que.shift();
  firstIn.firstOpportunityCallback();
  if (que.length>0)
    setTimeout(startQue, 1);    
}

function runFirstOpportunityCallbackIfNecessary(el){
   if (removeFromQue(el)) 
     el.firstOpportunityCallback();
}

function removeFromQue(el){
  var pos = que.indexOf(el);
  if (pos < 0)
    return false;  
  que.splice(pos,1);
  return true;
}

function FirstOpportunityMixin(Base) {
  return class FirstOpportunityMixin extends Base {
    constructor(){
      super();
      addToQue(this);
    }
    connectedCallback(){
      runFirstOpportunityCallbackIfNecessary(this);
      if (super.connectedCallback) super.connectedCallback();
    }
  }
}
```

## Problem 2: don't objectify, that which you can do with class

When you load your application, time is critical. 
You do not want to perform any setup task for any elements that are not rendered at startup.
This rationale also applies for setup tasks for element *types* that are not yet used,
such as setting up a template and/or shared resources for all element instances.

Most often, setup tasks for element instances *depend on* setup tasks for the element type.
For example, an element instance can *setup* a shadowRoot by cloning a template 
*setup* with the element type. 
Therefore, any delayed setup tasks for the element type *must be* run before an setup 
tasks for the element instances.

## Solution 2: `static firstOpportunityCallback()`
As custom elements are classes that `extend HTMLElement`,
element type setup tasks can be associated with the element prototype (`static`) while
element instance setup tasks are associated with each object (normal).

To ensure that element type setup tasks are executed before any instance setup tasks, 
we need to register:
1. if the element type has a static setup task, and
2. if the static setup task has been executed.

## Mixin: FirstOpportunityMixin for both element type and element instances
```javascript
var que = [];
var staticQue = [];
var staticQueFinished = [];

function addToQue(el){
  if (que.length === 0)
    setTimeout(startQue, 1);
  que.push(el);
  var type = Object.getPrototypeOf(el);
  if (!staticQue.contains(type)){
    staticQue.push(type);
    if (!type.firstOpportunityCallback)
      staticQueFinished.push(type);
  }
  if (que.length === 0)
    setTimeout(startQue, 1);
}

function executeFirstOpportunityCallback(el){
  var type = Object.getPrototypeOf(el);
  if (!staticQueFinished.contains(type)){
    staticQueFinished.push(type);
    type.firstOpportunityCallback();
  }
  el.firstOpportunityCallback();  
}

function startQue(){
  var firstIn = que.shift();
  executeFirstOpportunityCallback(firstIn);
  if (que.length>0)
    setTimeout(startQue, 1);    
}

function runIfStillQueued(el){
  var pos = que.indexOf(el);
  if (pos < 0)
    return;  
  que.splice(pos,1);
  executeFirstOpportunityCallback(el);
}

function FirstOpportunityMixin(Base) {
  return class FirstOpportunityMixin extends Base {
    constructor(){
      super();
      addToQue(this);
    }
    connectedCallback(){
      runIfStillQueued(this);
      if (super.connectedCallback) super.connectedCallback();
    }                                    
  }
}
```

Todo: 
1. the main problem here is too much `if`-checking.
It is safe, good, but quite unnecessary.
One simple way to avoid it would be to always run types first in the que.. But.. That would not make their 
execution order based on their order of placement..
hm..
2. I here use arrays to store the registers. That uses contains. 
Maybe I should use different mechanism..

<!-- 
Now, when the this branch of DOM elements gets connected, 
as bunch of `firstConnectedCallback()`s as well as a bunch of normal `connectedCallback()`s
need to be run at the same time, slowing down performance.
If only the browser had realized this and run as many of the `firstConnectedCallback()` as possible
in the preceding idle period.

This is the purpose of `ReadyMixin`. Identically to `FirstConnectedMixin`,
`ReadyMixin` ensures that a callback method `readyCallback()` is triggered
*after* `constructor()` and *before* the first regular `connectedCallback()`.
But, `ReadyMixin` will try to trigger the `readyCallback()` at **the first opportune moment**, 
not at the last possible moment like `FirstConnectedMixin`.

To accomplish this, `ReadyMixin` needs to identify **the first opportune moment**, 
ie. when the browser 'is ready' or 'must be ready' to do some extra work on the component:
1. The browser *must* run the `constructor()` first.
2. If the browser is connecting the element to the DOM, the browser *must first* run the 
`readyCallback()` if it has not yet run.
3. Ask the browser for the first available "free" slot of process, 
by asking for `requestAnimationFrame()` (??or setTimeout??).
4. If the browser has not yet loaded, wait while the browser loads (todo skip this one I think)
document.loadedState !== "loading" + the `DOMContentLoaded` event skip this*??

`ReadyMixin` is inspired by the `PolymerElement.ready()` callback.
-->
