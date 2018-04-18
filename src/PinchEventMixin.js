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
 *           .rotation        (rotation since last pinchmove)
 *           .rotationStart   (rotation since last pinchstart)
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
      const x1 = e.targetTouches[0].pageX;
      const y1 = e.targetTouches[0].pageY;
      const x2 = e.targetTouches[1].pageX;
      const y2 = e.targetTouches[1].pageY;
      const distX = x2 > x1 ? x2-x1 : x1-x2;
      const distY = y2 > y1 ? y2-y1 : y1-y2;
      const d = distance(x1, y1, x2, y2);
      const a = angle(x1, y1, x2, y2);

      const detail = {
        distance: this[lastDistance] - d,
        distanceX: this[lastDistanceX] - distX,
        distanceY: this[lastDistanceY] - distY,
        rotation: this[lastAngle] - a,
        distanceStart: this[startDistance] - d,
        distanceXStart: this[startDistanceX] - distX,
        distanceYStart: this[startDistanceY] - distY,
        rotationStart: this[startAngle] - a
      };

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