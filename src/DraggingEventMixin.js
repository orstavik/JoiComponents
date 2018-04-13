const startListener = Symbol("pointerDownListener");
const moveListener = Symbol("pointerMoveListener");
const stopListener = Symbol("pointerUpListener");
const start = Symbol("pointerDownListener");
const move = Symbol("pointerMoveListener");
const stop = Symbol("pointerUpListener");
const startEvent = Symbol("startEvent");
const previousMoveEvent = Symbol("previousMoveEvent");

/**
 * !!! Dependency: pointerevents !!!
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
 * @returns {DraggingEventMixin}
 */
export const DraggingEventMixin = function (Base) {
  return class DraggingEventMixin extends Base {

    constructor() {
      super();
      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[stopListener] = (e) => this[stop](e);
      this[startEvent] = undefined;
      this[previousMoveEvent] = undefined;
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
      this[startEvent] = this[previousMoveEvent] = e;
      this.addEventListener("pointermove", this[moveListener]);
      this.addEventListener("pointerup", this[stopListener]);
      this.addEventListener("pointercancel", this[stopListener]);
    }

    [move](e) {
      this.addEventListener(this[moveListener]);
      const detail = {
        moveX: e.clientX - this[previousMoveEvent].clientX,
        moveY: e.clientY - this[previousMoveEvent].clientY,
        moveStartX: e.clientX - this[startEvent].clientX,
        moveStartY: e.clientY - this[startEvent].clientY,
        x: mouseevent.x,
        y: mouseevent.y,
        clientX: mouseevent.clientX,
        clientY: mouseevent.clientY,
        layerX: mouseevent.layerX,
        layerY: mouseevent.layerY,
        offsetX: mouseevent.offsetX,
        offsetY: mouseevent.offsetY,
        pageX: mouseevent.pageX,
        pageY: mouseevent.pageY,
        screenX: mouseevent.screenX,
        screenY: mouseevent.screenY
      };
      this[previousMoveEvent] = e;
      this.dispatchEvent(new CustomEvent("dragging", {bubbles: true, composed: true, detail}));
    }

    [stop](e) {
      this.releasePointerCapture(e.pointerId);
      this.removeEventListener("pointermove", this[startListener]);
      this.removeEventListener("pointerup", this[startListener]);
      this[startEvent] = undefined;
      this[previousMoveEvent] = undefined;
    }
  }
};