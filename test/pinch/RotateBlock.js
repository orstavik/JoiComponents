import {PinchGesture} from '../../src/gestures/PinchSpin.js';

export class RotateBlock extends PinchGesture(HTMLElement) {

  static get dragFlingEventOrCallback() {
    return true;
  }

  constructor() {
    super();
    this._pinchstartListener = e => this.pinchstartEvent(e.detail);
    this._pinchListener = e => this.pinchEvent(e.detail);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pinchstart", this._pinchstartListener);
    this.addEventListener("pinch", this._pinchListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pinchstart", this._pinchstartListener);
    this.removeEventListener("pinch", this._pinchListener);
  }

  pinchstartEvent(pinchDetail) {
    const lastRotate = this.style.transform ? parseFloat(this.style.transform.substring(7)) : 0;
    this._startAngleEvent = lastRotate + pinchDetail.angle;
  }

  pinchEvent(pinchDetail) {
    console.log(pinchDetail.angle);
    this.innerText = `rotate(${this._startAngleEvent - pinchDetail.angle}deg)`;
  }

  pinchstartCallback(pinchDetail) {
    const lastRotate = this.style.transform ? parseFloat(this.style.transform.substring(7)) : 0;
    this._startAngle = lastRotate + pinchDetail.angle;
  }

  pinchCallback(pinchDetail) {
    this.style.transform = `rotate(${this._startAngle - pinchDetail.angle}deg)`;
  }
}