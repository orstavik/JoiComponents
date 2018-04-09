const lastContentRect = Symbol("lastContentRect");
const lastBoundBox = Symbol("lastBoundBox");
const padding = Symbol("style.padding");
const paddingAsNumbers = Symbol("style.padding.asNumbers");
const callSizeChangedIfSizeChanged = Symbol("callSizeChangedIfSizeChanged");
const contentRectCache = Symbol('contentRectCache');

function diffRect(a, b) {
  if (!a && !b)
    return false;
  if (!a || !b)
    return true;
  return a.width !== b.width || a.height !== b.height || a.top !== b.top || a.left !== b.left;
}

class ResizeObserverRAF {
  constructor(cb) {
    this._boundObjs = new Set();
    this._boundingRects = new WeakMap();
    this._paddings = new WeakMap();
    this._cb = cb;
    this._rafLoopInstance = this._rafLoop.bind(this);
  }

  observe(obj) {
    this._boundObjs.add(obj);
    if (this._boundObjs.length === 1)
      window.requestAnimationFrame(this._rafLoopInstance);
  }

  disconnect(obj) {
    this._boundObjs.delete(obj);
    if (this._boundObjs.length === 0)
      window.cancelAnimationFrame(this._rafLoopInstance);
  }

  _rafLoop() {
    //first, find all elements where the boundingClientRect OR the padding style have changed.
    const entries = [];
    for (let obj of this._boundObjs) {
      const currentBoundingRect = obj.getBoundingClientRect();
      const previousBoundingRect = this._boundingRects.get(obj);
      const currentPadding = window.getComputedStyle(obj).getPropertyValue("padding");
      const previousPadding = this._paddings.get(obj);
      let diffBoundingRect = diffRect(currentBoundingRect, previousBoundingRect);
      let diffPadding = currentPadding !== previousPadding;
      if (!diffBoundingRect && !diffPadding)
        continue;
      entries.push({target: obj, contentRect: obj.getContentRect()});
      if (diffBoundingRect)
        this._boundingRects.set(obj, currentBoundingRect);
      if (diffPadding)
        this._paddings.set(obj, currentBoundingRect);
    }
    //second, run the callback([{target, contentRect}]) on the objs that have changed contentRect
    this._cb(entries);

    //finally, run again next rAF
    window.requestAnimationFrame(this._rafLoopInstance);
  }
}


//this method filters out any calls that might trigger a resizeObserver, but that has not changed the contentRect.
const onlyOnSizeChangedOnAll = entries => {
  for (let entry of entries)
    entry.target[callSizeChangedIfSizeChanged](entry.contentRect);
};
const sizeChangedCallbackObserver = window.ResizeObserver ? new ResizeObserver(onlyOnSizeChangedOnAll) : new ResizeObserverRAF(onlyOnSizeChangedOnAll);

/**
 * All elements implementing SizeChangedMixin have changes in their size observed.
 *
 * A. In Chrome, this is done using ResizeObserver. The ResizeObserver has the following limitations:
 * 1. it does not observe {display: inline} elements.
 * 2. it runs three-order after layout in a special ResizeObserver que.
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
      this[contentRectCache] = undefined;
      this[padding] = undefined;
      this[paddingAsNumbers] = {top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0};
    }

    [callSizeChangedIfSizeChanged](rect) {
      if (diffRect(rect, this[contentRectCache]))
        this.sizeChangedCallback(this[contentRectCache] = rect);
    }

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
     *
     * Or is it because:
     * 1. ResizeObserver.observe ignores elements not yet connected to the DOM
     * 2. So you have to delay the call until after the element is finished connected,
     *    ie. until after the connectedCallback function is completed.
     * 3. By delaying the ResizeObserver.observe(this) to the coming requestAnimationFrame,
     *    the connectedCallback is completed, and thus the .observe() will not ignore it.
     */
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.style.display = "inline-block";
      // window.getComputedStyle(this);               //alt. 1: did not work
      // sizeChangedCallbackObserver.observe(this);   //alt. 1: did not work
      window.requestAnimationFrame(() => sizeChangedCallbackObserver.observe(this));
      //todo call at startup and then filter the sizeChangedCallback to avoid calling twice for equal contentRect
      // this[callSizeChangedIfSizeChanged](this.getContentRect());
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      sizeChangedCallbackObserver.disconnect(this);
    }

    //TODO test how it is to change the display type during observation??

    //todo use RAF based observation if the display type is inline?? so if style changes to inline, switch automatically to rAF?

    //todo switch between RAF and ResizeObserver using attributes

    getPaddingPixels() {
      let style = window.getComputedStyle(this);
      let pad = style.getPropertyValue("padding");
      if (this[padding] === pad)
        return this[paddingAsNumbers];
      let p = {
        top: parseFloat(style.getPropertyValue("padding-top") || 0),
        right: parseFloat(style.getPropertyValue("padding-right") || 0),
        bottom: parseFloat(style.getPropertyValue("padding-bottom") || 0),
        left: parseFloat(style.getPropertyValue("padding-left") || 0)
      };
      p.width = p.left + p.right;
      p.height = p.top + p.bottom;
      return this[paddingAsNumbers] = p;
    }

    getContentRect() {
      const prevBoundBox = this[lastBoundBox];
      const boundBox = this.getBoundingClientRect();
      const prevPadding = this[paddingAsNumbers];
      const padding = this.getPaddingPixels();
      //no changes, return previous contentRect
      if (prevPadding === padding && prevBoundBox === boundBox) //todo check if the boundBox changes or is immutable..
        return this[lastContentRect];
      //else
      return this[lastContentRect] = {
        width: boundBox.right - boundBox.left - padding.width,
        height: boundBox.bottom - boundBox.top - padding.height,
        top: padding.top,
        left: padding.left
      };
    }
  }
};