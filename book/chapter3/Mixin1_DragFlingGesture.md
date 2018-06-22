# Mixin: DragFlingGesture
The purpose of `DragFlingGesture` is to add dragging and fling events and/or callbacks to an element.
The `DragFlingGesture` is built using the patterns:
1. [ReactiveMethod](../chapter2/Pattern1_ReactiveMethod.md)
2. [FunctionalMixin](../chapter2/Pattern2_FunctionalMixin.md)
3. [EventRecording](Pattern1_EventRecording.md)
4. [StaticSettings](../chapter2/Pattern_StaticSettings.md)

## Example: DraggingBlock

```javascript
import {DragFlingGesture} from "https://rawgit.com/orstavik/JoiComponents/master/src/DragFlingMixin.js";

class DraggingBlock extends DragFlingGesture(HTMLElement) {                   //[1]

  constructor(){
    super();
    this._onDraggingListener = e => this._onDragging(e);      
  }

  connectedCallback(){
    super.connectedCallback();
    this.style.display = "block"; 
    this.style.position = "fixed"; 
    this.style.left = "30px";                
    this.style.top = "30px";
    this.addEventListener("dragging", this._onDraggingListener);              //[2]
  }                                                                           
                                                                              
  disconnectedCallback(){                                                     
    this.removeEventListener("dragging", this._onDraggingListener);           //[2]   
  }
  
  _onDragging(e){
    this.style.left = (parseFloat(this.style.left) + e.detail.distX) + "px";  //[3]
    this.style.top = (parseFloat(this.style.top) + e.detail.distY) + "px";    //[3]
  }
}
customElements.define("dragging-block", DraggingBlock);
```                                                                   
1. Adding the functional mixin `DragFlingGesture(HTMLElement)`. 
DraggingBlock elements will now dispatch dragging events when dragged.
2. Adds the listener for `dragging` event when the element connects to the DOM.
Removes the listener for `dragging` event when the element disconnects.
3. Moves the element using `e.detail.distX` and `e.detail.distY` from the `dragging` event.

Test it out on [codepen](https://codepen.io/orstavik/pen/XEwPaE).

## Comments on implementation
1. `DragFlingGesture` does not use pointerevents. It could have. But it doesn't. 
This means that the PEP polyfill is not needed for this mixin.

## References
* [Lauke: getting touchy presentation](https://www.youtube.com/watch?v=jSL-RluQhMs)
* [Lauke: getting touchy on github](https://github.com/patrickhlauke/getting-touchy-presentation)
* https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
* https://github.com/jquery/PEP