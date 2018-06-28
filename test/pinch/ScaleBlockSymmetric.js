import {PinchGesture} from '../../src/gestures/PinchSpin.js';

export class ScaleBlockSymmetric extends PinchGesture(HTMLElement) {

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
    this._startEventDiagonal = pinchDetail.diagonal;
  }

  pinchEvent(pinchDetail) {
    this.innerText = `scale: ${pinchDetail.diagonal / this._startEventDiagonal}`;
  }

  pinchstartCallback(pinchDetail) {
    this._startDiagonal = pinchDetail.diagonal;
  }

  pinchCallback(pinchDetail) {
    this.style.transform = `scale(${pinchDetail.diagonal / this._startDiagonal})`;
  }
}
