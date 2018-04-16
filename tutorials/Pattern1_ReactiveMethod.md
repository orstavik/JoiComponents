# Pattern 1: listener-to-reactive-method pairs
The purpose of this pattern is to enable a custom element to **react** to an event or callback
as **efficiently** and **simply** as possible.
For **efficiency**, the element must only observe or listen for an event while it is connected
to the DOM, and avoid instantiating new listening functions every time.
For **simplicity**, the element should:
* follow a recognizable pattern,
* try to achieve flat structure where possible (ie. avoid callback-hell), and
* isolate the functionality that "listens for the event" from the functionality that "reacts to the event".

### Example: Webcomponent that can respond to online/offline changes
This simple example component reacts every time the network status changes.
All the functionality that listens for the event is isolated in the constructor, connectedCallback and disconnectCallback.
All the functionality that reacts to the event is added in the reactive callback method onlineOfflineCallback.

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
                                                               
### Practical use of listener-to-reactive-method pairs in web components
1. The setup of listeners and reactive callback method form a pair.
It is the job of the listeners initialized and managed in the `constructor()`, `connectedCallback()` and `disconnectedCallback()` 
to find out **when** the action needs to be triggered. These listeners then trigger the 
reactive callback method and pass it the basic information about the event. 
All the logic as to **how** the element should react is organized from within this reactive method.
2. This pattern works equally well for event-based, observer-based and function-based callbacks.
3. Several such listener-to-reactive-method pairs can be set up at the same time. 
However, if there are more than two or three such pairs active at the same time, 
you might consider splitting them out as [Functional Mixins](Pattern2_FunctionalMixin.md).

#### References
* https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
* https://html.spec.whatwg.org/multipage/custom-elements.html#enqueue-a-custom-element-callback-reaction