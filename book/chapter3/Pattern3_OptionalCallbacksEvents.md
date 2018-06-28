# Pattern: OptionalCallbacksEvents

## Problem: functional mixins caters to different elements

Sometimes an element must react to gestures performed upon itself.
For example a carousel must scroll left or right in reaction to horisontal swipes upon its body.
A functional mixin using EventRecording to trigger callbacks for `swipestart`, `swipe` and `swipeend` achieves this.

At other times an element must dispatch a custom event when certain gestures are performed on it.
For example a custom button needs to dispatch `longpress` events in addition to `click` events.
A functional mixin using EventRecording to dispatch a custom event `longpress` achieves this.

But, the element might only need `swipeStartCallback` and `swipeCallback`, and not `swipeEndCallback`.
Or it might only to dispatch custom events. 
Or it might need to do a little of both: dispatch custom events and trigger one or more callbacks.

When we write the functional mixin, these requirements might not be defined.
And the functional mixin might be used by many different custom elements with different needs.
To support a variety of usecases with as little code and performance overhead as possible,
mixins based on EventRecording needs optional callbacks and events.

## Solution: make callbacks and events optional

To implement optional callbacks, the functional mixin simply needs to verify that
the custom element implements the callback before triggering it:
if the callback method does not exist, the functional mixin does not try to invoke the method.
With this check, the reactive callback methods are optional to use.

The drawback of having optional reactive callback methods, 
is that the custom element will not be alerted if it implements 
costly functional mixins that it does not use.
So, remember to *remove functional mixins with optional callbacks when they are no longer in use*.

To implement optional events we use a boolean StaticSetting.

## Example: `LongpressMixin`

```javascript
function LongpressMixin (Base){
  return class LongpressMixin extends Base{
    
    static get longpressDuration() {
      return 1000;
    }
    
    // static get longpressEvent() {                                      //[3]
    //   return false;
    // }
    
    constructor(){
      super();
      this._downListener = (e) => this._down(e);
      this._upListener = (e) => this._up(e);
      this._downTime = undefined;
    }
    
    connectedCallback(){
      if (super.connectedCallback) super.connectedCallback();
      this.addEventListener("mousedown", this._downListener);
    }
    
    disconnectedCallback(){
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeEventListener("mousedown", this._downListener);
    }
    
    _down(e){
      this._downTime = e.timeStamp;
      this.addEventListener("mouseup", this._upListener);
    }
    
    _up(e){
      this.removeEventListener("mouseup", this._upListener);
      const duration = e.timeStamp -this._downTime;
      if (duration < this.constructor.longpressDuration)
        return;
      this.longpressCallback && this.longpressCallback(duration);         //[1]
      if (this.constructor.longpressEvent)                                //[2]
        this.dispatchEvent(new CustomEvent("longpress", {bubbles: true}));
    }
  }
}
```
1. Before we call the `this.longpressCallback(duration)` reactive callback method,
we check that it exists (ie. that the custom element has implemented such a method).
If it does not exist, no method will be called back.
2. Before the event is dispatched, we check the value of the static property `longpressEvent`.
3. When the value of a StaticSetting is false by default, 
no static property needs to be implemented in the mixin (as non-existing, undefined property is falsy).

`LongpressMixin` can now be used in other elements like this:
```html
<style>
  longpress-button-callback,
  longpress-button-event,
  longpress-button-callback-and-event{
    display: block;
    width: 200px;
    height: 50px;
    background: lightblue;
    border: 10px solid blue;
    margin: 10px;
    padding: 10px;
  }
</style>
<h1>Longpress demo: press each box more than 1000ms</h1>
<longpress-button-callback>Callback<br>yellow body</longpress-button-callback>
<longpress-button-event>Event<br>red border</longpress-button-event>
<longpress-button-callback-and-event>Event and Callback<br>green body and border</longpress-button-callback-and-event>

<script>
  class LongpressButtonCallback extends LongpressMixin(HTMLElement) {

    longpressCallback(duration){
      this.style.background = "yellow";
    }
  }

  class LongpressButtonEvent extends LongpressMixin(HTMLElement) {

    static get longpressEvent() {                                     //[3]
      return true;                  //this element will throw longpress events.
    }
  }

  class LongpressButtonCallbackAndEvent extends LongpressMixin(HTMLElement) {

    static get longpressEvent() {                                     //[3]
      return true;                  //this element will throw longpress events.
    }

    longpressCallback(duration){
      this.style.background = "green";
    }
  }

  customElements.define("longpress-button-callback", LongpressButtonCallback);
  customElements.define("longpress-button-event", LongpressButtonEvent);
  customElements.define("longpress-button-callback-and-event", LongpressButtonCallbackAndEvent);

  document
    .querySelector("longpress-button-event")
    .addEventListener("longpress", (e) => e.currentTarget.style.borderColor = "darkred");
  document
    .querySelector("longpress-button-callback-and-event")
    .addEventListener("longpress", (e) => e.currentTarget.style.borderColor = "darkgreen");
</script>
```

## Events only: Alternative solution or Anti-pattern? 
This behavior could be with custom events only:
the mixin would *always* and *only* dispatch the events, and 
the custom element would add event listeners to itself to react to the event.

The event based approach has the benefit of needing only one means of reaction in the mixin.
This makes the mixin simpler.
But. There are two drawbacks of this approach:
1. To trigger functions *via* the event system is less performant 
than triggering callback methods on the `this` object directly.
Many EventRecording mixins are performance sensitive as they react to high-frequence events 
such as `mousemove`, and therefore the ability to not respond via the event system is beneficial.
2. An EventRecording must often dispatch several events such as `swipestart`, `swipe`, and `swipeend`.
To efficiently listen to events means to 
a) create listener function objects in the `constructor()`,
b) add listener in `connectedCallback()`, and
c) remove listeners in `disconnectedCallback()` for *all such events*.
Managing these event listeners creates a lot of boilerplate in the custom element using the mixin.

## References
 * dunno