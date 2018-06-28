const startListener = Symbol("touchStartListener");
const moveListener = Symbol("touchMoveListener");
const endListener = Symbol("touchEndListener");
const start = Symbol("touchStart");
const move = Symbol("touchMove");
const end = Symbol("touchEnd");

const recordedEventDetails = Symbol("recordedEventDetails");
const cachedTouchAction = Symbol("cachedTouchAction");
const addEvent = Symbol("addEvent");

function calcAngle(x, y) {
  return ((Math.atan2(y, -x) * 180 / Math.PI) + 270) % 360;
}

function makeDetail(touchevent) {
  const f1 = touchevent.targetTouches[0];
  const f2 = touchevent.targetTouches[1];
  const x1 = f1.pageX;
  const y1 = f1.pageY;
  const x2 = f2.pageX;
  const y2 = f2.pageY;
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  const diagonal = Math.sqrt(width * width + height * height);
  const angle = calcAngle(x1 - x2, y1 - y2);
  return {touchevent, x1, y1, x2, y2, diagonal, width, height, angle};
}

/**
 * todo now it should only reacts to two fingers. adding a third finger should end the eventRecording.
 *
 * Two-finger mixin for pinch, expand, rotate and doubledragging gestures.
 * The purpose of PinchGestureGesture is to add pinch events and/or callbacks to an element.
 * The pinchGestureCallback(detail) is fired when two fingers are pressed
 * and moved against the screen.
 * PinchGestureCallback(...) translates a sequence of touchstart, touchmove
 * and touchend events into a series of pinch events.
 *
 *    startDetail:
 *    {touchevent, x1, y1, x2, y2, diagonal, width, height, angle, averageX, averageY}

 moveDetail
 {
*           touchevent,
*           x1, y1, x2, y2,
*           width, height, diagonal,
*           widthStart, heightStart, diagonalStart,
*           widthLast, heightLast, diagonalLast,
*           rotationLast,                          //clockwise rotation since previous pinchmove
*           rotationStart                          //clockwise rotation since pinchstart
*           averageMoveX, averageMoveY             //two finger average movements
*     }
 *  - endDetail
 *    {touchevent}
 *
 * Two finger gestures..
 * I need different detail data for different type of events
 *  - rotations for rotating
 *  - distances for pinch
 *  - movements averages for map drag
 *
 * todo move this into the documentation for pinch
 * Speed can be calculated as (can be applied to width, height, diagonal, angle):
 *
 *   function speed(nowLength, thenLength, now, then) {
 *     return (nowLength - thenLength) / (now - then);
 *   }
 *
 * @param Base
 * @returns {PinchGesture}
 */
export const PinchGesture = function (Base) {
  return class extends Base {
    constructor() {
      super();
      this[recordedEventDetails] = undefined;
      this[cachedTouchAction] = undefined;

      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[endListener] = (e) => this[end](e);
      this[addEvent] = false;
    }

    /**
     * By default it is only callback, if this staticSetting is true, dispatch event too
     * @returns {boolean} true => di
     */
    // static get dragFlingEventOrCallback() {
    //   return false;
    // }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      // this.style.touchAction = "none"; //todo study this
      this.addEventListener("touchstart", this[startListener]);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeEventListener("touchstart", this[startListener]);
    }

    /**
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
     *
     * @param e
     */
    [start](e) {
      if (this[recordedEventDetails] !== undefined)  //this must be more than two fingers
        return this[end](e);
      if (e.targetTouches.length !== 2)              //this must be only one finger
        return;
      e.preventDefault();
      // const body = document.querySelector("body");
      // this[cachedTouchAction] = body.style.touchAction;
      // body.style.touchAction = "none";                       //max1
      window.addEventListener("touchmove", this[moveListener]);
      window.addEventListener("touchend", this[endListener]);
      window.addEventListener("touchcancel", this[endListener]);
      this[addEvent] = this.constructor.dragFlingEventOrCallback;
      const detail = makeDetail(e);
      this[recordedEventDetails] = [detail];
      this.pinchstartCallback && this.pinchstartCallback(detail);
      this[addEvent] && this.dispatchEvent(new CustomEvent("pinchstart", {bubbles: true, detail}));
    }

    [move](e) {
      e.preventDefault();

      const detail = makeDetail(e);
      this[recordedEventDetails].push(detail);
      this.pinchCallback && this.pinchCallback(detail);
      this[addEvent] && this.dispatchEvent(new CustomEvent("pinch", {bubbles: true, detail}));
    }

    /**
     * This is only called when one of the events triggered when the pinch is active.
     * You can add more fingers (accidentally touch the screen with more fingers while you rotate or pinch),
     * but you cannot take one of the two original target fingers off the screen.
     */
    [end](e) {
      e.preventDefault();
      //todo add the fling calculations for both rotation, pinch and doubledrag
      //todo still need cachedEvents to do spin on rotation and scalefling for scaling
      window.removeEventListener("touchmove", this[moveListener]);
      window.removeEventListener("touchend", this[endListener]);
      window.removeEventListener("touchcancel", this[endListener]);
      //const body = document.querySelector("body");
      // body.style.touchAction = this[cachedTouchAction];                       //max1
      // this[cachedTouchAction] = undefined;
      this[recordedEventDetails] = undefined;
      const detail = {touchevent: e};
      this.pinchendCallback && this.pinchendCallback(detail);
      this[addEvent] && this.dispatchEvent(new CustomEvent("pinchend", {bubbles: true, detail}));
    }
  }
};