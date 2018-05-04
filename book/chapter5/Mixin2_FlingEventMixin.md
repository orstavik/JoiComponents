# FlingEventMixin: Need a swipe? Or would you rather have a drag fling? 

## What is a swipe?
What precisely is a swipe gesture? To move your finger quickly across the screen?
But does it have to be unidirectional? Or can you swipe back and forth?
And what happens if you stop midway while swiping? Can you continue the swipe?
Or do you have to lift your finger from the screen and press it again to continue?
How long would you have to move your finger to initiate a swipe? And for how long? 
And what happens if you stop right before you lift your finger from the screen?
Does that imply that the whole swipe is reversed? Or did you just break it off short?
And what happens if you unintentionally touch the screen with a second finger?
Or maybe the user touched with two fingers intentionally?

The answer to all these questions are: I don't know. And you don't know. 
In fact, no one knows because it often varies. 
Maybe some time in the future people will come together to form a
firm consensus about what a swipe should mean. 
But right now, most people havn't decided.

But how can that be? I am swiping all the time on my phone! 
I swipe to refresh on Android. I swipe to initiate a new fling on Tinder. 
Heck, I even swipe to scroll!

Well, that is one way to view it. 
Another way to view it is that `swipe` is a *similar, but not identical enough* interpretion 
of two other events `drag` and `fling`. 
The interpretations are similar enough for us to refer to them all as "swiping" 
when we just talk about it.
But when we get into the nitty gritty details of implementing and handling a swipe,
there are so many unanswered questions that it is hard for us to 

A similar interpretation we often refer to as `swipe`.
Sure, you could 

## a drag? and a fling?
`FlingEventMixin` adds support for both dragging and flinging.

pinch, expand and rotate gestures to a custom element.
`PinchEventMixin` translates two-finger touch events into a series of pinch-events.

The `PinchEventMixin` is built using the [EventComposition](../chapter2/Pattern4_EventComposition.md) and 
[FunctionalMixin](../chapter2/Pattern2_FunctionalMixin.md) patterns. 
It translates a sequence of `touchstart`, `touchmove` and `touchend` events into a series of 
pinch events.

#### Events:
1. `pinchstart` is fired when two fingers first are *pressed on this element*.
The detail of the event is the `touchstart` event that triggered `pinchstart`.
2. `pinchmove` is fired when these same two fingers move.
The detail is:
   * distance        (since last `pinchmove`)
   * distanceStart   (since `pinchstart`)
   * rotation        (since last `pinchmove`)
   * rotationStart   (since `pinchstart`)
   * TODO: add distanceX and distanceY also, 
     so that for example scaling can be done 
     using separate x and y values 
3. `pinchend` is fired when one of the original fingers are lifted from the screen.
The detail of the event is the original touchend event.

#### Property:
* `.minPinchDistance = 10`: number - the minimum change of distance between fingers to trigger pinchmove (in pixels).
* `.minPinchRotation = 1` : number - the minimum change of rotation (in degrees).    

### Example of use:

```javascript
import {PinchEventMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/PinchEventMixin.js";

class PinchBlock extends PinchEventMixin(HTMLElement) { //[1]

  constructor(){
    super();
    this._onPinchListener = e => this._onPinch(e);      //[2]
  }

  connectedCallback(){
    super.connectedCallback();
    this.style.display = "block"; 
    this.style.position = "fixed"; 
    this.style.left = "100px";
    this.style.top = "100px";
    this.style.width = "300px";
    this.style.height = "300px";
    this.style.background = "red";
    this.addEventListener("pinch", this._onPinchListener);
  }
  
  disconnectedCallback(){
    this.removeEventListener("pinch", this._onPinchListener);    
  }
  
  _onPinch(e){
    this.style.transform =`rotate(-${e.detail.rotationStart}deg)`;
  }
}
customElements.define("pinch-block", PinchBlock);
```                                                                   
1. Adding the functional mixin `PinchEventMixin(HTMLElement)`. 
PinchBlock elements will now dispatch pinch events when pressed with two fingers.

[Test the example on codepen](https://codepen.io/orstavik/pen/rvBopM).

#### References
* https://material.io/guidelines/patterns/gestures.html
