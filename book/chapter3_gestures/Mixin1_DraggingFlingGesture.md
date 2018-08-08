# Mixin: `DraggingFling`

`DraggingFling` adds support for one-finger gesture for dragging on the screen, 
commonly used to move and/or scroll elements on the screen.
A `fling` callback/event is triggered if the finger is removed from the screen while in motion,
the dragging ends abruptly.
See also `spin` in [PinchSpin](Mixin3_PinchSpinGesture.md).
 
`DraggingFling` records a sequence of one-finger events 
(cf. [EventRecording](../chapter1b_HowToMakeMixins/Pattern1_EventRecording.md)):
 * `touchstart`/`mousedown`, 
 * `touchmove`/`mousemove`, 
 * `touchend`/`mouseup`, and 
 * `touchcancel`. 

And turns them into a series of *optional* callbacks 
(cf. [OptionalCallbacksEvents](../chapter1b_HowToMakeMixins/Pattern3_OptionalCallbacksEvents.md)):
 * `draggingstartCallback()`, 
 * `draggingCallback()`, 
 * `draggingendCallback()`, 
 * `draggingcancelCallback()`, 
 * and `flingCallback()`.
 
The `draggingstart`, `dragging`, `draggingend` timeline correspond to 
`touchstart`, `touchmove`, and `touchend/touchcancel`.

## Implementation details

The `DraggingFling` is built using the [EventRecording](../chapter1b_HowToMakeMixins/Pattern1_EventRecording.md) and 
[FunctionalMixin](../chapter1b_HowToMakeMixins/Pattern2_FunctionalMixin.md) patterns. 

The `DraggingFling` mixin only reacts when *one* finger/mousebutton is used.
If only an additional finger or mousebutton is pressed, 
the event recording is cancelled.

`fling` is triggered when the finger or mouse have moved more 
than a minimum `flingDistance`(px) for more than minimum `flingDuration`(ms).
Both `flingDistance` and `flingDuration` are implemented as [StaticSettings](../chapter1b_HowToMakeMixins/Pattern_StaticSettings.md).
The default value of `flingDistance` is `50`(px), and
the default value of `flingDuration` is `200`(ms).
`flingDistance` is calculated as the distance from the start and end position of
the finger/mouse, where the start position was the position of the finger/mouse at pinchend - `spinDuration`.

`DraggingFling` has the following *OptionalCallbacks* methods:
 - `draggingstartCallback({event, x, y})`
 - `draggingCallback({event, x, y, distX, distY, distDiag, durationMs})`
 - `draggingendCallback({event, x, y})`
 - `draggingcancelCallback({event})`
 - `flingCallback({event, x, y, distX, distY, distDiag, durationMs})`

`DraggingFling` has the following StaticSetting for an *OptionalEvent*:
 - draggingEvent: true => mixin will also dispatch the following events
    - draggingstart:  {event, x, y}
    - dragging:       {event, x, y, distX, distY, distDiag, durationMs}
    - draggingend:    {event, x, y}
    - fling:          {event, x, y, distX, distY, distDiag, durationMs}

The *OptionalCallback* methods' names and argument 
correspond exactly to the *OptionalEvent* name and detail. 

`DraggingFling` implement an extensive [InvadeAndRetreat!](Pattern4_InvadeAndRetreat.md) strategy 
to block default actions in the browsers such as "drag-to-scroll".

`DraggingFling` does not use pointerevents. It could have. 
But it doesn't in order to avoid to polyfill pointerevents in Safari.

## Example: DraggingBlock

```html
<style>
  dragging-block {
    display: block;
    position: fixed;
    top: 100px;
    left: 100px;
    width: 50px;
    height: 50px;
    background: orange;
  }
</style>

<dragging-block></dragging-block>

<script type="module">
  import {DraggingFling} from "https://rawgit.com/orstavik/JoiComponents/master/src/gestures/DraggingFling.js";
  
  class DraggingBlock extends DraggingFling(HTMLElement) {                   //[1]
  
    static get draggingEvent(){
      return true;
    }
    
    draggingCallback(detail){
      this.innerText = "x: " + detail.distX + ", y: " + detail.distY;  //[3] 
    }
  }
  customElements.define("dragging-block", DraggingBlock);

  const block = document.querySelector("dragging-block");
  block.addEventListener("dragging", (e) => {
    block.style.left = (parseFloat(block.style.left) + e.detail.distX) + "px";  //[3]
    block.style.top = (parseFloat(block.style.top) + e.detail.distY) + "px";    //[3]
  });

</script>
```                                                                   
todo add and writeup the numbers in the example.
1. Adding the functional mixin `DraggingFling(HTMLElement)`. 
DraggingBlock elements will now dispatch dragging events when dragged.
2. Adds the listener for `dragging` event when the element connects to the DOM.
Removes the listener for `dragging` event when the element disconnects.
3. Moves the element using `e.detail.distX` and `e.detail.distY` from the `dragging` event.

Test it out on [codepen](https://codepen.io/orstavik/pen/XEwPaE).

## References
* [Lauke: getting touchy presentation](https://www.youtube.com/watch?v=jSL-RluQhMs)
* [Lauke: getting touchy on github](https://github.com/patrickhlauke/getting-touchy-presentation)
* https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
* https://github.com/jquery/PEP