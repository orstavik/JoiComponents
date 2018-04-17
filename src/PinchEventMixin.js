const startDistance = Symbol("startDistance");
const startAngle = Symbol("startAngle");
const lastDistance = Symbol("lastDistance");
const lastAngle = Symbol("lastAngle");

const active = Symbol("active");

const startListener = Symbol("touchStartListener");
const moveListener = Symbol("touchMoveListener");
const endListener = Symbol("touchEndListener");
const start = Symbol("touchStart");
const move = Symbol("touchMove");
const end = Symbol("touchEnd");

function angle(x1, y1, x2, y2) {
  const radians = Math.atan2(y1 - y2, x1 - x2);
  const degree = radians * 180 / Math.PI;
  return degree < 0 ? degree + 360 : degree;
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
 *           .distanceStart   (distance since last pinchstart)
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
      this[startAngle] = undefined;
      this[lastDistance] = undefined;
      this[lastAngle] = undefined;

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
      if (e.targetTouches.length !== 2)                                           //two fingers start, then start listening for move
        return;                                                                   //todo three fingers start, stop listening for move??
      const x1 = e.targetTouches[0].pageX;
      const y1 = e.targetTouches[0].pageY;
      const x2 = e.targetTouches[1].pageX;
      const y2 = e.targetTouches[1].pageY;
      this[startDistance] = distance(x1, y1, x2, y2);
      this[startAngle] = angle(x1, y1, x2, y2);

      this.addEventListener("touchmove", this[moveListener]);
      this.addEventListener("touchend", this[endListener]);
      this.addEventListener("touchcancel", this[endListener]);
      this.dispatchEvent(new CustomEvent("pinchstart", {bubbles: true, composed: true, detail: e}));
    }

    [move](e) {
      const x1 = e.targetTouches[0].pageX;
      const y1 = e.targetTouches[0].pageY;
      const x2 = e.targetTouches[1].pageX;
      const y2 = e.targetTouches[1].pageY;
      const d = distance(x1, y1, x2, y2);
      const a = angle(x1, y1, x2, y2);

      const detail = {
        distance: this[lastDistance] - d,
        rotation: this[lastAngle] - a,
        distanceStart: this[startDistance] - d,
        rotationStart: this[startAngle] - a
      };

      this[lastDistance] = d;
      this[lastAngle] = a;
      this.dispatchEvent(new CustomEvent("pinch", {bubbles: true, composed: true, detail}));
    }

    [end](e) {
      if (e.targetTouches.length >= 2)      //todo I need to check if one of the original fingers have been removed. so I need to keep an id of the original fingers.
        return;
      this.removeEventListener("touchmove", this[moveListener]);
      this.removeEventListener("touchend", this[endListener]);
      this[startDistance] = undefined;
      this[startAngle] = undefined;
      this[lastDistance] = undefined;
      this[lastAngle] = undefined;
      this.dispatchEvent(new CustomEvent("pinchend", {bubbles: true, composed: true, detail: e}));
    }
  }
};