## Pattern 1: listener-to-reactive-method pairs
The purpose of this pattern is to enable a custom element to **react** to an event or callback
as **efficiently** and **simply** as possible.
For **efficiency**, the element must only observe or listen for an event while it is connected
to the DOM, and avoid instantiating new listening functions every time.
For **simplicity**, the element should:
* follow a recognizable pattern,
* try to achieve flat structure where possible (ie. avoid callback-hell), and
* isolate the functionality that "listens for the event" from the functionality that "reacts to the event".

### Example: online/offline responsive Webcomponent
This simple example component reacts every time the network status changes.
All the functionality that listens for the event is isolated in the constructor, connectedCallback and disconnectCallback.
All the functionality that reacts to the event is added in the reactive callback method onlineOfflineCallback.

```javascript
class MyWebComponent extends HTMLElement {
                                               
  constructor(){
    super();
    this._onlineOfflineListener = e => this.onlineOfflineCallback(navigator.onLine);   //init
  }
  
  connectedCallback(){
    window.addEventListener("online", this._onlineOfflineListener);                    //connect
    window.addEventListener("offline", this._onlineOfflineListener);                   //
    this.onlineOffline(navigator.onLine);                                              //startup
  }
                                                            
  disconnectedCallback(){
    window.addEventListener("online", this._onlineOfflineListener);                    //disconnect
    window.addEventListener("offline", this._onlineOfflineListener);                   //
  }

  onlineOfflineCallback(isOnline) {                                                    //The reactive method
    if(isOnline)                                                                       //
      console.log("Online! The world is your oyster.");                                //
    else                                                                               //
      console.log("Offline! Finally some piece of mind.");                             //
  }                                                                                    //
}                                                                                      //
customElements.define("my-web-component", MyWebComponent);
```                                                                   
### Practical use of listener-to-reactive-method pairs in web components
1. The setup of listeners and reactive callback method form a pair.
It is the job of the listeners initialized and managed in the constructor() and (dis)connectedCallback() 
to find out **when** the action needs to be triggered. These listeners then trigger the 
reactive callback method and pass it the basic information about the event. 
All the logic as to **how** the element should react is organized from within this reactive method.
2. This pattern works equally well for event-based, observer-based and function-based callbacks.
3. Several such listener-to-reactive-method pairs can be set up at the same time. 
However, if there are more than two or three such pairs active at the same time, 
you might consider splitting them out as functional Mixins (see below).

## Pattern 2: Functional Mixins for listener-to-reactive-method pairs
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
You don't have to implement 


### Opinion 
It is my opinion that ONLY the **listener-to** part of the listener-to-reactive-method pair pattern
can and should be split out as a Functional Mixin. The main argument for this is that detecting 
**when** an external event occurs is likely **not** connected to any other functionality in your 
custom element. This makes it possible for the mixin to be fully agnostic as to what kind of 
HTMLElement it is applied to. If a custom element needs to combine the input of several 
different **listener-to** sources, it should do so itself directly.
                                                                                                 