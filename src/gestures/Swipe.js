const selectListener = Symbol("selectstartListener");
const startListener = Symbol("pointerDownListener");
const moveListener = Symbol("pointerMoveListener");
const stopListener = Symbol("pointerUpListener");
const start = Symbol("start");
const move = Symbol("move");
const end = Symbol("end");
const swipe = Symbol("swipe");
const cachedEvents = Symbol("cachedEvents");

function flingAngle(x = 0, y = 0) {
  return ((Math.atan2(y, -x) * 180 / Math.PI)+270)%360;
}

function findLastEventOlderThan(events, timeTest) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].timeStamp < timeTest)
      return events[i];
  }
  return null;
}

/**
 * !!! Dependency: pointerevents !!!
 *
 * Mixin that translates a sequence of one pointerdown and several pointermove events into one or more swipe events.
 *
 * The "swipe" event only occurs if the pointermove events have:
 *  - moved a minimum 50px
 *  - in one direction
 *  - during the last 200ms.
 *
 * The minimum distance and duration can be changed using these properties on the element
 *   .flingSettings.minDistance = 50;
 *   .flingSettings.minDuration = 200;
 *
 * swipe.detail
 *                .x
 *                .y
 *                .distX
 *                .distY
 *                .diagonalPx
 *                .durationMs
 *                .speedPxMs
 *                .pointerevent: e
 *                .xSpeedPxMs
 *                .ySpeedPxMs
 *                .angle
 *
 * The angle starts at 12 o'clock and counts clockwise from 0 to 360 degrees.
 *  up/north:     0
 *  right/east:  90
 *  down/south: 180
 *  left/west:  270
 *
 * !!! Dependency: pointerevents !!!
 * !!! for Safari and older browsers use PEP: https://github.com/jquery/PEP !!!
 *
 * @param Base
 * @returns {SwipeGesture}
 */
export const SwipeGesture = function (Base) {
  return class extends Base {

    constructor() {
      super();
      this[selectListener] = e => e.preventDefault();
      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[stopListener] = (e) => this[end](e);
      this[cachedEvents] = undefined;
      this.swipeSettings = {minDistance: 50, minDuration: 200};
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addEventListener("selectstart", this[selectListener]);
      this.addEventListener("pointerdown", this[startListener]);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeEventListener("selectstart", this[startListener]);
      this.removeEventListener("pointerdown", this[startListener]);
    }

    [start](e) {
      this.setPointerCapture(e.pointerId);
      this.addEventListener("pointermove", this[moveListener]);
      this.addEventListener("pointerup", this[stopListener]);
      this.addEventListener("pointercancel", this[stopListener]);
      this[cachedEvents] = [e];
    }

    [move](e) {
      const swipeStart = findLastEventOlderThan(this[cachedEvents], e.timeStamp - this.swipeSettings.minDuration);
      this[cachedEvents].push(e);
      if (!swipeStart)
        return;

      const startX = swipeStart.x;
      const startY = swipeStart.y;
      const stopX = e.x;
      const stopY = e.y;
      const distX = stopX - startX;
      const distY = stopY - startY;
      const diagonalPx = Math.sqrt(distX * distX + distY * distY);
      if (diagonalPx < this.swipeSettings.minDistance)
        return;

      this[cachedEvents] = [e];                                 //reset the cachedEvents.
      const durationMs = e.timeStamp - swipeStart.timeStamp;
      this.dispatchEvent(new CustomEvent("swipe", {
        bubbles: true, composed: true, detail: {
          startX,
          startY,
          stopX,
          stopY,
          distX,
          distY,
          diagonalPx,
          durationMs,
          speedPxMs: diagonalPx / durationMs,
          xSpeedPxMs: distX / durationMs,
          ySpeedPxMs: distY / durationMs,
          angle: flingAngle(distX, distY)
        }
      }));
    }

    [end](e) {
      this[cachedEvents] = undefined;
      this.removeEventListener("pointermove", this[moveListener]);
      this.removeEventListener("pointerup", this[stopListener]);
      this.removeEventListener("pointercancel", this[stopListener]);
      this.releasePointerCapture(e.pointerId);
    }
  }
};