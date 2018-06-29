const startListener = Symbol("touchStartListener");
const moveListener = Symbol("touchMoveListener");
const endListener = Symbol("touchEndListener");
const start = Symbol("touchStart");
const move = Symbol("touchMove");
const end = Symbol("touchEnd");

const recordedEventDetails = Symbol("recordedEventDetails");
const cachedTouchAction = Symbol("cachedTouchAction");

function calcAngle(x, y) {
  return ((Math.atan2(y, -x) * 180 / Math.PI) + 270) % 360;
}

function makeDetail(touchevent) {
  const f1 = touchevent.targetTouches[0];
  const f2 = touchevent.targetTouches[1];
  const x1 = f1.pageX;
  const y1 = f1.pageY;
  const x2 = f2.pageX;
  const y2 = f2.pageY;
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  const diagonal = Math.sqrt(width * width + height * height);
  const angle = calcAngle(x1 - x2, y1 - y2);
  return {touchevent, x1, y1, x2, y2, diagonal, width, height, angle};
}

/**
 * PinchGesture mixin.
 * PinchGesture records a sequence of two-finger touchstart, touchmove
 * and touchend events into a series of pinch and spin events.
 * The PinchGesture mixin only reacts when only two fingers are used.
 * If three fingers touches the screen, the EventRecording is cancelled.
 * 
 * PinchGesture can be used for two finger gestures such as:
 *  - pinch
 *  - expand
 *  - rotate
 *  - two-finger drag
 * 
 * If both the two fingers are removed from the screen while in motion,
 * a spin-event is triggered. The spin event resembles the fling event.
 * 
 * PinchGesture has the following *optional* reactive callback methods:
 *  - pinchstartCallback({touchevent, x1, y1, x2, y2, diagonal, width, height, angle})
 *  - pinchCallback({touchevent, x1, y1, x2, y2, diagonal, width, height, angle})
 *  - pinchendCallback({touchevent, x1, y1, x2, y2, diagonal, width, height, angle}) [1]
 *  - spinCallback({touchevent, diagonal, width, height, angle, duration})
 * 
 * PinchGesture has the following StaticSettings:
 *  - pinchEvent: true => mixin will also dispatch the following events
 *     - pinchstart:  {touchevent, x1, y1, x2, y2, diagonal, width, height, angle}
 *     - pinch:       {touchevent, x1, y1, x2, y2, diagonal, width, height, angle}
 *     - pinchend:    {touchevent, x1, y1, x2, y2, diagonal, width, height, angle} [1]
 *     - spin:        {touchevent, diagonal, width, height, angle, duration}
 *
 * [1] pinchend coordinates are copied from the last successful pinch.
 *
 * @param Base
 * @returns {PinchGesture}
 */
export const PinchGesture = function (Base) {
  return class extends Base {
    constructor() {
      super();
      this[recordedEventDetails] = undefined;
      this[cachedTouchAction] = undefined;

      this[startListener] = (e) => this[start](e);
      this[moveListener] = (e) => this[move](e);
      this[endListener] = (e) => this[end](e);
    }

    /**
     * By default it is only callback, if this staticSetting is true, dispatch event too
     * @returns {boolean} true => di
     */
    // static get pinchEvent() {
    //   return false;
    // }

    // static get spinDuration() {
    //   return 50;    //to max: we need probably a smaller number here than on fling..
    // }

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
      if (this[recordedEventDetails] !== undefined)  //this must be more than two fingers
        return this[end](e);
      if (e.targetTouches.length !== 2)              //this must be only one finger
        return;
      e.preventDefault();
      // const body = document.querySelector("body");
      // this[cachedTouchAction] = body.style.touchAction;
      // body.style.touchAction = "none";                       //max1
      window.addEventListener("touchmove", this[moveListener]);
      window.addEventListener("touchend", this[endListener]);
      window.addEventListener("touchcancel", this[endListener]);
      const detail = makeDetail(e);
      this[recordedEventDetails] = [detail];
      this.pinchstartCallback && this.pinchstartCallback(detail);
      this.constructor.pinchEvent && this.dispatchEvent(new CustomEvent("pinchstart", {bubbles: true, detail}));
    }

    [move](e) {
      e.preventDefault();
      const detail = makeDetail(e);
      this[recordedEventDetails].push(detail);
      this.pinchCallback && this.pinchCallback(detail);
      this.constructor.pinchEvent && this.dispatchEvent(new CustomEvent("pinch", {bubbles: true, detail}));
    }

    [end](e) {
      e.preventDefault();
      //todo add the fling calculations for spin both rotation, pinch and doubledrag
      //todo we use this[recordedEventDetails] to calculate spin on rotation and scalefling for scaling
      window.removeEventListener("touchmove", this[moveListener]);
      window.removeEventListener("touchend", this[endListener]);
      window.removeEventListener("touchcancel", this[endListener]);
      //const body = document.querySelector("body");
      // body.style.touchAction = this[cachedTouchAction];                       //max1
      // this[cachedTouchAction] = undefined;
      const detail = this[recordedEventDetails][this[recordedEventDetails].length-1];
      detail.touchevent = e;
      this[recordedEventDetails] = undefined;
      this.pinchendCallback && this.pinchendCallback(detail);
      this.constructor.pinchEvent && this.dispatchEvent(new CustomEvent("pinchend", {bubbles: true, detail}));
    }
  }
};