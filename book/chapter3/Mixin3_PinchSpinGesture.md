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
 See also `fling` in [DragFlingGesture](Mixin1_DraggingFlingGesture.md)).
 
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

`PinchGesture` implement an extensive [InvadeAndRetreat!](Pattern2_InvadeAndRetreat.md) strategy 
to block default actions in the browsers such as "pinch-to-zoom".

## Example: SpinningTop

```html
<style>
  spinning-top {
    border-radius: 60%;
    border-width: 20px;
    border-style: solid;
    border-bottom-color: red;
    border-top-color: green;
    border-left-color: yellow;
    border-right-color: blue;
    background-color: pink;
  }
</style>

<spinning-top></spinning-top>

<script type="module">
  import {PinchGesture} from "./PinchSpin.js";
  
  class SpinningTop extends PinchGesture(HTMLElement) { //[1]
  
    static get pinchEvent(){
      return true;
    }
  
    pinchCallback(detail){
      this.innerText =`rotate: -${detail.angle}deg`;
    }
    
    spinCallback(detail){
      this.innerText ="spin: " + JSON.stringify(detail);      
    }
  }
  customElements.define("spinning-top", SpinningTop);
  
  const spinner = document.querySelector("spinning-top");
  spinner.addEventListener("pinch", () => spinner.style.transform = `rotate(${angle}deg)`);
  spinner.addEventListener("spin", () => {
    spinner.style.transitionDuration = `5s`;
    spinner.style.transform = `rotate(${angle}deg)`;
  });
</script>
```

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
* todo, find reference that browsers does not have any default actions for two finger gestures.