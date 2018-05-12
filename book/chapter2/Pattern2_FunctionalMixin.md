# Pattern: IsolatedFunctionalMixins for HTMLElement
Often, the task of finding out **when** the reactive method should be triggered is not trivial:
* Different browsers might implement different API that the element must harmonize/polyfill.
* Information can be spread over several sources and require processing. 
This fills the component with trivial code that obfuscates the rest of the element logic.
* The task of listening for the external trigger event can be made more efficient if it is 
coordinated for all the components of this type (such as in 
[ChildrenChangedMixin](Mixin1_ChildrenChangedMixin.md) and [SizeChangedMixin](Mixin2_SizeChangedMixin.md)).

If the "listen-to" functionality of a ReactiveMethod balloons, 
then you likely want to split this functionality out as a separate functional mixin. 
This will help you encapsulate and isolate this aspect of your code which will keep 
your component simpler and facilitate unit-testing.

### Example 
In this example, we will convert the [`.onlineOfflineCallback(isOnline)`](Pattern1_ReactiveMethod.md)
example from the previous chapter into a functional mixin.

```javascript
const OnlineOfflineMixin = function(Base) {                              //[0] listening
  return class extends Base {                                                  
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
      //  don't implement this in ReactiveMethod,                         //[2]
      //  but implement this for EventComposition                         //[2]
      //} 
      
    }                                                                                     
};

class MyWebComponent extends OnlineOfflineMixin(HTMLElement) {            //[0] reaction
                                               
  connectedCallback(){                                                    //[3]
    super.connectedCallback();                                            //don't forget this      
    //do your stuff here                                                  
  }
                                                            
  disconnectedCallback(){                                                 //[3]
    super.disconnectedCallback();                                         //don't forget this
    //do your stuff here
  }
                                        
  onlineOfflineCallback(isOnline) {                                       //[0] The reactive method
    if(isOnline)                                                                       
      console.log("Online! The world is your oyster.");                                
    else                                                                               
      console.log("Offline! Finally some piece of mind.");                             
  }                                                                                    
}                                                                                      
customElements.define("my-web-component", MyWebComponent);
``` 
0. When setting up an IsolatedFunctionalMixin, the code of the ReactiveMethod is split into two parts:
* a functional mixin responsible for listening for the external event, and
* a web component applying this mixin to its HTMLElement superclass that 
controls the reaction of the external event.
                                                                  
1. When you are using a functional mixin pattern on the `HTMLElement`, 
you often want to use many mixins at the same time.
These other mixins are almost always going to implement not only a `constructor`, 
but also their own `connectedCallback()` and `disconnectedCallback()`.
By calling any parent `connectedCallback()` and `disconnectedCallback()`,
your functional mixin will be able to work together with other functional mixins on HTMLElement.
But. HTMLElement itself *does not* implement `connectedCallback()` and `disconnectedCallback()`.
Therefore, you must first check `if(super.connectedCallback)` and `if(disconnectedCallback)` exists 
before calling them.

2. If you are making an IsolatedFunctionalMixin for a ReactiveMethod,
you most often should not implement `.onlineOfflineCallback(isOnline)` in the mixin function.
If you add this mixin to your class, but then forget or later stop using the callback method,
the event will trigger an Error the first time the underlying event is triggered. 
This will remind you to either implement the callback or remove the mixin 
(which probably perform some not trivial observations that should be considered too costly to just
be left lying around).
However, if you use the IsolatedFunctionalMixin pattern for EventComposition as described in the
next chapter, you will of course implement an equivalent of this method in the mixin.

3. When you are using a functional mixin that uses `connectedCallback` and `disconnectedCallback`,
**you must remember to call `super.connectedCallback` and `super.disconnectedCallback`** in the component itself. 
If you forget this, you will not get an Error, but the functional mixin will not be activated or deactivated.
This closely resemble the compulsory call to `super()` in the `constructor()` of any class that extends another class. 

Further description of [how the `Base` of the mixins in this book are constrained](Discussion_IsolatedFunctionalMixin.md).