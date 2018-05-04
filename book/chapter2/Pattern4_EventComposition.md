# Pattern: EventComposition

EventComposition is a pattern for transforming a series of events into a series of other (custom) events.
Examples of EventCompositions are:
* **gestures**, such as swipe and pinch,  
* **drag**, and 
* **click** and **doubleclick**.

When creating an EventComposition you listen, most likely in a sequential order, 
to a series of underlying events.
When the events come in a certain pattern described by a) time, b) sequence, and/or c) value 
(such as position of fingers in gestures), then the EventComposition is detected and a new
composed event is dispatched.

EventComposition is a variant of the ReactiveMethod pattern, but 
instead of treating the reactive method as an external endpoint, 
it treats the reactive method as internal processing (a middle step) 
that produces an event (the end result) for external consumption. 
Where the ReactiveMethod pattern only *listen-then-react*, 
the EventComposition *listen-then-process-then-dispatch*.

### Example: tripple-click-element

```javascript
class TrippleClickElement extends HTMLElement {

  constructor(){
    super();                               
    this._clickListener = (e) => this._onClickListener(e);    //[1]
    this._twoClick = this._oneClick = -1000;                  //
  }

  connectedCallback(){  
    this.addEventListener("click", this._clickListener);      //[2]
  }

  disconnectedCallback(){
    this.removeEventListener("click", this._clickListener);   //[2]
  }                                                            

  _onClickListener(e) {
    //e.stopPropagation();                                    //[3i]
    //e.preventDefault();                                     //
    if ((e.timeStamp - this._twoClick) < 600) {               //[3ii]
      this._twoClick = 0;
      this._oneClick = 0;
      this.dispatchEvent(new CustomEvent("tripple-click", {composed: true, bubbles: true}));
    } else {
      this._twoClick = this._oneClick;                        
      this._oneClick = e.timeStamp;
    }
  }
}

customElements.define("tripple-click-element", TrippleClickElement);
```
1. The TrippleClickElement instantiates its listener and 
the custom properties it needs when observing the "click".
2. On connectedCallback() and disconnectedCallback() the TrippleClickElement
adds and removes the listener for the underlying events.
3. Process the underlying events. Use internal properties to manage the components state.
    1. Do not stop propagation nor prevent default behavior unless you need it.
    2. When the conditions for the custom event are met, dispatch it.

#### How to use tripple-click-element
```html
<tripple-click-element>
  3 clicks for good luck!
</tripple-click-element>                                                    
```

```javascript
function logTrippleClicks(e){  
  console.log(e.type, " from: ", e.target.localName, " at: ", e.timeStamp);
}                     
const clickMe = document.querySelector("tripple-click-element");
clickMe.addEventListener("tripple-click", e =>logTrippleClicks(e));    
setTimeout(()=> {
  clickMe.click();                     
  clickMe.click();
  clickMe.click();    
  //tripple-click from: tripple-click-element at: 123456789
}, 1000);
//remove the listener when it is no longer necessary.
//clickMe.removeEventListener("tripple-click", logTrippleClicks);  
```

[TrippleClickElement on codepen.io](https://codepen.io/orstavik/pen/GxaxbL).

## Discussion of the EventComposition pattern
At first sight the pattern seem overly complex and heavy handed. 
Why do we need to create a special custom component to achieve something 
as simple as just translating 3 clicks to a tripple-click? In addition,
there are several apparent limitations to this approach:
1. Creating a custom element prevents the "tripple-click" to be applied to other existing components 
such as regular HTML elements or third party elements. To achieve this effect, a different pattern 
and implementation of the same logic must be applied.
2. Attaching this functionality to the type does not enable the developer to selectively choose to
listen for tripple-click on some elements, while not on others of the same type. This can however be 
fixed by adding the following function to the TrippleClickElement class:
```javascript
trippleClick(onOff = true) {
  if (onOff)
    this.addEventListener("click", this._clickListener);
  else
    this.removeEventListener("click", this._clickListener);
}
```

The main reasons for using such a pattern and creating custom elements when you need to translate events,
is that the custom elements connectedCallback and disconnectedCallback provides a simple and safe way to
manage the listeners for the underlying events.

In addition, some event translation require:
1. the administration of several event listeners due to sequential app logic,
2. the administration of several event listeners due to browser differences (polyfillish),
3. the management of several state properties,
4. complex processing of the event data coming in and/or going out, and/or
5. extensive testing.

If so, apply the EventComposition pattern as a [FunctionalMixin](Pattern2_FunctionalMixin.md).

## Conflict between different ComposedEvents
As long as the composed event neither alters the original event nor stops its propagation, 
instances of the EventComposition pattern themselves should not cause any conflict. 

However, the handling of different ComposedEvents might interrupt each others functioning.
If you on a button bind two the two composed events a) `tripple-click` to an alert function
and b) `doubleclick` to a function that deletes the button itself, then `tripple-click` will be 
hard to trigger and your ComposedEvents conflict with one another. Such conflicts should be handled
by the user of the ComposedEvents, and not the custom element that issues them.

## Conflict between ComposedEvent gestures and some browsers/OSes

* double-tap to zoom: because some browsers and touch devices provide an underlying response by 
the browsers to zoom when doubletap'ed, then the browsers must wait 350ms after a click has been made to 
verify that the user's click was not the first part of a double-tap meant to zoom. To avoid such delay,
the css `touch-action` attribute can be added.

* multi-touch gestures such as four finger swipes.

## App-specific custom events vs EventCompositions for generic events.

There are several reasons why you might need your own events. Sometimes, you want to diferentiate your 
app logic events from generic events. This might be the user hitting a login button, and instead of 
having this event just named "click", you capture the click event and throw it again as a "login-click"
or something else. This enables you to avoid handling the event in middle layer, and just let it propagate 
all the way to the top. This is app-specific events.

A more generic use-case would be to translate a series of other events that no browser, or only a few browsers,
support into a dependable event. [DraggingEventMixin](../chapter5/Mixin3_DraggingEventMixin.md) is a good example of such an
event. Establishing such generic use-case FunctionalEvent patterns or mixins should most likely be 
setup as FunctionalMixins.

### Implementation comments
Avoid too much calculation and process that cost time. 
Events being processed like this will potentially be quite taxing for the browser.
* Delay processing until it is truly necessary
* Do not add edge-case processing into the Mixin, but instead add static methods that the 
use components can apply themselves on the data when they need to. 