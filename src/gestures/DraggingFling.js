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
const start = Symbol("start");
const move = Symbol("move");
const end = Symbol("end");
const cancel = Symbol("cancel");

const cachedTouchAction = Symbol("cachedTouchAction");
const cachedUserSelect = Symbol("cachedUserSelect");
const cachedEvents = Symbol("cachedEvents");
const active = Symbol("active");

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

//todo add debouncer staticSetting, true by default??, and debounce
//todo add check that verifies that targetTouches.length === touches.length

//todo remove the startDetail??
function extendDetail(lastDetail, startDetail) {
  const distX = lastDetail.x - startDetail.x;
  const distY = lastDetail.y - startDetail.y;
  const distDiag = Math.sqrt(distX * distX + distY * distY);
  const durationMs = lastDetail.event.timeStamp - startDetail.event.timeStamp;
  return Object.assign({distX, distY, distDiag, durationMs}, lastDetail);
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
 * @returns {DraggingFling}
 */
export const DraggingFling = function (Base) {
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
      this[cachedTouchAction] = undefined;  //block touchAction
      this[cachedUserSelect] = undefined;   //block userSelection
      this[active] = 0;                     //0 = inactive, 1 = mouse, 2 = touch
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
     * todo it might be faster to implement it, so that the prototype chain is not searched for too long?
     * By default false and no draggingEvent, override this static method and return true to add events.
     * @returns {boolean} true to make the custom element dispatch dragging and fling events
     */
    // static get draggingEvent() {
    //   return false;
    // }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      // todo Unsure if I should block these actions or not..
      // this.style.touchAction = "none";                          //block touchAction
      // this.style.userSelect = "none";                           //block userSelect
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

    [mouseStart](event) {
      if (this[active])                   //this will be a second touch or button press
        return this[mouseStop](event, true);
      this[active] = 1;
      event.preventDefault();                                   //block defaultAction
      window.addEventListener("mousemove", this[mouseMoveListener]);
      window.addEventListener("mouseup", this[mouseStopListener]);
      this[start]({event, x: event.x, y: event.y});
    }

    [touchStart](event) {
      if (this[active])                   //this will be a second touch or button press
        return this[touchStop](event, true);
      this[active] = 2;
      event.preventDefault();                                   //block defaultAction
      const body = document.querySelector("body");              //block
      this[cachedTouchAction] = body.style.touchAction;         //block touchAction
      body.style.touchAction = "none";                          //block touchAction
      this[cachedUserSelect] = body.style.userSelect;           //block userSelect
      body.style.userSelect = "none";                           //block userSelect
      window.addEventListener("touchmove", this[touchMoveListener]);
      window.addEventListener("touchend", this[touchStopListener]);
      window.addEventListener("touchcancel", this[touchStopListener]);
      this[start]({event, x: event.targetTouches[0].pageX, y: event.targetTouches[0].pageY});
    }

    [start](detail) {
      this[cachedEvents] = [detail];
      this.draggingstartCallback && this.draggingstartCallback(detail);
      this.constructor.draggingEvent && this.dispatchEvent(new CustomEvent("draggingstart", {bubbles: true, detail}));
    }

    [mouseStop](e, abort) {
      e.preventDefault();                                       //block defaultAction
      window.removeEventListener("mousemove", this[mouseMoveListener]);
      window.removeEventListener("mouseup", this[mouseStopListener]);
      if (abort) {
        this[cancel]({event: e})
      } else {
        this[stop]({event: e, x: e.x, y: e.y});
      }
    }

    [touchStop](e, abort) {
      e.preventDefault();                                       //block defaultAction
      const body = document.querySelector("body");              //retreat
      body.style.touchAction = this[cachedTouchAction];         //retreat touchAction
      this[cachedTouchAction] = undefined;                      //retreat touchAction
      body.style.userSelect = this[cachedUserSelect];           //retreat userSelect
      this[cachedUserSelect] = undefined;                       //retreat userSelect
      window.removeEventListener("touchmove", this[touchMoveListener]);
      window.removeEventListener("touchend", this[touchStopListener]);
      window.removeEventListener("touchcancel", this[touchStopListener]);
      if (abort) {
        this[cancel]({event: e})
      } else {
        const lastMoveDetail = this[cachedEvents][this[cachedEvents].length - 1];
        this[stop]({event: e, x: lastMoveDetail.x, y: lastMoveDetail.y});
      }
    }

    [stop](detail) {
      this[active] = 0;
      this[fling](detail);
      this[cachedEvents] = undefined;
      this.draggingendCallback && this.draggingendCallback(detail);
      this.constructor.draggingEvent && this.dispatchEvent(new CustomEvent("draggingend", {bubbles: true, detail}));
    }

    [cancel](detail) {
      this[active] = 0;
      this[cachedEvents] = undefined;
      this.draggingcancelCallback && this.draggingcancelCallback(detail);
      this.constructor.draggingEvent && this.dispatchEvent(new CustomEvent("draggingcancel", {bubbles: true, detail}));
    }

    [mouseMove](event) {
      event.preventDefault();                                       //block defaultAction
      this[move]({event, x: event.x, y: event.y});
    }

    [touchMove](event) {
      event.preventDefault();                                       //block defaultAction
      this[move]({event, x: event.targetTouches[0].pageX, y: event.targetTouches[0].pageY});
    }

    [move](detail) {
      const prevDetail = this[cachedEvents][this[cachedEvents].length - 1];
      detail = extendDetail(detail, prevDetail);
      this[cachedEvents].push(detail);
      this.draggingCallback && this.draggingCallback(detail);
      this.constructor.draggingEvent && this.dispatchEvent(new CustomEvent("dragging", {bubbles: true, detail}));
    }

    [fling](detail) {
      const settings = this.constructor.flingSettings;
      const flingTime = detail.event.timeStamp - settings.minDuration;
      const flingStart = findLastEventOlderThan(this[cachedEvents], flingTime);
      if (!flingStart)
        return;
      detail = extendDetail(detail, flingStart);
      if (detail.distDiag < settings.minDistance)
        return;
      detail.angle = flingAngle(detail.distX, detail.distY);
      this.flingCallback && this.flingCallback(detail);
      this.constructor.draggingEvent && this.dispatchEvent(new CustomEvent("fling", {bubbles: true, detail}));
    }
  }
};