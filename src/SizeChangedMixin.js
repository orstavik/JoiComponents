const contentRectCache = Symbol('contentRectCache');

class ResizeObserverRAF {
  constructor(cb) {
    this._rects = new Map();
    this._cb = cb;
    this._rafLoopInstance = this._rafLoop.bind(this);
  }

  observe(obj) {
    if (this._rects.size === 0)
      window.requestAnimationFrame(this._rafLoopInstance);
    this._rects.set(obj, undefined);
  }

  disconnect(obj) {
    this._rects.delete(obj);
    if (this._rects.size === 0)
      window.cancelAnimationFrame(this._rafLoopInstance);
  }

  _rafLoop() {
    const entries = [];
    for (let [obj, previousRect] of this._rects) {
      let nowRect = obj.getContentRect();
      if (nowRect !== previousRect) {
        entries.push({target: obj, contentRect: nowRect});  //find all elements with changed contentRect.
        this._rects.set(obj, nowRect);                      //and update cache
      }
    }
    this._cb(entries);                                          //run callback([{target, contentRect}]) on changes
    window.requestAnimationFrame(this._rafLoopInstance);        //check again next rAF
  }
}

const onlyOnSizeChangedOnAll = entries => {
  for (let entry of entries)
    entry.target.sizeChangedCallback(entry.contentRect);
};
const chromeResizeObserver = window.ResizeObserver ? new ResizeObserver(onlyOnSizeChangedOnAll) : undefined;
const rafResizeObserver = new ResizeObserverRAF(onlyOnSizeChangedOnAll);
const defaultResizeObserver = chromeResizeObserver || rafResizeObserver;

/**
 * All elements implementing SizeChangedMixin have changes in their _inner_ size observed.
 * "Inner size" is defined as "contentRect" in Chrome's ResizeObserver,
 * or clientWidth and clientHeight in other browsers.
 *
 * A. In Chrome, this is done using ResizeObserver. The ResizeObserver has the following limitations:
 * 1. must wait until the next frame to observe size changes.
 * 2. it does not observe {display: inline} elements.
 * 3. it runs three-order after layout in a special ResizeObserver que.
 *
 *
 * B. In other browsers, this is done in the requestAnimationQue.
 *
 * @param Base class that extends HTMLElement
 * @returns {SizeChangedMixin} class that extends HTMLElement
 */
export const SizeChangedMixin = function (Base) {
  return class SizeChangedMixin extends Base {

    constructor() {
      super();
      this[contentRectCache] = {width: 0, height: 0};
    }

    /**
     * Override this method to do actions when children changes.
     * todo remove sizeChangedCallback?
     *
     * @param rect
     */
    sizeChangedCallback(rect = {width: 0, height: 0}) {
      if (super.sizeChangedCallback) super.sizeChangedCallback(rect);
    }

    /**
     * The first run observation will not happen until the frame _after_ the element is connected.
     * If it is important to run sizeChangedCallback on the first connectedCallback, do it manually like this:
     * el.sizeChangedCallback(el.getContentRect()); //this.sizeChangedCallback(this.getContentRect());
     *
     * ATT!! sizeChangedCallback does not take into account css transforms. Neither in ResizeObserver nor rAF mode.
     * This is not a big problem as layout of the children are likely to want to be transformed with the parent,
     * and if you need to parse transform matrix, you can do still do it, but using your own rAF listener that
     * checks and parses the style.transform tag for changes.
     *
     * Problems with ResizeObserver:
     * 1. It does not allow us to observe directly after style.display = inline-block
     * 2. The DOMRect that ResizeObserver is slightly different from clientWidth and clientHeight.
     //todo check with the polyfills: Why ResizeObserver spec that clientWidth and clientHeight is not the same as clientRect. Confusing. Hard to polyfillish.     * Comment: ResizeObserverRAF does not have this problem (untested hypothesis).
     *
     * Problem 1 reasoning:
     *
     * 1. Custom elements' style are by default {display: "inline"}
     * 2. the ResizeObserver.observe ignores elements with {display: inline}
     * 3. when you set the this.style.display = "inline-block", the style and layout are not immediately updated.
     * 4. so, if ResizeObserver.observe(this) runs directly after this.style.display = "inline-block",
     *    it will still ignore this element as its display: inline has not yet updated to inline-block.
     * 5. But, by delaying the ResizeObserver.observe(this) to the coming requestAnimationFrame,
     *    it has updated the display property of this, and thus the .observe() will not ignore it.
     *
     * Or it is because:
     * 1. ResizeObserver.observe ignores elements not yet connected to the DOM
     * 2. Somewhere in Chrome, the element is still registered as notConnected
     * 3. By delaying the ResizeObserver.observe(this) to the coming requestAnimationFrame,
     *    the connectedCallback is completed, and thus the .observe() will not ignore it.
     */
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.style.display = "inline-block";
      window.requestAnimationFrame(() => defaultResizeObserver.observe(this));
      //todo the sizeChangedCallback filter to avoid calling twice for equal contentRect does not work for ResizeObserver due to error in calculation..
      // this.sizeChangedCallback(this.getContentRect());
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      defaultResizeObserver.disconnect(this);
    }

    //todo use RAF based observation if the display type is inline?? so if style changes to inline, switch automatically to rAF?

    //todo switch between RAF and ResizeObserver using attributes

    /**
     * returns the same object if clientWidth and clientHeight unchanged.
     */
    getContentRect() {
      const w = this.clientWidth;
      const h = this.clientHeight;
      if (this[contentRectCache].width !== w || this[contentRectCache].height !== h)
        this[contentRectCache] = {width: w, height: h};
      return this[contentRectCache];
    }
  }
};