const startDiagonal = Symbol("startDiagonal");
const startWidth = Symbol("startWidth");
const startHeight = Symbol("startHeight");
const startAngle = Symbol("startAngle");
const lastDiagonal = Symbol("lastDiagonal");
const lastWidth = Symbol("lastWidth");
const lastHeight = Symbol("lastHeight");
const lastAngle = Symbol("lastAngle");
const id1 = Symbol("touchId1");
const id2 = Symbol("touchId2");

const startListener = Symbol("touchStartListener");
const moveListener = Symbol("touchMoveListener");
const endListener = Symbol("touchEndListener");
const start = Symbol("touchStart");
const move = Symbol("touchMove");
const end = Symbol("touchEnd");

function calcAngle(x1, y1, x2, y2) {
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
 *    .detail.touchevent
 *           .x1, .y1, .x2, .y2
 *  - pinchmove
 *    .detail.touchevent
 *           .x1, .y1, .x2, .y2
 *           .width
 *           .height
 *           .diagonal
 *           .diagonalStart
 *           .widthStart
 *           .heightStart
 *           .diagonalLast
 *           .widthLast
 *           .heightLast
 *           .rotation        (clockwise rotation since previous pinchmove)
 *           .rotationStart   (clockwise rotation since pinchstart)
 *  - pinchend
 *    .detail.touchevent
 *
 * To save cost per event, velocity is not calculated for every event.
 * Velocity can be calculated as (can be applied to width, height, diagonal, angle):
 *
 *   function velocity(nowLength, thenLength, now, then) {
 *     return (nowLength - thenLength) / (now - then);
 *   }
 *
 * @param Base
 * @returns {PinchEventMixin}
 */
export const PinchEventMixin = function (Base) {
  return class extends Base {
    constructor() {
      super();
      this[startDiagonal] = undefined;
      this[startWidth] = undefined;
      this[startHeight] = undefined;
      this[startAngle] = undefined;
      this[lastDiagonal] = undefined;
      this[lastWidth] = undefined;
      this[lastHeight] = undefined;
      this[lastAngle] = undefined;
      this[id1] = undefined;
      this[id2] = undefined;

      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[endListener] = (e) => this[end](e);
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
     * To implement 2, i need a this[bodyTouchActionValue]
     *
     * @param e
     */
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
      this[startDiagonal] = distance(x1, y1, x2, y2);
      this[startWidth] = x2 > x1 ? x2 - x1 : x1 - x2;
      this[startHeight] = y2 > y1 ? y2 - y1 : y1 - y2;
      this[startAngle] = calcAngle(x1, y1, x2, y2);

      window.addEventListener("touchmove", this[moveListener]);
      window.addEventListener("touchend", this[endListener]);
      window.addEventListener("touchcancel", this[endListener]);
      this.dispatchEvent(new CustomEvent("pinchstart", {
        bubbles: true,
        composed: true,
        detail: {touchevent: e, x1, y1, x2, y2}
      }));
    }

    [move](e) {
      e.preventDefault();
      const x1 = e.targetTouches[0].pageX;
      const y1 = e.targetTouches[0].pageY;
      const x2 = e.targetTouches[1].pageX;
      const y2 = e.targetTouches[1].pageY;
      const width = x2 > x1 ? x2 - x1 : x1 - x2;
      const height = y2 > y1 ? y2 - y1 : y1 - y2;
      const diagonal = distance(x1, y1, x2, y2);
      const angle = calcAngle(x1, y1, x2, y2);
      const detail = {
        touchevent: e,
        x1,
        y1,
        x2,
        y2,
        diagonal,
        width,
        height,
        lastDiagonal: this[lastDiagonal],
        lastWidth: this[lastWidth],
        lastHeight: this[lastHeight],
        startDiagonal: this[startDiagonal],
        startWidth: this[startWidth],
        startHeight: this[startHeight],
        rotation: this[lastAngle] - angle,
        rotationStart: this[startAngle] - angle
      };

      this[lastDiagonal] = diagonal;
      this[lastAngle] = angle;
      this[lastWidth] = width;
      this[lastHeight] = height;
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
      if ((e.targetTouches[0] && e.targetTouches[0].identifier === this[id1]) &&
          (e.targetTouches[1] && e.targetTouches[1].identifier === this[id2]))
        return;
      window.removeEventListener("touchmove", this[moveListener]);
      window.removeEventListener("touchend", this[endListener]);
      window.removeEventListener("touchcancel", this[endListener]);
      this[startDiagonal] = undefined;
      this[startWidth] = undefined;
      this[startHeight] = undefined;
      this[startAngle] = undefined;
      this[lastDiagonal] = undefined;
      this[lastWidth] = undefined;
      this[lastHeight] = undefined;
      this[lastAngle] = undefined;
      this[id1] = undefined;
      this[id2] = undefined;
      this.dispatchEvent(new CustomEvent("pinchend", {bubbles: true, composed: true, detail: {touchevent: e}}));
    }
  }
};