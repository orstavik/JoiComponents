# DraggingEventMixin
The purpose of `DraggingEventMixin` is to add a dragging event for an event.
The `DraggingEventMixin` is built using the [EventTranslator](Pattern4_EventTranslator.md) and 
[FunctionalMixin](Pattern2_FunctionalMixin.md) patterns.
The `DraggingEventMixin` **depends on pointerevents**.

Todo: must add dragging-start and dragging-stop.

### Example of use:

```javascript
import {DraggingEventMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/DraggingEventMixin.js";

class DraggingBlock extends DraggingEventMixin(HTMLElement) { //[1]

  constructor(){
    super();
    this._onDraggingListener = e => this._onDragging(e);      //[2]
  }

  connectedCallback(){
    super.connectedCallback();
    this.style.display = "block"; 
    this.style.position = "fixed"; 
    this.style.left = "30px";                
    this.style.top = "30px";
    this.addEventListener("dragging", this._onDraggingListener);
  }
  
  disconnectedCallback(){
    this.removeEventListener("dragging", this._onDraggingListener);    
  }
  
  _onDragging(e){
    this.style.left = (parseFloat(this.style.left) + e.detail.moveX) + "px";
    this.style.top = (parseFloat(this.style.top) + e.detail.moveY) + "px";
  }
}
customElements.define("dragging-block", DraggingBlock);
```                                                                   
1. Adding the functional mixin `DraggingEventMixin(HTMLElement)`. 
DraggingBlock elements will now dispatch dragging events when dragged.
2. `sizeChangedCallback({width, height})` is called every time the contentRectangle's width or height 
changes, while the element is connected to the DOM.
3. `sizeChangedCallback()` *is not* triggered here since `el` is not connected to DOM.
4. `sizeChangedCallback()` *gets* triggered here as `el` gets connected to DOM.
5. Because `sizeChangedCallback()` is only observed during "requestAnimationFrame-time" or during "ResizeObserver-time" 
and once per frame per element, to trigger a second callback, 
we must delay the trigger until a later point (here using `setTimeout(..., 100)`).

Test it out on [codepen](https://codepen.io/orstavik/pen/XEwPaE).

#### References
* https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
* https://github.com/jquery/PEP