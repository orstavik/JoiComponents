const startListener = Symbol("pointerDownListener");
const moveListener = Symbol("pointerMoveListener");
const stopListener = Symbol("pointerUpListener");
const start = Symbol("start");
const move = Symbol("move");
const end = Symbol("end");
const swipe = Symbol("swipe");
const cachedEvents = Symbol("cachedEvents");

/**
 * @returns {number} the angle of a vector from 0,0 to x,y from 0 to 360 degrees.
 *                   The angle starts at 12 o'clock and counts clockwise.
 */
function flingAngle(x = 0, y = 0) {
  return ((Math.atan2(y, -x) * 180 / Math.PI)+270)%360;
}

function findLastEventOlderThan(events, testTime) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].timeStamp < testTime)
      return events[i];
  }
  return null;
}

/**
 * !!! Dependency: pointerevents !!!
 *
 * Mixin that translates a sequence of pointerdown, pointermove and pointerup events into a series of dragging events.
 * More extensive DraggingEventMixin.
 * Adds "swipe" event at the end, and also calculates the speed (px/ms) in both diagonal, x and y direction.
 * Adds flingSettings {minDuration: 200, minDistance: 50};
 *
 * The dragging event is fired when pointerdown + pointermove.
 * The dragging event has the properties:
 *  - detail.moveX        (x movement since last "dragging" event)
 *  - detail.moveY        (y movement since last "dragging" event)
 *  - detail.moveStartX   (x movement since start of "dragging" events)
 *  - detail.moveStartY   (x movement since start of "dragging" events)
 *
 * (Start coordinates = [e.detail.x-e.detail.moveStartX, e.detail.y-e.detail.moveStartY])
 *
 * !!! Dependency: pointerevents !!!
 * !!! for Safari and older browsers use PEP: https://github.com/jquery/PEP !!!
 *
 * @param Base
 * @returns {DragFlingGesture}
 */
export const SwipeGesture = function (Base) {
  return class extends Base {

    constructor() {
      super();
      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[stopListener] = (e) => this[end](e);
      this[cachedEvents] = undefined;
      this.swipeSettings = {minDistance: 50, minDuration: 200};
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addEventListener("pointerdown", this[startListener]);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
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
      const swipeStart = findLastEventOlderThan(this[cachedEvents], e.timeStamp - this.flingSettings.minDuration);
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
      if (diagonalPx < this.flingSettings.minDistance)
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
      this.releasePointerCapture(e.pointerId);
    }
  }
};