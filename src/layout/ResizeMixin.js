const contentRectCache = Symbol('contentRectCache');
const resizeObserver = Symbol('resizeObserverInstance');

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
    this._cb(entries);                                      //run callback([{target, contentRect}]) on changes
    window.requestAnimationFrame(this._rafLoopInstance);    //check again next rAF
  }
}

const onlyOnSizeChangedOnAll = entries => {
  for (let entry of entries)
    entry.target.resizeCallback(entry.contentRect);
};
const chromeResizeObserver = window.ResizeObserver ? new ResizeObserver(onlyOnSizeChangedOnAll) : undefined;
const rafResizeObserver = new ResizeObserverRAF(onlyOnSizeChangedOnAll);

/**
 * ResizeMixin provides a callback method `resizeCallback(...)` that triggers
 * every time the size of a custom element's contentRectangle changes, max once per frame.
 * resizeCallback(...) has two primary use-cases:
 * 1. "custom element mediaquery": You want to adapt the shadowDOM of an element based on its size.
 * 2. You want to change some attributes of dependent elements (such as size or position) based on a combination of
 * size and/or content.
 *
 * All elements implementing ResizeMixin have changes in their _inner_ size observed.
 * "Inner size" is defined as "contentRect" in Chrome's ResizeObserver,
 * or "window.getComputedStyle(this).width" and ".height".
 *
 * In Chrome, this is done using ResizeObserver. The ResizeObserver has the following limitations:
 * 1. sometimes the contentRect is different from the getComputedStyle.width and .height values!! Why?? (see last test)
 * 2. it does not observe {display: inline} elements.
 * 3. it runs three-order after layout in a special ResizeObserver que.
 *
 * In other browsers, this is done in the requestAnimationQue.
 *
 * ATT!! resizeCallback does not take into account css transforms. Neither in ResizeObserver nor rAF mode.
 * This is not a big problem as layout of the children are likely to want to be transformed with the parent,
 * and if you need to parse transform matrix, you can do still do it, but using your own rAF listener that
 * checks and parses the style.transform tag for changes.
 *
 * @param Base class that extends HTMLElement
 * @returns {ResizeMixin} class that extends HTMLElement
 */
export const ResizeMixin = function (Base) {
  return class ResizeMixin extends Base {

    constructor() {
      super();
      this[contentRectCache] = {width: 0, height: 0};
      this[resizeObserver] = chromeResizeObserver || rafResizeObserver;
    }

    /**
     * Override this method to do actions when children changes.
     * @param rect
     */
    //todo change signature to simple resizeCallback(width, height, oldWidth, oldHeight) ??
    //todo ResizeObserver returns a rect, but that is unnecessary complex. Not much, but just that little bit.
    //todo also, if I have the old values cached, I should return that here so that the user don't have to.
    // resizeCallback(rect = {width: 0, height: 0}) {
    //   if (super.resizeCallback) super.resizeCallback(rect);
    // }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.style.display = "inline-block";
      this[resizeObserver].observe(this)
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this[resizeObserver].unobserve(this);
    }

    /**
     * Forces style update if cachedOnly is false.
     * @params cachedOnly if true, returns the last contentRect from cache, and will not trigger getComputedStyle.
     * @returns {{width: getComputedStyle(this).width, height: getComputedStyle(this).height}}
     *          returns the same object if contentRect is unchanged (dirtychecking viable).
     */
    getContentRect(cachedOnly) {
      if (cachedOnly)
        return this[contentRectCache];
      const style = window.getComputedStyle(this);
      const width = style.width === "" ? 0 : parseFloat(style.width);
      const height = style.height === "" ? 0 : parseFloat(style.height);
      if (this[contentRectCache].width !== width || this[contentRectCache].height !== height)
        this[contentRectCache] = {width, height};
      return this[contentRectCache];
    }

    /**
     * Not implemented as it is unlikely that it will be very useful.
     * Only makes sense in browsers that support "ResizeObserver"
     * @param {"ResizeObserver" || "requestAnimationFrame"} name
     * @returns true if the switch was successful, false if no switch was or could be made
     */
    // changeResizeObserver(name = "requestAnimationFrame") {
    //   if ((name === "requestAnimationFrame" && this[resizeObserver] === rafResizeObserver) ||
    //     (name === "ResizeObserver" && this[resizeObserver] === chromeResizeObserver))
    //     return false;
    //
    //   this[resizeObserver].unobserve(this);
    //   if (name === "requestAnimationFrame") {
    //     this[resizeObserver] = rafResizeObserver;
    //     this[resizeObserver].observe(this);
    //     return true;
    //   } else if (chromeResizeObserver && name === "ResizeObserver") {
    //     this[resizeObserver] = chromeResizeObserver;
    //     this[resizeObserver].observe(this);
    //     return true;
    //   }
    //   return false;
    // }
  }
};