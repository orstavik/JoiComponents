const lastAngle = Symbol("lastAngle");
const id1 = Symbol("touchId1");
const id2 = Symbol("touchId2");
const cachedEventDetails = Symbol("cachedEventDetails");
const cachedTouchAction = Symbol("cachedTouchAction");

const startListener = Symbol("touchStartListener");
const moveListener = Symbol("touchMoveListener");
const endListener = Symbol("touchEndListener");
const start = Symbol("touchStart");
const move = Symbol("touchMove");
const end = Symbol("touchEnd");
const endCachedDetail = Symbol("endCachedDetail");
const activeEventOrCallback = Symbol("activeEventOrCallback");
const eventAndOrCallback = Symbol("callbackAndOrEvent");

function calcAngle(x, y) {
  return ((Math.atan2(y, -x) * 180 / Math.PI) + 270) % 360;
}

/**
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
      this[cachedEventDetails] = undefined;
      this[cachedTouchAction] = undefined;
      this[id1] = undefined;
      this[id2] = undefined;

      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[endListener] = (e) => this[end](e);
      this[activeEventOrCallback] = 0;
    }

    /**
     * By default it is only event
     * @returns {number} 0 = event+callback, 1 = only event, -1 = only callback
     */
    static get dragFlingEventOrCallback() {
      return -1;
    }

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
      if (this[id1] !== undefined || e.targetTouches.length < 2)
        return;
      e.preventDefault();
      //const body = document.querySelector("body");
      // this[cachedTouchAction] = body.style.touchAction;
      // body.style.touchAction = "none";                       //max1
      window.addEventListener("touchmove", this[moveListener]);
      window.addEventListener("touchend", this[endListener]);
      window.addEventListener("touchcancel", this[endListener]);

      const f1 = e.targetTouches[0];
      const f2 = e.targetTouches[1];
      this[id1] = f1.identifier;
      this[id2] = f2.identifier;

      this[activeEventOrCallback] = this.constructor.dragFlingEventOrCallback;
      const detail = this.makeDetail(f2.pageX, f1.pageX, f2.pageY, f1.pageY, e);
      this[cachedEventDetails] = [detail];
      this[eventAndOrCallback]("pinchstart", detail);
    }

    [move](e) {
      e.preventDefault();
      //b. const lastEventDetail = this[cachedEventDetails][this[cachedEventDetails].length - 1];
      //a. const startEventDetail = this[cachedEventDetails][0];

      const f1 = e.targetTouches[0];
      const f2 = e.targetTouches[1];
      const detail = this.makeDetail(f2.pageX, f1.pageX, f2.pageY, f1.pageY, e);
      //a. detail.distDiagonal = detail.diagonal / startEventDetail.diagonal; //changing distChange, into a fractionFromStart
      //a. detail.distWidth = detail.width / startEventDetail.width;
      //a. detail.distHeight = detail.height / startEventDetail.height;
      //a. detail.rotationStart = startEventDetail.angle - detail.angle;
      //b. detail.rotation = lastEventDetail.angle - detail.angle;

      //todo still need cachedEvents to do spin on rotation and scalefling for scaling
      this[cachedEventDetails].push(detail);
      this[eventAndOrCallback]("pinch", detail);
    }

    makeDetail(x2, x1, y2, y1, touchevent) {
      const width = x2 > x1 ? x2 - x1 : x1 - x2;
      const height = y2 > y1 ? y2 - y1 : y1 - y2;
      const diagonal = Math.sqrt(width * width + height * height);
      const angle = calcAngle(x1 - x2, y1 - y2);
      return {touchevent, x1, y1, x2, y2, diagonal, width, height, angle};
    }

    /**
     * This is only called when one of the events triggered when the pinch is active.
     * You can add more fingers (accidentally touch the screen with more fingers while you rotate or pinch),
     * but you cannot take one of the two original target fingers off the screen.
     */
    [end](e) {
      e.preventDefault();
      if (this[id1] === undefined)
        return;
      if ((e.targetTouches[0] && e.targetTouches[0].identifier === this[id1]) &&
        (e.targetTouches[1] && e.targetTouches[1].identifier === this[id2]))
        return;
      //todo add the fling calculations for both rotation, pinch and doubledrag
      window.removeEventListener("touchmove", this[moveListener]);
      window.removeEventListener("touchend", this[endListener]);
      window.removeEventListener("touchcancel", this[endListener]);
      //const body = document.querySelector("body");
      // body.style.touchAction = this[cachedTouchAction];                       //max1
      // this[cachedTouchAction] = undefined;
      this[endCachedDetail] = {touchevent: e};
      this[activeEventOrCallback] = undefined;
      this[cachedEventDetails] = undefined;
      this[id1] = undefined;
      this[id2] = undefined;
      this[eventAndOrCallback]("pinchend", this[endCachedDetail]);
    }


    [eventAndOrCallback](eventName, detail) {
      if (this[activeEventOrCallback] <= 0) {
        let cbName = eventName + "Callback";
        this[cbName] && this[cbName](detail);
      }
      if (this[activeEventOrCallback] >= 0)
        this.dispatchEvent(new CustomEvent(eventName, {bubbles: true, detail}));
    }
  }
};