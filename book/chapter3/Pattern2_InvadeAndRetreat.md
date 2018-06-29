# Pattern: InvadeAndRetreat

InvadeAndRetreat! is a strategy to resolve conflict. It consists of the following steps:

1. Find the **conflict trigger**. Find out *exactly* where and when the conflict first occurs.
2. Clarify the **conflict border**. Find all instances of a) what you might need and b) 
what the other parties might do that might conflict with your needs.
3. **Listen** for the conflict trigger, like a spider in a web.
4. **Invade**. WHAM! Once the trigger is set off, you strike fast and hard! 
And you Invade *at once* and *fully* on two fronts:
   1. **grab** all the access to only the properties that you need, and
   2. **block** all the access to these properties for the other parties.
5. **Do your thing**. With the access, complete your order of business.
Try to avoid to rape, pillage and loot.
6. **Retreat**. Immediately after you have done what you need, you do a full Retreat.
   1. Unleash all the accesspoints you grabbed during the invasion. 
   2. Unblock all the other parties access points. 
   3. Go back to listening position. And try to act as normal as you can.

Be warned! To put out only a small listener, and then once something touches it 
completely explode, grab everything, and block everything, for then ten seconds later, 
once *you* are content, go back to behaving completely normal, is not a good pattern in life. 
Firstly, people might think you have PTSD or an antisocial personality disorder. 
And try to get you committed or jailed.
Secondly, it is likely going to put the other people around on edge. Especially children.
And that's bad. So don't use this pattern to guide your social life.

In web design on the other hand, this pattern is great! 
Here is why.

## Example: How to avoid that your drag event becomes a drag on scroll performance?

In this example I will set up a web component that uses the InvadeAndRetreat pattern to dispatch 
`dragging` events.
.

```javascript
class DragElement extends HTMLElement {
                                  
  constructor() {
    super();
    this._startListener = e => this._start(e);                  //[cache for listen]
    this._moveListener = e => this._move(e);                    //[cache for retreat]
    this._endListener = e => this._end(e);                      //[cache for retreat]
    this._cachedTouchAction = undefined;
    this._cachedUserSelect = undefined;
    this._cachedBody = undefined;                                                 
  }
  
  connectedCallback() {
    this.addEventListener("touchstart", this._startListener);   //[listen add]
    this.style.userSelect = "none";                             //[block]
    this.style.touchAction = "none";                            //[block]
  }
  
  disconnectedCallback() {
    this.removeEventListener("touchstart", this._startListener);//[listen remove]
  }
  
  _start(e) {
    e.preventDefault();                                         //[invade: block]
    this.setPointerCapture(e.pointerId);                        //[invade: block] use if pointerevents
    window.addEventListener("pointermove", this._moveListener); //[invade: grab on window]
    window.addEventListener("pointerup", this._endListener);    //[invade: grab on window]
    window.addEventListener("pointercancel", this._endListener);//[invade: grab on window]
    const body = document.querySelector("body");      
    this._cachedTouchAction = body.style.touchAction;           //[cache for retreat]
    this._cachedUserSelect  = body.style.userSelect;            //[cache for retreat]
    body.style.touchAction = "none";                            //[invade: block on body]
    body.style.userSelect = "none";                             //[invade: block on body]
  }
  
  _move(e) {
    e.preventDefault();                                         //[invade: block]
    const detail = {
      x: e.x,
      y: e.y,
    };                                                          //[do your thing]
    this.dispatchEvent(new CustomEvent("dragging", {bubbles: true, composed: true, detail}));
  }
  
  _end(e) {
    e.preventDefault();                                             //[invade: block]
    //this.releasePointerCapture(e.pointerId);                        //[retreat] use if pointerevents
    window.removeEventListener("pointermove", this._moveListener);  //[retreat]
    window.removeEventListener("pointerup", this._endListener);     //[retreat]
    window.removeEventListener("pointercancel", this._endListener); //[retreat]
    const body = document.querySelector("body");      
    body.style.touchAction = this._cachedTouchAction;               //[retreat]
    body.style.userSelect = this._cachedUserSelect;                 //[retreat]
    this._cachedTouchAction =  "none";
    this._cachedUserSelect  = "none";
  }
}
```
1. **Conflict trigger**: It is *only* when this element `touchstart` is dispatched 
on this element that a conflict might occur.
2. **Conflict border**. When the conflict is triggered, this element needs to:
   * listen for the `touchmove` and `touchend` event.
   * make sure no other native drag-based gestures are activated, anywhere.
3. **Listen**. This element only needs to listen for the touchstart event when 
it is connected to the DOM.
4. **Invade**. When the `touchstart` function is triggered:
   * **grab** absolutely all `touchmove` and `touchend` events. 
   This is done by attaching the event listeners on the window object, and
   calling `this.setPointerCapture(e.pointerId);`
   * **block** all the access to `touchmove` and `touchend` events for native gestures.
   This is done by both adding two restrictive CSS properties 
   `touch-action: none` and `user-selct: none` on the body.
   //todo can i set these CSS properties directly on document element?
5. **Do your thing**. Process the `touchmove` event and dispatch a custom `drag` event.
6. **Retreat**. When your `drag` gesture ends with the `touchend` event, immediately:
   1. release PointerCapture, 
   2. remove event listeners for `touchmove`, `touchcancel`, and `touchend`, and 
   3. restore the original CSS properties for `touch-action` and `user-select`.

What are the benefits of this approach?
* **Minimum interference when inactive**. 
You only add a single listener for `touchstart` on the element.
It is only when this trigger is hit, that you add the other listeners. 
To not have `touchmove` event listeners registered when they are not needed is a big plus. 
Even more, the `touchstart` listener is *removed* when the element is *not connected* to the DOM.

* **Maximum control of the `touchmove` event**. 
Since the `touchmove` events are only active when they will actually be used,
it is no longer problematic to add them to the window element! This removes all 
the headache of managing container elements (todo ref. zingtouch) in order to ensure that 
drag movements that go outside of the element are still caugt. 
This essentially resembles the setPointerCapture functionality of `pointerevents`.

As this example shows, this pattern leaves a fairly big code footprint in a web component.
But, this pattern easily combines with EventComposition and IsolatedFunctionalMixin.
To create excellent GestureMixins, such as the ones in 
[Chapter 5 Gesture mixins](Mixin1_DraggingFlingGesture.md).

The pattern InvadeAndRetreat handles [conflicting gestures](Discussion_conflicting_gestures.md).

<!--
Todo check that this research is included in this chapter
     * e.preventDefault() will make the browsers pan and scroll based on touch not happen.
     * But, this might not be what you want. You might want a scroll to be unaffected by your mixin.
     * And so,
     *
     * Todo: "touch-action: none" vs. e.preventDefault()
     * 1. add "touch-action: none" or "touch-action: pan-x" to the style of
     * a) the element itself and/or
     * b) any parent element up so far as to cover the area
     * that you think the user might get in contact with during the gesture.
     * This is bad because a) it is not supported in Safari and b) it might require you to block touch-action such as
     * essential pan-based scrolling and pinch zooming on the entire screen.
     *
     * 2. add "touch-action: none" when the gesture event is triggered
     * (at the same time as the eventListeners for the move and up are added).
     * a) I should probably do this with "touch-action: none" on the body element.
     * So to prevent it happening on the entire screen. That means that we need to cache the value of that property,
     * so that when the gesture stops, we restore that property to its original state.
     * In addition, e.preventDefault() is run on move event.
     * This seems like a better strategy.
     * Open questions are:
     * 1. will the browser intercept on the first move?? for example zoom just a little bit before it reacts? I think not.
     * 2. if we run e.preventDefault(), is it necessary at all to stress with the css touch-action property?
     * Will the default scroll in a browser ever run before the e.preventDefault is called?
     * And if so, can that be considered just a bug and not to be considered?
-->