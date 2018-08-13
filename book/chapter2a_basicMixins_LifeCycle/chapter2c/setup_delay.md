# Setup: Delay

> TLDR: delay both `setupCallback()` and `connectedCallback()` of an element.
> 1. abort `connectedCallback()` in the custom element if `.isSetup` has not been performed.
> 2. Que an async call to `setupCallback()` to respond to an event or task que.
> 3. when the `setupCallback()` is run, also rerun `connectedCallback()` 
>    if the delayed element is added to the DOM.
> Add support for `delay-setup` as HTML attribute and support for the element 

## Example: AboveBelowTheFold

```html
<style>
  above-the-fold {
    background: green;
    width: 100vw;
    height: 100vh;
  }
  below-the-fold {
    background: red;
    width: 100vw;
    height: 100vh;
  }
</style>

<above-the-fold>
  <div>You see me immediately</div>
</above-the-fold>

<below-the-fold>
  <div>You must scroll to see me</div>
</below-the-fold>

<script>
const btf = document.createElement("below-the-fold");
btf.innerHTML ="<div>you must scroll to see me too</div>";
//btf.delaySetupUntil("idle");
btf.setAttribute("delay-setup", "idle");
//btf.setupCallback();
document.appendChild(btf);    //triggers connectedCallback, which is aborted as the element is delayed
</script>
```

The first div on the page is "above the fold", shown immediately when the page is loaded. 
The second div is below the fold, and to see it, one must scroll.
 
## Solution 1: pure functions

This solution is not so bad. It makes for a couple of simple methods, and 
a pattern for invoking these methods in setupCallback().
The head of the implementation of connectedCallback() becomes a bit complex,
and to make an element delayable, you must add an attribute to the actual elements you want to delay,
but the complexity of delaying logic can more or less be hidden inside imported pure functions.

You basically import a function and put 2 lines of code in the head of your `connectedCallback()`:
```
import {delaySetupIdle} from "https://rawgit.com/orstavik/joicomponents/src/DelayedSetup.js";
...

connectedCallback(){
  if (delaySetupIdle(this)) return;                            //[1] check the delaySetup func
  this.isSetup || (this.setupCallback(), this.isSetup = true); //[2] the immediate setup
  super.connectedCallback && super.connectedCallback();        //[3] function mixin requirement
  ...
}
```
The whole code looks like this:
 
```javascript
function reinvokeSetup(el){
  el.isDelayed = false;
  if (el.isConnected) 
    return el.connectedCallback();
  el.isSetup || (el.setupCallback(), el.isSetup = true);  
}
                                                                                   
//returns true if the element is delayed
export function delaySetupIdle(el){
  if (el.isSetup)
    return false;
  if (el.isDelayed !== undefined)
    return el.isDelayed;
  el.isDelayed = el.hasAttribute("delay-setup-idle");
  if (el.isDelayed)
    requestIdleCallback(()=> reinvokeSetup(el));
  return el.isDelayed;
}

class MyEl extends HTMLElement{
                                                                                        
  connectedCallback(){
    if (delaySetupIdle(this)) return;                                 //[1]
    this.isSetup || (this.setupCallback(), this.isSetup = true);      //[2]
    super.connectedCallback && super.connectedCallback(); //if you need, do super.connectedCallback here
    //do your element connected stuff here
  }
  
  setupCallback(){
    //do your element setup stuff here
  }
}
```

## Anti-pattern: DelayableSetupMixin
To delay setup as a mixin is a bad solution.
As super.connectedCallback() cannot abort the execution of connectedCallback(),
to achieve such behavior, DelayableSetupMixin.connectedCallback() must throw an Error.
This Error must must in turn be caught and processed by the connectedCallback implementing 
custom element.
This produces more code and a more convoluted and complex process, as can be seen in the example below.

```javascript
//returns true if the element is delayed
function delaySetupIdle(el){
  if (el.isSetup)
    return false;
  if (el.isDelayed !== undefined)
    return el.isDelayed;
  el.isDelayed = el.hasAttribute("delay-setup-idle");
  if (el.isDelayed)
    requestIdleCallback(()=> reinvokeSetup(el));
  return el.isDelayed;
}


export function DelayableSetupMixin(Base){
  return class DelayableSetupMixin extends Base {
    connectedCallback(){
      if (delaySetupIdle(this)) throw new Error("setup is delayed");
      this.isSetup || (this.setupCallback(), this.isSetup = true);
      super.connectedCallback && super.connectedCallback(); //if you need, do super.connectedCallback here
    }
    
    triggerDelayedSetupCallback(){
      this.isDelayed = false;
      if (this.isConnected) 
        return this.connectedCallback();
      this.isSetup || (this.setupCallback(), this.isSetup = true);  
    }
  }
};

class MyEl extends DelayableSetupMixin(HTMLElement){
                                                                                        
  connectedCallback(){
    try{                                                     //ugly starts
      super.connectedCallback && super.connectedCallback();
    } catch(err){
      if(err.message === "setup is delayed")
        return;
      throw err;
    }                                                        //ugly ends
    //do your element connected stuff here
  }
  
  setupCallback(){
    //do your element setup stuff here
  }
}
```


## Reference
 * MDN requestIdleCallback()
 * try to find documentation that it is smart to place the "preparation area" in the same document, 
 so as to avoid document adoptation.

