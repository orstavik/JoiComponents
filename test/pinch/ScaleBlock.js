import {PinchGesture} from '../../src/gestures/PinchSpin.js';

export class ScaleBlock extends PinchGesture(HTMLElement) {

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
    this._startWidth = pinchDetail.width;
    this._startHeight = pinchDetail.height;
  }

  pinchEvent(pinchDetail) {
    const width = pinchDetail.width / this._startWidth;
    const height = pinchDetail.height / this._startHeight;
    this.innerText = `scaleX(${width}) scaleY(${height})`;
  }

  pinchstartCallback(pinchDetail) {
    this._startWidth = pinchDetail.width;
    this._startHeight = pinchDetail.height;
  }

  pinchCallback(pinchDetail) {
    const width = pinchDetail.width / this._startWidth;
    const height = pinchDetail.height / this._startHeight;
    this.style.transform = `scaleX(${width}) scaleY(${height})`;
  }
}