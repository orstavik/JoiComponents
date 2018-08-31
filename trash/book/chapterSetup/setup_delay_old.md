# Setup: Delay

> TLDR; Right now, there is no true mechanism to delay a custom element.
> 1. You can use `display: none` temporarily to delay layout and paint of certain DOM branches.
> 2. You can place 
Delay both `setupCallback()` and `connectedCallback()` of an element.
> 1. abort `connectedCallback()` in the custom element if `.isSetup` has not been performed.
> 2. Que an async call to `setupCallback()` to respond to an event or task que.
> 3. when the `setupCallback()` is run, also rerun `connectedCallback()` 
>    if the delayed element is added to the DOM.
> Add support for `delay-setup` as HTML attribute and support for the element 

With a punchline in `disconnectedCallback()` we control when to call `setupCallback()`.
Sure, this "second constructor" and its punchline implementation in `connectedCallback()` is somewhat dirty.
But, controlling the timing of `setupCallback()` in this manner also enables us to *delay* 
setup and the functionality in `connectedCallback()` itself.
 
Delaying setup and connected functionality can be used to defer non-critical elements 
(and their resources) during critical periods in favor of critical elements.
This pattern and solutions can even be applied in both JS and HTML, thus 
giving us a way to speed up a page's load time.

## Example: `<below-the-fold>`

```html
<div style="width: 100vw; height: 100vh;">
  You see me immediately
</div>
<script>
//definition of <below-the-fold>
</script>
<below-the-fold delay="idle">
  <div>You must scroll to see me</div>
</below-the-fold>
```
The first div on the page is "above the fold".
The div "above the fold" is shown immediately when the page is loaded, before scroll. 
This makes the first div "critical" for the user experience when the page loads. 

The first div fills the whole page, thus pushing the remaining content "below the fold".
The content "below the fold" will therefore not be shown immediately, before the user scrolls.
"below the fold" is therefore not critical for the immediate user experience when the page loads.

To assess whether or not an HTML element is critical or not at load time can be hard for the browser.
The `<below-the-fold>` element might for example be given a fixed position, thus 
putting it front and center in the immediate view and thus making it highly critical for the user experience.
Therefore, as developers, we would like to be able to either flag elements as critical or non-critical
to guide the browser to better its performance.

Other than placing elements higher up in the template, 
there is little we can do to make the browser prioritize an element at the expense of other elements.
Therefore, we need to look at solutions that can flag elements as non-critical and
postpone their construction, setup and connection to the DOM.
 
## Punchline: delay `connectedCallback()`

To postpone, delay or defer the construction, setup and connection to the DOM of an element,
requires solution that rests on a couple of premises.

1. What happens to the children of an element that has a shadowDOM, but 
   that does *not* have any `<slot>` elements in its `.shadowRoot`?
   Are these children elements connected to the DOM? Yes.
   Are these children elements visible? No. They are in effect in a state similar to `display: none`.
   
2. By setting a flag/property that the setup of an element has been delayed, and 
   then removing that flag later, and doing so as a punchline in `connectedCallback()`,
   both the setup and the connecting functionality of that element can be delayed.

This solution is not so bad. It makes for a couple of simple methods, and 
a pattern for invoking these methods in `connectedCallback()`.
The head of the implementation of connectedCallback() becomes a bit complex,
and to make an element delayable, you must add an attribute to the actual elements you want to delay,
but the complexity of delaying logic can more or less be hidden inside imported pure functions.

You basically import a function and put a double punchline in the head of your `connectedCallback()`:
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

`el.isSetup || return;`
 
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
    this.isSetup?1:(this.setupCallback(), this.isSetup = true);      //[2]
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

## Different timers: idle and DCL

Here, there is a myriad of event triggers that can be used. FirstInView, on DOMContentLoaded, on idleTime,
on setTimeout, on RAF.

## TODO: Setup 2: not-yet
Wrap this up not just as a punchline, but also as a custom element `<below-the-fold>`.

Have this element implement all the functions.

, but we wish to delay the element setup to allow for:
   * quicker rendering and/or 
   * prioritize user interaction or other tasks.
 
Delay the setup and connectedCallback of an element. This is a little more complex. 
Remember that the setup can only recursively delay the setup of shadowDOM children, 
not lightDOM child elements, thus the benefit of delaying setup is therefore limited.
But, if the constructor has set the shadowRoot, and the shadowRoot has no slot, 
then the constructor of the lightDOM children elements will run, but not(!) their connectedCallback(!!).
So this should in theory work ok as a means to hide other tasks in lightDOM elements as long as 
their code is triggered by connectedCallback and not constructor!

## Reference
 * MDN requestIdleCallback()
 * try to find documentation that it is smart to place the "preparation area" in the same document, 
 so as to avoid document adoptation.

