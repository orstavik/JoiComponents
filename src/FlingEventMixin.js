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
export function flingAngle(x = 0, y = 0) {
  const degree = Math.atan2(-y, -x) * 180 / Math.PI;
  return -(degree < 0 ? degree + 360 : degree);
}

/**
 * !!! Dependency: pointerevents !!!
 *
 * Mixin that translates a sequence of pointerdown, pointermove and pointerup events into a series of dragging events.
 * More extensive DraggingEventMixin.
 * Adds "fling" event at the end, and also calculates the speed (px/ms) in both diagonal, x and y direction.
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
 * Todo add to use the startdragging event to get the dragging distance from the start to the end.
 *
 * Todo rename FlingEventMixin to DragFlingGesture? and SwipeGexture? and PinchGesture?
 *
 * Todo split drag and fling?
 *
 * !!! Dependency: pointerevents !!!
 * !!! for Safari and older browsers use PEP: https://github.com/jquery/PEP !!!
 *
 * @param Base
 * @returns {FlingEventMixin}
 */
export const FlingEventMixin = function (Base) {
  return class extends Base {

    constructor() {
      super();
      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[stopListener] = (e) => this[end](e);
      this[cachedEvents] = undefined;
      this.flingSettings = {minDistance: 50, minDuration: 200};
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

      const detail = {pointerevent: e, x: e.x, y: e.y};
      this.dispatchEvent(new CustomEvent("draggingstart", {bubbles: true, composed: true, detail}));
    }

    [move](e) {
      this[cachedEvents].push(e);

      const prevEvent = this[cachedEvents][this[cachedEvents].length - 1];
      const detail = {
        moveX: e.x - prevEvent.x,
        moveY: e.y - prevEvent.y,
        x: e.x,
        y: e.y,
        clientX: e.clientX,
        clientY: e.clientY,
        layerX: e.layerX,
        layerY: e.layerY,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        pageX: e.pageX,
        pageY: e.pageY,
        screenX: e.screenX,
        screenY: e.screenY,
        pointerevent: e
      };
      detail.distancePx = Math.sqrt(detail.moveX * detail.moveX + detail.moveY * detail.moveY);
      detail.durationMs = e.timestamp - prevEvent.timestamp;
      detail.velocityPxMs = detail.distancePx / detail.durationMs;

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
      const lastMoveEvent = this[cachedEvents][this[cachedEvents].length - 1];
      const testTime = endTime - this.flingSettings.minDuration;
      const pastEvent = findLastEventOlderThan(this[cachedEvents], testTime);
      if (!pastEvent)
        return;

      const lastX = lastMoveEvent.x;
      const lastY = lastMoveEvent.y;
      const distX = lastX - pastEvent.x;
      const distY = lastY - pastEvent.y;
      const diagonalPx = Math.sqrt(distX * distX + distY * distY);
      if (diagonalPx < this.flingSettings.minDistance)
        return;

      const durationMs = endTime - pastEvent.timeStamp;
      this.dispatchEvent(new CustomEvent("fling", {
        bubbles: true, composed: true, detail: {
          lastX,
          lastY,
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