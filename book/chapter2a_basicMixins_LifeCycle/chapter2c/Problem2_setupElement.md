# Problem: When to setup a custom element

Custom elements can be created both:
* while the page is loading (both statically from the main html document and dynamically from js)
* after the page has finished loaded (only dynamically from js).

When the page is loading, we have two different scenarios. The element we need to set up is:
* **immediately** critical for the user experience ("above the fold") or 
* **not-yet** critical for the user experience ("below the fold").

After the page has loaded, we also have two scenarios. We need to set up our element:
* **immediately** because we intend to connect it to the DOM immediately or
* **in advance** because we need intend to connect it to the DOM later, but
we want to prepare the element when we have idle resources.

In sum three different scenarios for when we need to set up our custom element.

1. **immediately** as the element is connected to the DOM immediately.
2. **not-yet** the element is immediately connected to the DOM, but 
we wish to delay the element setup to allow for:
   * quicker rendering and/or 
   * prioritize user interaction or other tasks.
3. **in-advance** to create and setup elements that we will use later.

## Setup 1: immediately

Simple. But cannot be called in sync from the `constructor()`.

If the constructor tries to call 
`Promise.resolve(()=> this.setupCallback());`
the attributes will not have appeared/or it will already be connected?

If the constructor tries to call 
`setTimeout(()=>this.setupCallback(), 0)`
the attributes will not have appeared/or it will already be connected?

Therefore it must be called in sync with `connectedCallback()` directly prior to it.

## Setup 2: not-yet
 
Delay the setup and connectedCallback of an element. This is a little more complex. 
Remember that the setup can only recursively delay the setup of shadowDOM children, 
not lightDOM child elements, thus the benefit of delaying setup is therefore limited.
But, if the constructor has set the shadowRoot, and the shadowRoot has no slot, 
then the constructor of the lightDOM children elements will run, but not(!) their connectedCallback(!!).
So this should in theory work ok as a means to hide other tasks in lightDOM elements as long as 
their code is triggered by connectedCallback and not constructor!

Here, there is a myriad of event triggers that can be used. FirstInView, on DOMContentLoaded, on idleTime,
on setTimeout, on RAF.

The question is whether or not this should be moved into a mixin, or whether or not this should be done from outside.

> I think that it probably should be done from the outside.
a) We have the ability of adding a staticSetting for using triggers built into the mixin.
b) we can use functions from the mixin that puts them into different ques.
c) we can do it all manually from the outside.

> If c) manually, we can't harmonize for the user across browsers.
The best solution is then probably b) static functions..


## Set up 3: In advance 

You create your element. 
1. The setupMethod will be triggered by `connectedCallback` at the latest.
2. you have the `triggerSetupCallback(ms)` that will either add the element to a rAF que with the ms priority,
or you can trigger it immediately yourself using `triggerSetupCallback()` inside an event callback.

* if you use only `setupCallback`, you don't get the ability that the setupMethod will be triggered by `connectedCallback` at the latest.  

> the triggers for finding idle time, are similar for the in advance and not-yet. 
In advance can 


## Solution 1: sync `setupCallback()` (first `connectedCallback()`)

A simple alternative is to trigger `setup` tasks from `connectedCallback()`.
The problem with using `connectedCallback()` for `setup` tasks is that it can be called several times.
This might not seem all that relevant to begin with, but if you use a template manager such as 
lit-html, it caches and reuses elements that it connects and reconnects to the dom as needed. 
Therefore, if we use `connectedCallback()` to trigger our `setup` task, we must ensure that 
our `setup` task is *only* called the *first* time `connectedCallback()` is run.

In addition, our `connectedCallback()` might need access to attributes or other resources 
constructed in the `setup` task. We must therefore also ensure that our `setup` task is run *before*
any other `connectedCallback()` tasks.

To do so is simpler than it sounds. In fact, it can be achieved with a single line of code placed
at the very beginning of your custom elements `connectedCallback()`:
```javascript
this._wasConnected || ((this._wasConnected = true) && this.setupCallback());
```
This single line of code, when placed at the very beginning of `connectedCallback()`, 
will make sure that:
* a reactive callback method `setupCallback()`
* will be called *only once*
* immediately before other `connectedCallback()`tasks
* the first time the element is connected to the DOM.

## Example: GoBananas using first `connectedCallback()`
In this example, we create a custom element called `GoBananas` with a `setupCallback()` method.
`GoBananas` uses the `setupCallback()` to setup its default attribute values, and 
prints them to the console every time it is connected to the DOM.

```html
<script>
  class GoBananas extends HTMLElement {
  
    constructor(){
      super();
      this.mentalState = "bananas";                                                //[1]
    }
    
    setupCallback(){                                                               //[2]
      this.hasAttribute("go") || this.setAttribute("go", this.mentalState);        //[3]
    }
    
    connectedCallback(){
      this._wasConnected || ((this._wasConnected = true) && this.setupCallback()); //[4]
      //if (super.connectedCallback) super.connectedCallback();                    //[5]
      console.log("go " + this.getAttribute("go"));                                //[6]
    }
  }
  customElements.define("go-bananas", GoBananas);
</script>

<go-bananas id="one"></go-bananas>                                                <!--7 go bananas-->
<go-bananas id="two" go="crazy"></go-bananas>                                     <!--8 go crazy-->

<script>
  const body = document.querySelector("body");
  const one = document.querySelector("#one");
  setTimeout(()=> body.removeChild(one), 1000);                                    //   go bananas
  setTimeout(()=> body.appendChild(one), 2000);                                    //[9]
  setTimeout(()=> body.removeChild(one), 3000);                           
  setTimeout(()=> one.setAttribute("go", "insane"), 4000);                         //[10]
  setTimeout(()=> body.appendChild(one), 5000);                                    //   go insane
</script>
```                                                                   
1. In the `constructor()` a property `mentalState` is set to "bananas" by default.
2. The custom element adds a reactive callback method `setupCallback()` to itself.
3. When `setupCallback()` is triggered, it will check to see if the user of the custom element
has not already set the attribute in the template. 
If no attribute value is set, it will set the attribute to `"bananas"`.
4. At the *absolute beginning* of `connectedCallback()` a single line check and call to `setupCallback()` is added.
The first time `connectedCallback()` is called, `this._wasConnected` is `undefined`.
`this._wasConnected` is then immediately set to true, and `this.setupCallback()` is called.
The next time connectedCallback() runs, `this._wasConnected` is true and `||` check will return *before* 
`this.setupCallback()` is triggered again.
5. Place this line also *above* any call to `super.connectedCallback()`.
6. `connectedCallback()` prints the value of the `go` attribute to the screen.
7. A custom element `<go-bananas#one>` is created via the HTML parser,
*after* the custom element definition is registered. The custom element is immediately connected to the DOM.
As the `go`-attribute is not set on the element, it will therefore get the default value `"bananas"`.
As the custom element is connected to the DOM, it prints `go bananas`. 
8. `<go-bananas#two>` has a `go`-attribute set to `"crazy"`. It prints `go crazy`.
9. After a second, `<go-bananas#one>` is removed from the DOM.
After two seconds, the same `<go-bananas#one>` element is then readded to the DOM.
As `this._wasConnected` has been set to true on the element, `setupCallback()` is not triggered.
The rest of `connectedCallback()` is run as expected and prints `go bananas`.
10. The next time `<go-bananas#one>` is disconnected and then re-connected to the DOM, 
the `go` attribute is set to `"insane"`. Setup is not called now neither, and 
the `connectedCallback()` prints `go insane`.

## Solution 2: async `setupCallback()` (`requestAnimationFrame()`)

Another alternative trigger for `setupCallback()` is `requestAnimationFrame()`.
When the `constructor()` runs, we can que a callback to `setupCallback()` to be triggered 
before the next render. Like this:

```javascript
  constructor(){
    super();
    ...
    requestAnimationFrame(() => this.setupCallback());
  }
  
  setupCallback() {
    ...
  }
```
By placing `setupCallback()` in the `requestAnimationFrame` task que, 
we are exerting more control over when the `setupCallback()` task will be executed.
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
  constructor(){
    super();
    ...
    requestAnimationFrame(() => this.setupCallback());
  }
  
  setupCallback() {
    ...
    this.isSetup = true;
    if (this.isConnected) this.connectedCallback();
  }

  connectedCallback() {
    if (!this.isSetup) return;
    ...
  }
```

## Example: GoBananas using `requestAnimationCallback()`
In this example, we create the same custom element `GoBananas` and `setupCallback()` method.
The only difference here is that instead of triggering `setupCallback()` from the first 
`connectedCallback()`, we will essentially que both using `requestAnimationCallback()`.

```html
<script>
  class GoBananasRAF extends HTMLElement {
  
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
  customElements.define("go-bananas-raf", GoBananasRAF);
</script>

<go-bananas-raf id="one"></go-bananas-raf>                                                
<go-bananas-raf id="two" go="crazy"></go-bananas-raf>                                     

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

## Problem: Mixin Isolation 

To control the timing of `setupCallback()` has many benefits. 
And if we could store the 
The act of *aborting* `connectedCallback()` in lieu of `setupCallback()` by checking the elements 
`isSetup` state is problematic. 

There is no getting around the `if(!this.setup) return;` when making a mixin of this.
All the other complexity regarding `setupCallback` can be encapsulated in a mixin, but 
*not* `if(!this.setup) return;`. 
We can mask the value as a symbol with a getter, like this:
`get isSetup(){
  return this[isSetup];
}`
And, this becomes an extra dependency for the custom element.

But, we don't get away from the 

## References


<!--
Therefore, if your custom element needs to add or organize its attributes at creation-time, 
and you only have the `constructor()` and `.connectedCallback()` to choose from,
you must organize your elements every time the element is connected to the DOM.
But, an element can be connected and reconnected multiple times during its lifecycle.
And these times are likely to be performance sensitive, 
as elements can often be attached to the DOM as part of a bigger branch. 
Hence, it is less than ideal to do more work than strictly necessary at `connectedCallback()`.
So, If you only need to set up your attributes once, 
you would like to have a callback hook that is triggered sometime *after* the 
`constructor()` but *before* the `connectedCallback()`: `firstConnectedCallback()`.
-->