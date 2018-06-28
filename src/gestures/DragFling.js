const selectListener = Symbol("selectstartListener");

const touchStartListener = Symbol("downListener");
const touchMoveListener = Symbol("touchMoveListener");
const touchStopListener = Symbol("touchStopListener");

const mouseStartListener = Symbol("mouseStartListener");
const mouseMoveListener = Symbol("mouseMoveListener");
const mouseStopListener = Symbol("mouseStopListener");

const touchStart = Symbol("touchStart");
const touchMove = Symbol("touchMove");
const touchStop = Symbol("touchStop");

const mouseStart = Symbol("mouseStart");
const mouseMove = Symbol("mouseMove");
const mouseStop = Symbol("mouseStop");

const fling = Symbol("fling");
const move = Symbol("move");
const eventAndOrCallback = Symbol("callbackAndOrEvent");

const cachedEvents = Symbol("cachedEvents");
const active = Symbol("active");
const activeEventOrCallback = Symbol("activeEventOrCallback");

function findLastEventOlderThan(events, timeTest) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].event.timeStamp < timeTest)
      return events[i];
  }
  return null;
}

function flingAngle(x = 0, y = 0) {
  return ((Math.atan2(y, -x) * 180 / Math.PI) + 270) % 360;
}

//todo remove the startDetail??
function makeDetail(event, x, y, startDetail) {
  const distX = x - startDetail.x;
  const distY = y - startDetail.y;
  const distDiag = Math.sqrt(distX * distX + distY * distY);
  const durationMs = event.timeStamp - startDetail.event.timeStamp;
  return {event, x, y, distX, distY, distDiag, durationMs};
}

/*

This mixin allows to translate a sequence of mouse and touch events to reactive lifecycle hooks:
* `dragGestureCallback(startDetail, dragDetail)`<br>
* `flingGestureCallback(flingDetail)`.<br>
In order for mixin to support work with smartphones it was added touch events.
Also, to prevent the selection of text that was in the moved object, it was added `"selectstart"` event which fire `e.preventDefault`.
  Mixin contain 4 main function:
`[start](e)` - which fired when a pointing device button is pressed on an element by `"mousedown"` event
or touch points are placed on the touch surface (`"touchstart"` event).
`[move](e)` -  is fired when a pointing device (usually a mouse) is stert moving while over an element by
"touchmove" or "mousemove" events.
`[moved](e)` - trigger `dragGestureCallback(dragDetail)` which contain:
* distX - distanceX (Y)
* distY
* x  actual coordinates X (Y)
* y
* pointerevent
* startDragging<br>
`[end](e)` - can be triggered by four events:
`"touchend"` - is fired when one or more touch points are removed from the touch surface;
`"touchcancel"` - is fired when one or more touch points have been disrupted in an implementation-specific manner (for example, too many touch points are created).
`"mouseup"` - is fired when a pointing device button is released over an element.
`"mouseout"` - is fired when a pointing device (usually a mouse) is moved off the element that has the listener attached or off one of its children.

The first `[end](e)` calls `[fling](e)` which triggered `flingGestureCallback(flinfDetail)` only if the last dragging event moved minimum `50px` in one direction during the last `200ms`.
The minimum distance and duration can be changed using these properties on the element
```javascript
    .flingSettings.minDistance = 50;
    .flingSettings.minDuration = 200;
    .flingSettings.maxTouches: 3;
```
  `flingGestureCallback(flinfDetail)` contain:
  * angle: flingAngle(distX, distY),
* distX - distanceX (Y)
* distY
* diagonalPx
* durationMs
* flingX
* fling value (use for `style.left = flingX + 'px'`)
* flingY
* x
* xSpeedPxMs
*  y
* ySpeedPxMs<br>
Events Touch and mouse have different properties and to solve this problem, it was added `this[isTouchActive]`property which equals `true` whenever the touchdown is fired. If the `mousedown` event is fired `this[isTouchActive]` will be "false".
  The angle starts at 12 o'clock and counts clockwise from 0 to 360 degrees.
* up/north:     0
* right/east:  90
* down/south: 180
* left/west:  270
 * @param Base
 * @returns {DragFlingGesture}
 */
export const DragFlingGesture = function (Base) {
  return class extends Base {

    constructor() {
      super();
      this[selectListener] = e => e.preventDefault() && false;

      this[touchStartListener] = e => this[touchStart](e);
      this[touchMoveListener] = e => this[touchMove](e);
      this[touchStopListener] = e => this[touchStop](e);

      this[mouseStartListener] = e => this[mouseStart](e);
      this[mouseMoveListener] = e => this[mouseMove](e);
      this[mouseStopListener] = e => this[mouseStop](e);

      this[cachedEvents] = undefined;
      this[active] = 0;       //0 = inactive, 1 = mouse, 2 = touch
      this[activeEventOrCallback] = 0; //caches the result of static get dragFlingEventOrCallback() for each event sequence
    }

    /**
     * Default values are minDistance: 50, minDuration: 200
     * distance is px, duration ms.
     * @returns {{minDistance: number, minDuration: number}}
     */
    static get flingSettings() {
      return {minDistance: 50, minDuration: 200};
    }

    /**
     * By default it is only event
     * @returns {number} 0 = event+callback, 1 = only event, -1 = only callback
     */
    static get dragFlingEventOrCallback() {
      return 0;
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addEventListener("selectstart", this[selectListener]);
      this.addEventListener("touchstart", this[touchStartListener]);
      this.addEventListener("mousedown", this[mouseStartListener]);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeEventListener("selectstart", this[selectListener]);
      this.removeEventListener("touchstart", this[touchStartListener]);
      this.removeEventListener("mousedown", this[touchStartListener]);
    }

    [mouseStart](e) {
      if (this[active] === 2)
        return;
      this[active] = 1;
      this[activeEventOrCallback] = this.constructor.dragFlingEventOrCallback;
      window.addEventListener("mousemove", this[mouseMoveListener]);
      window.addEventListener("mouseup", this[mouseStopListener]);

      const detail = {event: e, x: e.x, y: e.y};
      this[cachedEvents] = [detail];
      this[eventAndOrCallback]("draggingstart", detail);
    }

    [touchStart](e) {
      if (this[active] === 1)
        return;
      if (this[active] === 2)   //this will be a second touch
        return this[touchStopListener]();
      this[active] = 2;
      this[activeEventOrCallback] = this.constructor.dragFlingEventOrCallback;
      window.addEventListener("touchmove", this[touchMoveListener]);
      window.addEventListener("touchend", this[touchStopListener]);
      window.addEventListener("touchcancel", this[touchStopListener]);
      const detail = {event: e, x: e.targetTouches[0].pageX, y: e.targetTouches[0].pageY};
      this[cachedEvents] = [detail];
      this[eventAndOrCallback]("draggingstart", detail);
    }

    [mouseStop](e) {
      this[fling](e, e.x, e.y);
      this[eventAndOrCallback]("draggingend", {event: e, x: e.x, y: e.y});

      window.removeEventListener("mousemove", this[mouseMoveListener]);
      window.removeEventListener("mouseup", this[mouseStopListener]);
      this[cachedEvents] = undefined;
      this[active] = 0;
      this[activeEventOrCallback] = undefined;
    }

    [touchStop](e) {
      const lastMoveDetail = this[cachedEvents][this[cachedEvents].length-1];
      const detail = {event: e, x: lastMoveDetail.x, y: lastMoveDetail.y};
      this[fling](detail.event, detail.x, detail.y);
      this[eventAndOrCallback]("draggingend", detail);

      window.removeEventListener("touchmove", this[touchMoveListener]);
      window.removeEventListener("touchend", this[touchStopListener]);
      window.removeEventListener("touchcancel", this[touchStopListener]);
      this[cachedEvents] = undefined;
      this[active] = 0;
      this[activeEventOrCallback] = undefined;
    }

    [mouseMove](e) {
      this[move](e, e.x, e.y);
    }

    [touchMove](e) {
      this[move](e, e.targetTouches[0].pageX, e.targetTouches[0].pageY);
    }

    [move](event, x, y) {
      const prevDetail = this[cachedEvents][this[cachedEvents].length - 1];
      const detail = makeDetail(event, x, y, prevDetail);
      this[cachedEvents].push(detail);
      this[eventAndOrCallback]("dragging", detail);
    }

    [fling](e, x, y) {
      const settings = this.constructor.flingSettings;
      let endTime = e.timeStamp;
      const flingTime = endTime - settings.minDuration;
      const flingStart = findLastEventOlderThan(this[cachedEvents], flingTime);
      if (!flingStart)
        return;
      const detail = makeDetail(e, x, y, flingStart);
      if (detail.distDiag >= settings.minDistance) {
        detail.angle = flingAngle(detail.distX, detail.distY);
        this[eventAndOrCallback]("fling", detail);
      }
    }

    [eventAndOrCallback](eventName, detail) {
      if (this[activeEventOrCallback] <= 0) {
        let cbName = eventName + "Callback";
        this[cbName] && this[cbName](detail);
      }
      if (this[activeEventOrCallback] >= 0)
        this.dispatchEvent(new CustomEvent(eventName, {bubbles: true, detail}));
    }
  }
};