const startListener = Symbol("pointerDownListener");
const moveListener = Symbol("pointerMoveListener");
const stopListener = Symbol("pointerUpListener");
const start = Symbol("start");
const move = Symbol("move");
const end = Symbol("end");
const fling = Symbol("fling");
const cachedEvents = Symbol("cachedEvents");

// function calcAngle(x1, y1, x2, y2) {
//   const radians = Math.atan2(y1 - y2, x1 - x2);
//   const degree = radians * 180 / Math.PI;
//   return -(degree < 0 ? degree + 360 : degree);
// }

function getFirstPastEventOlderThan(eventArray, endTime, flingSettingDuration) {
  for (let i = eventArray.length - 1; i >= 0; i--) {
    let pastEvent = eventArray[i];
    let durationMs = endTime - pastEvent.detail.pointerevent.timeStamp;
    if (durationMs > flingSettingDuration) {
      return [pastEvent, durationMs];
    }
  }
  return null;
}

/**
 * !!! Dependency: pointerevents !!!
 *
 * Mixin that translates a sequence of pointerdown, pointermove and pointerup events into a series of dragging events.
 * More extensive DraggingEventMixin.
 * Adds "fling" event at the end, and also calculates the speed (px/ms).
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
      const detail = {pointerevent: e, x: e.x, y: e.y};
      const dragStartEvent = new CustomEvent("draggingstart", {bubbles: true, composed: true, detail});
      this[cachedEvents] = [dragStartEvent];
      this.dispatchEvent(dragStartEvent);
    }

    [move](e) {
      const startEvent = this[cachedEvents][0];
      const prevEvent = this[cachedEvents][this[cachedEvents].length - 1];
      const detail = {
        moveX: e.x - prevEvent.detail.x,
        moveY: e.y - prevEvent.detail.y,
        moveStartX: e.x - startEvent.detail.x,
        moveStartY: e.y - startEvent.detail.y,
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
      detail.durationMs = e.timestamp - prevEvent.detail.pointerevent.timestamp;
      detail.velocityPxMs = detail.distancePx / detail.durationMs;

      const dragEvent = new CustomEvent("dragging", {bubbles: true, composed: true, detail});
      this[cachedEvents].push(dragEvent);
      this.dispatchEvent(dragEvent);
    }

    [end](e) {
      this.releasePointerCapture(e.pointerId);
      this.removeEventListener("pointermove", this[moveListener]);
      this.removeEventListener("pointerup", this[stopListener]);

      this[fling](e);
      this[cachedEvents] = undefined;
      const detail = {pointerevent: e};
      this.dispatchEvent(new CustomEvent("draggingend", {bubbles: true, composed: true, detail}));
    }

    [fling](e) {
      const flingSettingDuration = 200;
      const flingSettingDistance = 50;

      let endTime = e.timeStamp;
      const lastMoveEvent = this[cachedEvents][this[cachedEvents].length - 1];
      const [pastEvent, durationMs] = getFirstPastEventOlderThan(this[cachedEvents], endTime, flingSettingDuration);
      if (!pastEvent)
        return;

      const lastX = lastMoveEvent.detail.x;
      const lastY = lastMoveEvent.detail.y;
      const distX = lastX - pastEvent.detail.x;
      const distY = lastY - pastEvent.detail.y;
      const diagonalPx = Math.sqrt(distX * distX + distY * distY);
      if (diagonalPx < flingSettingDistance)
        return;

      const startTime = this[cachedEvents][0].detail.pointerevent.timeStamp;
      this.dispatchEvent(new CustomEvent("fling", {
        bubbles: true, composed: true, detail: {
          lastX,
          lastY,
          distX,
          distY,
          diagonalPx,
          durationMs,
          // totalTime: endTime - startTime,           //todo calculate this in the usecase?? yes, probably
          speedPxMs: diagonalPx / durationMs,
          xSpeedPxMs: distX / durationMs,
          ySpeedPxMs: distY / durationMs,
          // angle: calcAngle(0, 0, distX, distY)
        }
      }));
    }
  }
};