# Pattern: ReactiveMethod

### Example: How to react to online/offline changes
This simple example component reacts every time the network status changes.
All the functionality that listens for the event is isolated in the 
`constructor()`, `connectedCallback()` and `disconnectCallback()`.
All the functionality that reacts to the event is added in the reactive 
callback method onlineOfflineCallback.

```javascript
class MyWebComponent extends HTMLElement {
                                               
  constructor(){
    super();
    this._onlineOfflineListener = e => this.onlineOfflineCallback(navigator.onLine);   //[1]
  }
  
  connectedCallback(){
    window.addEventListener("online", this._onlineOfflineListener);                    //[2]
    window.addEventListener("offline", this._onlineOfflineListener);                   //
    this.onlineOffline(navigator.onLine);                                              //[3]
  }
                                                            
  disconnectedCallback(){
    window.addEventListener("online", this._onlineOfflineListener);                    //[4]
    window.addEventListener("offline", this._onlineOfflineListener);                   //
  }

  onlineOfflineCallback(isOnline) {                                                    //[5]
    if(isOnline)                                                                       //
      console.log("Online! The world is your oyster.");                                //
    else                                                                               //
      console.log("Offline! Finally some piece of mind.");                             //
  }                                                                                    
}                                                                                      
customElements.define("my-web-component", MyWebComponent);
```    
1. Instantiate a listener function object (closure).
2. Connect the listener function to both the "online" and "offline" events.       
3. Call the function on startup to get situation at startup.
4. Disconnect the listener function when not needed.
5. React to changes in the reactive method.
            
Try it on [codepen.io](https://codepen.io/orstavik/pen/bvJjOd).

## The purpose of the pattern
This pattern enables a custom element to **react** to an event, observer or 
callback as **simply** and **efficiently** as possible.

**Simplicity** comes from:
* Separating the task of *listening for the event* from *reacting to the event*.
* Following the established pattern for callback methods on `HTMLElement`, which
* uses a flat structure (and thus avoids callback-hell).

**Efficiency** is preserved as the element only observes or listens for an event 
while it is connected to the DOM and caches the listening function used.
                                                               
### Practical guide to defining your own ReactiveMethods
1. The setup of a) listener and b) the reactive callback method form a pair.
2. The listener is initialized in the `constructor()`, activated in `connectedCallback()` and removed in `disconnectedCallback()`.
   * This pattern works equally well for event-based, observer-based and function-based callbacks.
3. The listener's job is to find out **when** a reaction is needed.
   * However, when the reaction needs to be *delayed*,
    debouncing or throttling the reaction are often best handled by the reactive method.
4. Parsing and computation of original event data during listening should be light and sparse. 
5. The listener calls the reactive callback method directly and pass it its own version of event data. 
6. All the logic as to **how** the element should react is organized within this reactive method.
7. Several ReactiveMethods can be set up in the same element at the same time. 
   * However, if an element has more than two or three ReactiveMethods, 
   you should probably split them out as [Functional Mixins](Pattern2_FunctionalMixin.md).

#### References
* https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
* https://html.spec.whatwg.org/multipage/custom-elements.html#enqueue-a-custom-element-callback-reaction