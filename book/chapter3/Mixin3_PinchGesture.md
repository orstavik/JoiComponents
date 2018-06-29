# Mixin: `PinchGesture`

`PinchGesture` adds support for for two finger gestures such as:
 - pinch (used to for example zoom-out or shrink)
 - expand (used to for example zoom-in or grow)
 - rotate (used to... rotate)
 - two-finger-drag (used to move a subselection of a page, 
 when single-finger-drag is used to navigate the page as a whole)
 - spin (used to trigger animations)
 (The `spin` callback/event is triggered if two fingers are removed from the screen while in motion/
 the pinch ends abruptly.
 See also `fling` in [DragFlingGesture](Mixin1_DragFlingGesture.md)).
 
`PinchGesture` records a sequence of two-finger events 
(cf. [EventRecording](Pattern1_EventRecording.md)):
 * `touchstart`, 
 * `touchmove`, 
 * `touchend`, and 
 * `touchcancel`. 

And turns them into a series of *optional* callbacks 
(cf. [OptionalCallbacksEvents](Pattern3_OptionalCallbacksEvents.md)):
 * `pinchstartCallback()`, 
 * `pinchCallback()`, 
 * `pinchendCallback()`, 
 * and `spinCallback()`.
 
The `pinchstart`, `pinch`, `pinchend` timeline correspond to 
`touchstart`, `touchmove`, and `touchend/touchcancel`.

## Implementation details

The `PinchGesture` is built using the [EventRecording](Pattern1_EventRecording.md) and 
[FunctionalMixin](../chapter2/Pattern2_FunctionalMixin.md) patterns. 

The `PinchGesture` mixin only reacts when *two* fingers are used.
If only one finger is touching the screen, the `PinchGesture` remains inactive.
If a third finger touches the screen while the `PinchGesture` is recording, 
or if one of two fingers is removed from the screen while the `PinchGesture` is recording,
the event recording is cancelled.

`spin` is triggered when one or both fingers have moved more 
than a minimum `spinMotion`(px) for more than minimum `spinDuration`(ms).
Both `spinMotion` and `spinDuration` are implemented as [StaticSettings](../chapter2/Pattern_StaticSettings.md).
The default value of `spinMotion` is `50`(px), and
the default value of `spinDuration` is `50`(ms).
`spinMotion` is calculated as the sum of the distance of the start and end positions of
finger 1 and 2, where start position was the position of finger 1 and 2 at pinchend - `spinDuration`.

`PinchGesture` has the following *OptionalCallbacks* methods:
 - `pinchstartCallback({touchevent, x1, y1, x2, y2, diagonal, width, height, angle})`
 - `pinchCallback({touchevent, x1, y1, x2, y2, diagonal, width, height, angle})`
 - `pinchendCallback({touchevent})`
 - `spinCallback({touchevent, diagonal, width, height, angle, duration})`

`PinchGesture` has the following StaticSetting for an *OptionalEvent*:
 - pinchEvent: true => mixin will also dispatch the following events
    - pinchstart:  {touchevent, x1, y1, x2, y2, diagonal, width, height, angle}
    - pinch:       {touchevent, x1, y1, x2, y2, diagonal, width, height, angle}
    - pinchend:    {touchevent}
    - spin:        {touchevent, diagonal, width, height, angle, duration}

The *OptionalCallback* methods' names and argument 
correspond exactly to the *OptionalEvent* name and detail. 

`PinchGesture` does not need to implement an extensive InvadeAndRetreat strategy as 
browsers do not attribute any default actions to two-finger gestures (todo, find reference).

## Events:
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

## Example: RotateBlock

```javascript
import {PinchGesture} from "./PinchSpin.js";

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

## Speed calculations
Speed can be calculated as (can be applied to width, height, diagonal, angle):
```javascript
function speed(nowLength, thenLength, now, then) {
  return (nowLength - thenLength) / (now - then);
}
```

[Test the example on codepen](https://codepen.io/orstavik/pen/rvBopM).

#### References
* zingTouch
