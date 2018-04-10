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

  unobserve(obj) {
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
 * The purpose of this SizeChangedMixin is to provide a function hook that is triggered
 * everytime the size of the contentRectangle of the webcomponent changes, but only once per frame.
 * Such a hook has two primary use-cases:
 * 1. "web-component mediaquery": You need to change the innerDOM of an element based on its available screen size.
 * 2. You want to change some attributes of dependent elements (such as size or position) based on a combination of
 * size and/or content.
 *
 * All elements implementing SizeChangedMixin have changes in their _inner_ size observed.
 * "Inner size" is defined as "contentRect" in Chrome's ResizeObserver,
 * or "window.getComputedStyle(this).width+height".
 *
 * In Chrome, this is done using ResizeObserver. The ResizeObserver has the following limitations:
 * 1. it does not observe {display: inline} elements.
 * 2. it runs three-order after layout in a special ResizeObserver que.
 *
 * In other browsers, this is done in the requestAnimationQue.
 *
 * ATT!! sizeChangedCallback does not take into account css transforms. Neither in ResizeObserver nor rAF mode.
 * This is not a big problem as layout of the children are likely to want to be transformed with the parent,
 * and if you need to parse transform matrix, you can do still do it, but using your own rAF listener that
 * checks and parses the style.transform tag for changes.
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
     *
     * 2. The DOMRect that ResizeObserver is slightly different from clientWidth and clientHeight.
     * todo check with the polyfills: Do ResizeObserver contentRect differ from computed width height?
     *
     */
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.style.display = "inline-block";
      defaultResizeObserver.observe(this)
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      defaultResizeObserver.unobserve(this);
    }

    //todo use RAF based observation if the display type is inline?? so if style changes to inline, switch automatically to rAF?

    //todo switch between RAF and ResizeObserver using attributes

    /**
     * returns the same object if clientWidth and clientHeight unchanged (can be dirtychecked).
     */
    getContentRect() {
      const style = window.getComputedStyle(this);
      const width = style.width === "" ? 0 : parseFloat(style.width);
      const height = style.height === "" ? 0 : parseFloat(style.height);
      if (this[contentRectCache].width !== width || this[contentRectCache].height !== height)
        this[contentRectCache] = {width, height};
      return this[contentRectCache];
    }
  }
};