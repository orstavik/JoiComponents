# PinchGesture
`PinchGesture` adds support for pinch, expand and rotate gestures to a custom element.
`PinchGesture` translates two-finger touch events into a series of pinch-events.

The `PinchGesture` is built using the [EventComposition](../chapter2/Pattern4_EventComposition.md) and 
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
   * TODO: add distX and distY also, 
     so that for example scaling can be done 
     using separate x and y values 
3. `pinchend` is fired when one of the original fingers are lifted from the screen.
The detail of the event is the original touchend event.

#### Property:
* `.minPinchDistance = 10`: number - the minimum change of distance between fingers to trigger pinchmove (in pixels).
* `.minPinchRotation = 1` : number - the minimum change of rotation (in degrees).    

### Example of use:

```javascript
import {PinchGesture} from "https://rawgit.com/orstavik/JoiComponents/master/src/gestures/Pinch.js";

class PinchBlock extends PinchGesture(HTMLElement) { //[1]

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
1. Adding the functional mixin `PinchGesture(HTMLElement)`. 
PinchBlock elements will now dispatch pinch events when pressed with two fingers.

[Test the example on codepen](https://codepen.io/orstavik/pen/rvBopM).

#### References
* zingTouch
