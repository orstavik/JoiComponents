const startListener = Symbol("touchStartListener");
const moveListener = Symbol("touchMoveListener");
const endListener = Symbol("touchEndListener");
const start = Symbol("touchStart");
const move = Symbol("touchMove");
const end = Symbol("touchEnd");
const spin = Symbol("spin");

const recordedEventDetails = Symbol("recordedEventDetails");
const cachedTouchAction = Symbol("cachedTouchAction");
const oneHit = Symbol("firstTouchIsAHit");

function calcAngle(x, y) {
  return ((Math.atan2(y, -x) * 180 / Math.PI) + 270) % 360;
}

function findLastEventOlderThan(events, timeTest) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].touchevent.timeStamp < timeTest)
      return events[i];
  }
  return null;
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
 * `PinchGesture` implement an extensive [InvadeAndRetreat!] strategy
 * to block default actions in the browsers such as "pinch-to-zoom".
 *
 * @param Base
 * @returns {PinchGesture}
 */
export const PinchGesture = function (Base) {
  return class extends Base {
    constructor() {
      super();
      this[recordedEventDetails] = undefined;
      this[cachedTouchAction] = undefined;                      //block touchAction
      this[oneHit] = false;

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

    static get spinSettings() {
      return {spinMotion: 50, spinDuration: 100};
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.style.touchAction = "none";                          //block touchAction
      this.addEventListener("touchstart", this[startListener]);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeEventListener("touchstart", this[startListener]);
    }

    [start](e) {
      const length = e.targetTouches.length;
      if (length > 2)
        return this[end](e);
      if (length === 1) {
        this[oneHit] = true;
        return;
      }
      if (length !== 2)
        throw new Error("omg?! how many fingers??");
      if (!this[oneHit])                                         //first finger was not pressed on the element, so this second touch is part of something bigger.
        return;
      e.preventDefault();                                       //block defaultAction
      const body = document.querySelector("body");              //block touchAction
      this[cachedTouchAction] = body.style.touchAction;         //block touchAction
      body.style.touchAction = "none";                          //block touchAction
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
      const detail = makeDetail(e);                             //block defaultAction
      this[recordedEventDetails].push(detail);
      this.pinchCallback && this.pinchCallback(detail);
      this.constructor.pinchEvent && this.dispatchEvent(new CustomEvent("pinch", {bubbles: true, detail}));
    }

    [end](e) {
      e.preventDefault();                                       //block defaultAction
      window.removeEventListener("touchmove", this[moveListener]);
      window.removeEventListener("touchend", this[endListener]);
      window.removeEventListener("touchcancel", this[endListener]);
      this[oneHit] = false;
      const body = document.querySelector("body");              //retreat touchAction
      body.style.touchAction = this[cachedTouchAction];         //retreat touchAction
      this[cachedTouchAction] = undefined;                      //retreat touchAction
      const detail = Object.assign({}, this[recordedEventDetails][this[recordedEventDetails].length - 1]);
      detail.touchevent = e;
      this[spin](e);
      this[recordedEventDetails] = undefined;
      this.pinchendCallback && this.pinchendCallback(detail);
      this.constructor.pinchEvent && this.dispatchEvent(new CustomEvent("pinchend", {bubbles: true, detail}));
    }

    [spin](event) {
      const settings = this.constructor.spinSettings;
      const spinTime = event.timeStamp - settings.spinDuration;
      const spinStart = findLastEventOlderThan(this[recordedEventDetails], spinTime);
      if (!spinStart)
        return;
      const detail = Object.assign({}, this[recordedEventDetails][this[recordedEventDetails].length - 1]);
      detail.touchevent = event;
      detail.xFactor = Math.abs(spinStart.width / detail.width);
      detail.yFactor = Math.abs(spinStart.height / detail.height);
      detail.diagonalFactor = Math.abs(spinStart.diagonal / detail.diagonal);
      detail.rotation = Math.abs(spinStart.angle - detail.angle);
      let lastspinMotion = Math.abs(detail.x1 - spinStart.x1) + (detail.y1 - spinStart.y1); //the sum of the distance of the start and end positions of finger 1 and 2
      if (lastspinMotion < settings.spinMotion)
        return;
      this.spinCallback && this.spinCallback(detail);
      this.constructor.pinchEvent && this.dispatchEvent(new CustomEvent("spin", {bubbles: true, detail}));
    }
  }
};