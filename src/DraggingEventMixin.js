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
 * Todo this is a single touch or mouse or pointer gesture.
 * todo should i add velocity
 * todo add start dragging
 * todo add end dragging
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
      const detail = {
        moveX: e.x - this[previousMoveEvent].x,
        moveY: e.y - this[previousMoveEvent].y,
        moveStartX: e.x - this[startEvent].x,
        moveStartY: e.y - this[startEvent].y,
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
        screenY: e.screenY
      };
      this[previousMoveEvent] = e;
      this.dispatchEvent(new CustomEvent("dragging", {bubbles: true, composed: true, detail}));
    }

    [stop](e) {
      this.releasePointerCapture(e.pointerId);
      this.removeEventListener("pointermove", this[moveListener]);
      this.removeEventListener("pointerup", this[stopListener]);
      this[startEvent] = undefined;
      this[previousMoveEvent] = undefined;
    }
  }
};