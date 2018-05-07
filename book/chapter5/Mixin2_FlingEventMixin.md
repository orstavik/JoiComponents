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
TODO add how to calculate the angle of a drag moveflingAngle as a part of a demo and a the documentation
```javascript
import {flingAngle} from "todo";

// then use flingAngle to calculate the angle of a vector
// 
```




#### References
* https://material.io/guidelines/patterns/gestures.html
* http://srufaculty.sru.edu/david.dailey/svg/angles.html

