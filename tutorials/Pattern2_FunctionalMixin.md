# Pattern 2: Functional Mixins for listener-to-reactive-method pairs
Sometimes, the task of finding out **when** the reactive method should be triggered is not trivial.
This can be caused by several reasons:
* different browsers might implement different API that the element needs to harmonize/polyfill,
* information can be spread over several sources and require processing, 
thus filling the component with trivia that obfuscates the rest of the element logic, and/or
* the task of listening for the trigger can be made more efficient if it is 
coordinated for all the components, for example in a shared xObserver instance.

If the "listener-to" part of the pattern balloons, then you likely want to split this functionality out as a
separate functional mixins to isolate this aspect of your code to keep things simpler and facilitate unit-testing.

### Example 
In this example, we will convert the onlineOfflineCallback example above into a functional mixin.
This example is so simple, that it is likely that most developers would prefer not to split this 
code out as a separate listener. But, to explain the pattern, this "too simple" example is well suited.
```javascript
const OnlineOfflineMixin = function(Base) {
  return class extends Base {                                                  //listening management
      constructor(){
        super();
        this._onlineOfflineListener = e => this.onlineOfflineCallback(navigator.onLine);   
      }
      
      connectedCallback(){
        if (super.connectedCallback) super.connectedCallback();           //[1]
        window.addEventListener("online", this._onlineOfflineListener);   
        window.addEventListener("offline", this._onlineOfflineListener);  
        this.onlineOffline(navigator.onLine);                             
      }
                                                                
      disconnectedCallback(){
        if (super.connectedCallback) super.connectedCallback();           //[1]
        window.addEventListener("online", this._onlineOfflineListener);                   
        window.addEventListener("offline", this._onlineOfflineListener);                  
      }                                                                                                                                                                               
      //onlineOfflineCallback(isOnline) {
      //  don't implement this here                                       //[2]
      //} 
      
    }                                                                                     
};

class MyWebComponent extends OnlineOfflineMixin(HTMLElement) {
                                               
  connectedCallback(){                   
    super.connectedCallback();                                            //[3]      
    //do your stuff here
  }
                                                            
  disconnectedCallback(){                                                 //[3]
    super.disconnectedCallback();        //don't forget this
    //do your stuff here
  }
                                        
  onlineOfflineCallback(isOnline) {                                            //The reactive method
    if(isOnline)                                                                       
      console.log("Online! The world is your oyster.");                                
    else                                                                               
      console.log("Offline! Finally some piece of mind.");                             
  }                                                                                    
}                                                                                      
customElements.define("my-web-component", MyWebComponent);
```                                                                   
1. When you are using a functional mixin pattern on the `HTMLElement`, 
you might want to mix your mixins with other functional mixins.
These other mixins are almost always going to implement not only a `constructor`, 
but also their own `connectedCallback()` and `disconnectedCallback()`.
By calling any parent `connectedCallback()` and `disconnectedCallback()` before you run your code,
your functional mixin will be able to work together with other functional mixins.
ATT!! In the functional mixin, you must also check to see `if(super.connectedCallback)` and 
`if(disconnectedCallback)` exists before you call it. The reason is that `HTMLElement` doesn't have 
this method, and if your mixin is either at the core of the functional mixin cluster or
is used on its own, a direct call to a non-existing super.connectedCallback would throw an `Error`.
2. It is better not to implement `onlineOfflineCallback()`. The reason for this is that
if you use this functional mixin but then forget to implement the corresponding callback method in your
custom element class, then your code will throw an Error the first time the callback triggers.
This will likely help you remove functional mixins that you don't use anymore from your custom elements,
and this is very beneficial as listening for the callback triggers is likely to be a heavy task for the
browser to perform.
3. When you are using a functional mixin that uses `connectedCallback` and `disconnectedCallback`,
**you must remember to call `super.connectedCallback` and `super.disconnectedCallback`**. If you forget this,
the functional mixin will not be able to manage its listening task. This mirrors the behavior you do when
calling `constructor() { super(); ...` first when extending another class. 

### Opinion 
It is my opinion that ONLY the **listener-to** part of the listener-to-reactive-method pair pattern
can and should be split out as a Functional Mixin. The main argument for this is that detecting 
**when** an external event occurs is likely **not** connected to any other functionality in your 
custom element. This makes it possible for the mixin to be fully agnostic as to what kind of 
`HTMLElement` it is applied to. If a custom element needs to combine the input of several 
different **listener-to** sources, it should do so itself directly.                                                                                                 