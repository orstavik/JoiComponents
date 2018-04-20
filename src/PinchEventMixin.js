const startDistance = Symbol("startDistance");
const startDistanceX = Symbol("startDistanceX");
const startDistanceY = Symbol("startDistanceY");
const startAngle = Symbol("startAngle");
const lastDistance = Symbol("lastDistance");
const lastDistanceX = Symbol("lastDistanceX");
const lastDistanceY = Symbol("lastDistanceY");
const lastAngle = Symbol("lastAngle");
const id1 = Symbol("touchId1");
const id2 = Symbol("touchId2");

const startListener = Symbol("touchStartListener");
const moveListener = Symbol("touchMoveListener");
const endListener = Symbol("touchEndListener");
const start = Symbol("touchStart");
const move = Symbol("touchMove");
const end = Symbol("touchEnd");

function angle(x1, y1, x2, y2) {
  const radians = Math.atan2(y1 - y2, x1 - x2);
  const degree = radians * 180 / Math.PI;
  return -(degree < 0 ? degree + 360 : degree);
}

function distance(x1, y1, x2, y2) {
  const xD = (x1 + x2) / 2;
  const yD = (y1 + y2) / 2;
  return Math.sqrt(xD * xD + yD * yD);
}

/**
 * todo should i be tolerant of more than one finger coming in contact with the screen? I think maybe not..
 * todo How then to run two finger gesture in parallell with three finger gesture?
 * todo should i calculate velocity?? Or should I let the client handle that? It will cost,
 * todo and the velocity of either angle or distance can be calculated based on the incoming event input.
 * todo should I add the two fingers x1, y1, x2, y2 coordinates to the start and move detail??
 * todo should I rename the PinchEvent to TwoFingerGesture?
 *
 * Todo: alternative approaches to preventing default actions / default gestures for the element.
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
 * To implement 2, i need a this[]
 *
 * Mixin for two-finger pinch, expand and rotate gestures.
 * The pinch event is fired when two fingers are pressed and moved against the screen.
 * PinchEventMixin translates a sequence of touchstart, touchmove
 * and touchend events into a series of pinch events.
 *
 * Events:
 *  - pinchstart
 *   .detail = original touchstart event
 *  - pinchmove
 *    .detail.distance        (distance since last pinchmove)
 *           .distanceX       (distance in X dimension since last pinchmove)
 *           .distanceY       (distance in Y dimension since last pinchmove)
 *           .distanceStart   (distance since last pinchstart)
 *           .distanceXStart  (distance in X dimension since last pinchstart)
 *           .distanceYStart  (distance in Y dimension since last pinchstart)
 *           .rotation        (clockwise rotation since last pinchmove)
 *           .rotationStart   (clockwise rotation since last pinchstart)
 *  - pinchend
 *   .detail = original touchend event
 * @param Base
 * @returns {PinchEventMixin}
 */
export const PinchEventMixin = function (Base) {
  return class extends Base {
    constructor() {
      super();
      this[startDistance] = undefined;
      this[startDistanceX] = undefined;
      this[startDistanceY] = undefined;
      this[startAngle] = undefined;
      this[lastDistance] = undefined;
      this[lastDistanceX] = undefined;
      this[lastDistanceY] = undefined;
      this[lastAngle] = undefined;
      this[id1] = undefined;
      this[id2] = undefined;

      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[endListener] = (e) => this[end](e);
      this.minPinchDistance = 10;
      this.minPinchRotation = 1;
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

    [start](e) {
      if (this[id1] !== undefined || e.targetTouches.length < 2)
        return;
      e.preventDefault();
      this[id1] = e.targetTouches[0].identifier;
      this[id2] = e.targetTouches[1].identifier;
      const x1 = e.targetTouches[0].pageX;
      const y1 = e.targetTouches[0].pageY;
      const x2 = e.targetTouches[1].pageX;
      const y2 = e.targetTouches[1].pageY;
      this[startDistance] = distance(x1, y1, x2, y2);
      this[startDistanceX] = x2 > x1 ? x2-x1 : x1-x2;
      this[startDistanceY] = y2 > y1 ? y2-y1 : y1-y2;
      this[startAngle] = angle(x1, y1, x2, y2);

      window.addEventListener("touchmove", this[moveListener]);
      window.addEventListener("touchend", this[endListener]);
      window.addEventListener("touchcancel", this[endListener]);
      this.dispatchEvent(new CustomEvent("pinchstart", {bubbles: true, composed: true, detail: e}));
    }

    [move](e) {
      e.preventDefault();
      const x1 = e.targetTouches[0].pageX;
      const y1 = e.targetTouches[0].pageY;
      const x2 = e.targetTouches[1].pageX;
      const y2 = e.targetTouches[1].pageY;
      const distX = x2 > x1 ? x2-x1 : x1-x2;
      const distY = y2 > y1 ? y2-y1 : y1-y2;
      const d = distance(x1, y1, x2, y2);
      const a = angle(x1, y1, x2, y2);
      const detail = {
        distance: d,
        distanceX: distX,
        distanceY: distY,
        distanceChange: this[lastDistance] - d,
        distanceChangeX: this[lastDistanceX] - distX,
        distanceChangeY: this[lastDistanceY] - distY,
        distanceStart: this[startDistance] - d,
        distanceXStart: this[startDistanceX] - distX,
        distanceYStart: this[startDistanceY] - distY,
        rotation: this[lastAngle] - a,
        rotationStart: this[startAngle] - a
      };
      detail.velocity = detail.distanceChange / (this[lastTime] - e.timeStamp);

      this[lastDistance] = d;
      this[lastAngle] = a;
      this[lastDistanceX] = distX;
      this[lastDistanceY] = distY;
      this.dispatchEvent(new CustomEvent("pinch", {bubbles: true, composed: true, detail}));
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
      if (e.targetTouches[0].identifier === this[id1] && e.targetTouches[1].identifier === this[id2])
        return;
      window.removeEventListener("touchmove", this[moveListener]);
      window.removeEventListener("touchend", this[endListener]);
      window.removeEventListener("touchcancel", this[endListener]);
      this[startDistance] = undefined;
      this[startDistanceX] = undefined;
      this[startDistanceY] = undefined;
      this[startAngle] = undefined;
      this[lastDistance] = undefined;
      this[lastDistanceX] = undefined;
      this[lastDistanceY] = undefined;
      this[lastAngle] = undefined;
      this[id1] = undefined;
      this[id2] = undefined;
      this.dispatchEvent(new CustomEvent("pinchend", {bubbles: true, composed: true, detail: e}));
    }
  }
};