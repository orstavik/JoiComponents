const startListener = Symbol("pointerDownListener");
const moveListener = Symbol("pointerMoveListener");
const stopListener = Symbol("pointerUpListener");
const start = Symbol("pointerDownListener");
const move = Symbol("pointerMoveListener");
const stop = Symbol("pointerUpListener");
const cachedEvents = Symbol("cachedEvents");

function calcAngle(x1, y1, x2, y2) {
  const radians = Math.atan2(y1 - y2, x1 - x2);
  const degree = radians * 180 / Math.PI;
  return -(degree < 0 ? degree + 360 : degree);
}

/**
 * !!! Dependency: pointerevents !!!
 *
 * Todo this is a single touch or mouse or pointer gesture.
 *
 * Mixin that translates a sequence of pointerdown, pointermove and pointerup events into a series of dragging events.
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
      this[stopListener] = (e) => this[stop](e);
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
        moveX: e.x - prevEvent.x,
        moveY: e.y - prevEvent.y,
        moveStartX: e.x - startEvent.x,
        moveStartY: e.y - startEvent.y,
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
      detail.durationMs = e.timestamp - prevEvent.pointerevent.timestamp;
      detail.velocityPxMs = detail.distancePx / detail.durationMs;

      const dragEvent = new CustomEvent("dragging", {bubbles: true, composed: true, detail});
      this[cachedEvents].push(dragEvent);
      this.dispatchEvent(dragEvent);
    }

    [stop](e) {
      this.releasePointerCapture(e.pointerId);
      this.removeEventListener("pointermove", this[moveListener]);
      this.removeEventListener("pointerup", this[stopListener]);

      this.maybeAFling(e);
      this[cachedEvents] = undefined;
      const detail = {pointerevent: e};
      this.dispatchEvent(new CustomEvent("draggingend", {bubbles: true, composed: true, detail}));
    }

    maybeAFling(e) {
      let endTime = e.timestamp;
      const lastMoveEvent = this[cachedEvents][this[cachedEvents].length - 1];
      const lastX = lastMoveEvent.x;
      const lastY = lastMoveEvent.y;
      for (let i = this[cachedEvents].length - 1; i >= 0; i--) {
        let event = this[cachedEvents][i];
        let durationMs = endTime - event.pointerevent.timestamp;
        if (durationMs > 200) {
          const startX = event.x;
          const startY = event.y;
          const distX = lastX - startX;
          const distY = lastY - startY;
          const angle = calcAngle(0, 0, distX, distY);
          const diagonalPx = Math.sqrt(distX * distX + distY * distY);
          const speed = diagonalPx / durationMs;
          if (diagonalPx > 100) {                   //todo don't know the speed limit
            const detail = {
              lastX,
              lastY,
              durationMs,
              diagonalPx,
              speed,
              distX,
              distY,
              angle
            };
            this.dispatchEvent(new CustomEvent("fling", {bubbles: true, composed: true, detail}));
          }
        }
      }
    }
  }
};