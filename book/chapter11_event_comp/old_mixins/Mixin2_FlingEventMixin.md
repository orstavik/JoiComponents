# FlingEventMixin: Want a swipe? Or maybe a drag fling? 

A `drag` event is a translation of a `pointermove` event:
1. when a `pointerdown` event,
2. followed by a series of `pointermove` events (ie. the `drag` events),
3. before the next `pointerup` event.

A `swipe` event occurs when a `drag` event that is:
1. going in X direction (angle), 
2. with XX "wiggle room" (+/- angle),
3. for the last Y duration (ms), and
4. at minimum Z px/ms over that duration.

A `fling` event occurs when a `dragend` event and the previous `drag` events has:
1. gone in X direction (angle), 
2. with XX "wiggle room" (+/- angle),
3. for the last Y duration (ms), and
4. at minimum Z px/ms over that duration.

## When to swipe? and when use drag + fling?

Often, when we say "swipe", we actually mean that we should listen for and handle 
a combination of a series of `drag` events and a `fling` event. 
The reason for this is that a `swipe` event will not be triggered until the minimum Y 
duration has passed, and such a delay is not very responsive.

Furthermore, it is often harder to halt and reverse a `swipe` than a `drag`. 
These issues all conspire to make the `swipe` event that 
at first glance appears simpler than `drag` event, turn out to often be more complex than `drag`
when you want a responsive app.

The conclusion is that most often you want to combine the `drag` and `fling` events 
rather than the `swipe` and `fling` events to perform functions such as scrolling. 
However, sometimes, you only want the `swipe` itself and you do want to trigger the `fling` early 
before the finger has left the screen. **`swipe` is a premature `fling`**.

## How to calculate the angle of a swipe or a fling?
The swipe and fling events contain a direction of the gesture given in degrees from 0 to 360:
* swipe up (north) = 0 degrees
* swipe right (east) = 90 degrees
* swipe down (south) = 180 degrees
* swipe left (west) = 270 degrees

This method is not added to the dragging event as it is likely not needed and require a little calculation.
To get the same direction for the drag event, do this:
```javascript
function vectorAngle(x, y) {
  return ((Math.atan2(y, -x) * 180 / Math.PI)+270)%360;
}

someElementWithFlingEvent.addEventListener("fling", (e)=>{
  console.log("the angle of the fling is: ", vectorAngle(e.detail.distX, e.detail.distY));
});
```

### Little need for "user-select: none"

The drag gesture described by these mixins are used by the browser to select text.
When drag as text selection is activated, 
it will interfere with any custom drag or fling event.
To enable custom drag behaviour, the default behavior of 
these builtin select events must be disabled.
This is done by preventDefault() on "selectstart" event, 
and this behavior should be added by default in drag, fling and swipe element or mixins.
Below is an example of how `preventDefault()` for `selectstart` event is managed:

```javascript
class AnyDragFlingSwipeElement extends HTMLElement {

  constructor() {
    super();
    this._selectListener = e => e.preventDefault();
    this._startListener = e => this._pointerdownMethod(e);
    //...
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    this.addEventListener("selectstart", this._selectListener);
    this.addEventListener("pointerdown", this._startListener);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) super.disconnectedCallback();
    this.removeEventListener("selectstart", this._selectListener);
    this.removeEventListener("pointerdown", this._startListener);
  }
  
  //...
}
```


#### References
* https://material.io/guidelines/patterns/gestures.html
* http://srufaculty.sru.edu/david.dailey/svg/angles.html      
* https://caniuse.com/#feat=selection-api 
* https://caniuse.com/#feat=user-select-none - (not supported by ie9 nor UC..)