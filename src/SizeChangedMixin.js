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
    //todo to make this function in the same way as the native ResizeObserver, i should move the getContentRect into the element and cache it??
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
    //todo if the element can skip saving different padding, then this can be done using dirtyChecking.
    throw new Error("wtf?! do something");
  }
}

const sizeChangedOnAll = entries => {
  for (let entry of entries)
    //todo cache here to check if the size is different than last time.. do i need to do that for ResizeObserver??
    entry.target.sizeChangedCallback(entry.contentRect);
};
const sizeChangedCallbackObserver = window.ResizeObserver ? new ResizeObserver(sizeChangedOnAll) : new ResizeObserverRAF(sizeChangedOnAll);

/**
 * The
 *
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

    /**
     * The first run observation will not happen until the frame _after_ the element is connected.
     * If it is important to run sizeChangedCallback on the first connectedCallback, do it manually like this:
     * el.sizeChangedCallback(el.getContentRect());
     * todo Is this true for ResizeObserverRAF too?
     *
     * Reasoning:
     * 1. Custom elements' style are by default {display: "inline"}
     * 2. the ResizeObserver.observe ignores elements with {display: inline}
     * 3. when you set the this.style.display = "inline-block", the style and layout are not immediately updated.
     * 4. so, if ResizeObserver.observe(this) runs directly after this.style.display = "inline-block",
     *    it will still ignore this element as its display: inline has not yet updated to inline-block.
     * 5. But, by delaying the ResizeObserver.observe(this) to the coming requestAnimationFrame,
     *    it has updated the display property of this, and thus the .observe() will not ignore it.
     */
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.style.display = "inline-block";
      window.requestAnimationFrame(() => sizeChangedCallbackObserver.observe(this));
      //todo this.sizeChangedCallback(this.getContentRect());
      //todo and then filter the sizeChangedCallback to avoid calling twice for equal contentRect
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      sizeChangedCallbackObserver.disconnect(this);
    }

    //TODO test how it is to change the display type during observation??

    //todo use RAF based observation if the display type is inline?? so if style changes to inline, switch automatically to rAF?

    //todo switch between RAF and ResizeObserver using attributes

    //todo make getPadding(forceUpdateBoolean)

    //todo make getContentRect(forceUpdateBoolean)

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