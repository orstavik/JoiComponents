# Pattern: QueuedAsyncSetupCallbacks

## Example problem: SixteenGrandchildren

We have a parent custom element with a shadowDOM consisting of 4 children and 16 grandchildren elements.
The parent element populates this shadowDOM in its `setupCallback()`,
and it delays the setup of both the parent elements and the children element so as not to overcrowd the browsers resources.
But, the browser wants to perform this setup operation 
You want to delay the setup of the parent element, but 
when you first setup the parent element, you also want to setup all the 20 descendant elements at the same time.


To achieve this effect, you once that element is initiate 
If you want to setup a branch of dom elements with `setupCallback()`s, you do not want a parent element with 5 children elements who each have 5 children (1+5+25)

One problem with using the `requestAnimationFrame()` to que our `setupCallback()`s is
that any tasks that are queued in the `requestAnimationFrame()` que within the scope of
a `requestAnimationFrame()` callback, will automatically be scheduled in the next animation frame, 
and not the current one.



In the previous chapter, we wrestled the control of the timing of `setupCallback()` and 
`connectedCallback()` from the browser. This opens up a whole new landscape of possibilities.
In this chapter, we start 

The simplest way to run 
To run `setupCallback()` we need to find some kind of async trigger or que, and 
make sure that when this trigger is run, our move the setup tasks of the custom element 

To run `setupCallback()` **async** we can add it as a task to the `requestAnimationFrame()` que.
When a task is added to the `requestAnimationFrame()` que, they do not run immediately,
but are delayed until the next time the browser is about to render the page.
To add a task to the que, we simply pass a function object (closure) to the `requestAnimationFrame()`
function.
If we want to que the `setupCallback()` of a custom element in the `requestAnimationFrame()` que,
we can do so from the `constructor()` like below:

```javascript
const isSet = Symbol("isSet");

function AsyncSetupMixin(Base){
  return class AsyncSetupMixin extends Base {
    
    get isSetup(){
      return this[isSet];
    }
    
    constructor(){
      super();
      this[isSet] = false;
      requestAnimationFrame(() => {
        this[isSet] = true;
        this.setupCallback();
        if (this.isConnected) 
          this.connectedCallback();
      });
    }
    
    //this must be implemented in the main class that extends 
    //connectedCallback() {
    //  if (!this.isSetup) return;
    //  ...
    //}    
  }
}
```


By placing `setupCallback()` in the `requestAnimationFrame` task que, 
`setupCallback()` becomes async.
We here exert more active control over when the `setupCallback()` task will be executed.
This control is useful, and can be used to control the setup of the custom element asynchronously.
The use of this control will be demonstrated later in this chapter.

## Race condition: `setupCallback()` vs `connectedCallback()`
But, what if the custom element is connected to the DOM *before* the next `requestAnimationFrame`?
And, the tasks in `connectedCallback()` depends on `setupCallback()` having been executed?
This scenario is not only very problematic, it is also very likely.

To solve this scenario requires an adaptation to both `setupCallback()` and `connectedCallback()`.
1. If `connectedCallback()` is called before `setupCallback()` has been executed, 
then we should abort the `connectedCallback()` while awaiting `setupCallback()`.
2. If `setupCallback()` is called after the element has already been connected to the DOM
(and thus had its `connectedCallback()` aborted), `setupCallback()` should trigger `connectedCallback()`
itself when it completes.

```javascript
class AsyncSetup extends HTMLElement {
  constructor(){
    super();
    //create the properties of this object here
    requestAnimationFrame(() => this.setupCallback());
  }
  
  setupCallback() {
    //setup attributes and populate shadowDOM here
    this.isSetup = true;
    if (this.isConnected) this.connectedCallback();
  }

  connectedCallback() {
    if (!this.isSetup) return;
    //reset attributes and object state here, connect event listeners, etc.
  }
}
```
When we take control over *when* `setupCallback()` should be executed,
we do so at the expense of the browser's control. 
When our `setupCallback()` is in **sync** with one of the browser controlled reactive callbacks 
(ie. triggered directly by either the `constructor()` or `connectedCallback()`), 
the browser will also ensure that race conditions between its callbacks and their function calls
are managed.

When we take control over *when* `setupCallback()` should be executed,
we must therefore also partially control *when* `setupCallback()` *can* be executed.
And this is what the solution above does. 
It specifies that `connectedCallback()` can only be called if `setupCallback()` has already run,
and it ensures that any aborted `connectedCallback()` are recalled if `setupCallback()` is run
when the element is connected to the DOM.

## Example: GoBananasAsync
In this example, we create the same custom element `GoBananas` and `setupCallback()` method.
The only difference here is that instead of triggering `setupCallback()` from the first 
`connectedCallback()`, we will essentially que both using `requestAnimationCallback()`.

```html
<script>
  class GoBananasAsync extends HTMLElement {
  
    constructor(){
      super();
      this.mentalState = "bananas";                                                
      requestAnimationFrame(() => this.setupCallback());                           //[1]
    }
    
    setupCallback(){                                                               
      this.hasAttribute("go") || this.setAttribute("go", this.mentalState);        
      this.isSetup = true;                                                         //[2]
      if (this.isConnected) this.connectedCallback();                              //[3]
    }
    
    connectedCallback(){
      if (!this.isSetup) return;                                                   //[4]
      //if (super.connectedCallback) super.connectedCallback();                    
      console.log("go " + this.getAttribute("go"));                                
    }
  }
  customElements.define("go-bananas-async", GoBananasAsync);
</script>

<go-bananas-async id="one"></go-bananas-async>                                                
<go-bananas-async id="two" go="crazy"></go-bananas-async>                                     

<script>
  const body = document.querySelector("body");
  const one = document.querySelector("#one");
  setTimeout(()=> body.removeChild(one), 1000);                                    
  setTimeout(()=> body.appendChild(one), 2000);                                    
  setTimeout(()=> body.removeChild(one), 3000);                           
  setTimeout(()=> one.setAttribute("go", "insane"), 4000);                         
  setTimeout(()=> body.appendChild(one), 5000);                                    
</script>
<!--
 go bananas                                                        //[5]
 go crazy
 go bananas                                                        //[6]
 go insane
-->
```                                                                   
1. In the `constructor()` a the `this.setupCallback()` is qued in `requestAnimationFrame`.
2. When `setupCallback()` has executed, this is registered using the property `isSetup`.
3. If the element has already been connected to the DOM when `setupCallback()` runs,
`connectedCallback()` is triggered. 
4. At the *absolute beginning* of `connectedCallback()`,
the `isSetup` state of the element is checked. If the element is not yet setup, 
the `connectedCallback()` aborts.
5. The browser does not trigger its `requestAnimationFrame` until all the synchronous scripts
in the document has completed. Therefore, the `setupCallback()` and `connectedCallback()` are not 
run while the page loads, but after.

## Mixin implementation comment 

The single line that *aborts* `connectedCallback()` when `setupCallback()` has not yet run, 
must:
1. be performed as the *very first* action of `connectedCallback()` and 
2. have the ability to halt the entire `connectedCallback()` sequence for all superclasses.

No mixin can deliver neither 1 nor 2. 
This means that *if* an async `setupCallback()` is implemented, 
then the `if(!this.setup) return;` line *must be* manually added to the custom element main class.

However, an mixin implementing an async `setupCallback()` can encapsulate and protect the integrity 
of the `isSetup` property using `Symbol` property and a custom getter method like so:

```javascript
const isSet = Symbol("isSet");

function AsyncSetupMixin(Base){
  return class AsyncSetupMixin extends Base {
    
    get isSetup(){
      return this[isSet];
    }
    
    constructor(){
      super();
      this[isSet] = false;
      requestAnimationFrame(() => {
        this[isSet] = true;
        this.setupCallback();
        if (this.isConnected) 
          this.connectedCallback();
      });
    }
    
    //this must be implemented in the main class that extends 
    //connectedCallback() {
    //  if (!this.isSetup) return;
    //  ...
    //}    
  }
}
```

## References
