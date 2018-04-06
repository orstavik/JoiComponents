class ResizeObserverRAF {
  constructor(cb) {
    this._boundingRects = new Map();
    this._contentRects = new Map();
    this._paddings = new Map();
    this._cb = cb;
    this._rafLoopInstance = this._rafLoop.bind(this);
  }

  observe(obj) {
    this._boundingRects.set(obj, null);
    if (this._boundingRects.length === 1)
      window.requestAnimationFrame(this._rafLoopInstance);
  }

  disconnect(obj) {
    this._boundingRects.delete(obj);
    if (this._boundingRects.length === 0)
      window.cancelAnimationFrame(this._rafLoopInstance);
  }

  _rafLoop() {
    //first, find all elements where the boundingClientRect OR the padding style have changed.
    const altered = [];
    for (let obj of this._boundingRects.keys()) {
      const currentBoundingRect = obj.getBoundingClientRect();
      const previousBoundingRect = this._boundingRects.get(obj);
      const currentPadding = obj.style.padding;
      const previousPadding = this._paddings.get(obj);
      let diffBoundingRect = ResizeObserverRAF.diffRect(currentBoundingRect, previousBoundingRect);
      let diffPadding = ResizeObserverRAF.diffPadding(currentPadding, previousPadding);
      if (!diffBoundingRect && !diffPadding)
        continue;
      altered.push(obj);
      if (diffBoundingRect)
        this._boundingRects.set(obj, currentBoundingRect);
      if (diffPadding)
        this._paddings.set(obj, currentBoundingRect);
    }
    //second, filter the list to remove all rects that have not changed contentBox (ie. they have only moved or similar)
    //ATT!! This method relies on .getContentRect() being added to the HTMLElement observed.
    const entries = [];
    for (let obj of altered) {
      const currentContentBox = obj.getContentRect();
      const previousContentBox = this._contentRects.get(obj);
      if (ResizeObserverRAF.diffRect(currentContentBox, previousContentBox)) {
        this._contentRects.set(obj, currentContentBox);
        entries.push({target: obj, contentRect: currentContentBox});
      }
    }
    //third, run the callback([{target, contentRect}]) on the objs that have changed contentRect
    this._cb(entries);

    //finally, run again next rAF
    window.requestAnimationFrame(this._rafLoopInstance);
  }

  static diffRect(a, b) {
    return !b || a.width !== b.width || a.height !== b.height || a.top !== b.top || a.left !== b.left;
  }

  static diffPadding(currentPadding, previousPadding) {
    //todo make this one, don't know how padding looks..
    throw new Error("wtf?! do something");
  }
}

const sizeChangedOnAll = entries => {
  for (let entry of entries)
    entry.target.sizeChangedCallback(entry.contentRect);
};
const sizeChangedCallbackObserver = window.ResizeObserver ? new ResizeObserver(sizeChangedOnAll) : new ResizeObserverRAF(sizeChangedOnAll);

//todo switch between RAF and ResizeObserver using attributes
/**
 * todo this does not work with "display: inline"
 * todo works with inline-block, block, flex, grid, probably more. Make a complete list
 *
 * @param Base class that extends HTMLElement
 * @returns {SizeChangedMixin} class that extends HTMLElement
 */
export const SizeChangedMixin = function (Base) {
  return class SizeChangedMixin extends Base {

    /**
     * Override this method to do actions when children changes.
     * todo remove sizeChangedCallback?
     *
     * @param rect
     */
    sizeChangedCallback(rect) {
      if (super.sizeChangedCallback) super.sizeChangedCallback(rect);
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.style.display = "inline-block";
      window.requestAnimationFrame(() => sizeChangedCallbackObserver.observe(this));
      //There is a strange race condition when setting style and calling ResizeObserver.observe().
      //By delaying the observe call until the next RAF, the style of the element has updated and the observe()
      //will be registered.
      //TODO test how it is to change the display type during observation??
      //todo use RAF based observation if the display type is inline??
      this.sizeChangedCallback(this.getContentRect());
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      sizeChangedCallbackObserver.disconnect(this);
    }

    getContentRect() {
      const boundBox = this.getBoundingClientRect();
      const padding = this.style.padding;
      let pr = 0;
      let pl = 0;
      let pb = 0;
      let pt = 0;
      if (padding) {
        pr = parseFloat(padding.right);
        pl = parseFloat(padding.left);
        pb = parseFloat(padding.bottom);
        pt = parseFloat(padding.top);
      }
      return {
        width: boundBox.right - boundBox.left - pl - pr,
        height: boundBox.bottom - boundBox.top - pt - pb,
        top: pt,
        left: pl
      };
    }
  }
};