const selectListener = Symbol("selectstartListener");
const startListener = Symbol("pointerDownListener");
const moveListener = Symbol("pointerMoveListener");
const stopListener = Symbol("pointerUpListener");
const start = Symbol("start");
const move = Symbol("move");
const end = Symbol("end");
const fling = Symbol("fling");
const cachedEvents = Symbol("cachedEvents");

function findLastEventOlderThan(events, timeTest) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].timeStamp < timeTest)
      return events[i];
  }
  return null;
}

/**
 * @returns {number} the angle of a vector from 0,0 to x,y from 0 to 360 degrees.
 *                   The angle starts at 12 o'clock and counts clockwise.
 */
function flingAngle(x = 0, y = 0) {
  return ((Math.atan2(y, -x) * 180 / Math.PI)+270)%360;
}

/**
 * !!! Dependency: pointerevents !!!
 *
 * Mixin that translates a sequence of pointer events to dragging+fling events.
 *  - pointerdown => draggingstart
 *  - pointermove => dragging
 *  - pointerend => fling + dragend
 *
 * The "fling" event only occurs if the dragging event before the dragend moved
 * minimum 50px in one direction during the last 200ms.
 * The minimum distance and duration can be changed using these properties on the element
 *   .flingSettings.minDistance = 50;
 *   .flingSettings.minDuration = 200;
 *
 * dragging.detail && fling.detail
 *                .x
 *                .y
 *                .distX
 *                .distY
 *                .diagonalPx
 *                .durationMs
 *                .speedPxMs
 *                .pointerevent: e
 *
 * only fling.detail
 *                .xSpeedPxMs
 *                .ySpeedPxMs
 *                .angle
 *
 * !!! Dependency: pointerevents !!!
 * !!! for Safari and older browsers use PEP: https://github.com/jquery/PEP !!!
 *
 * @param Base
 * @returns {DragFlingGesture}
 */
export const DragFlingGesture = function (Base) {
  return class extends Base {

    constructor() {
      super();
      this[selectListener] = e => e.preventDefault();
      this[startListener] = e => this[start](e);
      this[moveListener] = e => this[move](e);
      this[stopListener] = e => this[end](e);
      this[cachedEvents] = undefined;
      this.flingSettings = {minDistance: 50, minDuration: 200};
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addEventListener("selectstart", this[selectListener]);
      this.addEventListener("pointerdown", this[startListener]);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeEventListener("selectstart", this[selectListener]);
      this.removeEventListener("pointerdown", this[startListener]);
    }

    [start](e) {
      this.setPointerCapture(e.pointerId);
      this.addEventListener("pointermove", this[moveListener]);
      this.addEventListener("pointerup", this[stopListener]);
      this.addEventListener("pointercancel", this[stopListener]);
      this[cachedEvents] = [e];

      const detail = {pointerevent: e, x: e.x, y: e.y};
      this.dispatchEvent(new CustomEvent("draggingstart", {bubbles: true, composed: true, detail}));
    }

    [move](e) {
      const prevEvent = this[cachedEvents][this[cachedEvents].length - 1];
      this[cachedEvents].push(e);

      const detail = {
        distX: e.x - prevEvent.x,
        distY: e.y - prevEvent.y,
        x: e.x,
        y: e.y,
        pointerevent: e
      };
      detail.diagonalPx = Math.sqrt(detail.distX * detail.distX + detail.distY * detail.distY);
      detail.durationMs = e.timestamp - prevEvent.timestamp;
      detail.speedPxMs = detail.diagonalPx / detail.durationMs;

      this.dispatchEvent(new CustomEvent("dragging", {bubbles: true, composed: true, detail}));
    }

    [end](e) {
      this[fling](e);

      this.releasePointerCapture(e.pointerId);
      this.removeEventListener("pointermove", this[moveListener]);
      this.removeEventListener("pointerup", this[stopListener]);
      this[cachedEvents] = undefined;

      const detail = {pointerevent: e};
      this.dispatchEvent(new CustomEvent("draggingend", {bubbles: true, composed: true, detail}));
    }

    [fling](e) {
      let endTime = e.timeStamp;
      const stopEvent = this[cachedEvents][this[cachedEvents].length - 1];
      const testTime = endTime - this.flingSettings.minDuration;
      const startEvent = findLastEventOlderThan(this[cachedEvents], testTime);
      if (!startEvent)
        return;

      const x = stopEvent.x;
      const y = stopEvent.y;
      const distX = x - startEvent.x;
      const distY = y - startEvent.y;
      const diagonalPx = Math.sqrt(distX * distX + distY * distY);
      if (diagonalPx < this.flingSettings.minDistance)
        return;

      const durationMs = endTime - startEvent.timeStamp;
      this.dispatchEvent(new CustomEvent("fling", {
        bubbles: true, composed: true, detail: {
          x,
          y,
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
  }
};