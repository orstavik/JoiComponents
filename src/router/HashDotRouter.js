import {HashDots as Dots, HashDotMap} from "./HashDot.js";

export const HashDots = Dots;
export class HashDotsRouter {
  constructor(routes) {
    this.middle = undefined;
    this.left = undefined;
    this.right = undefined;
    this.lastEvent = null;
    this.rules = new HashDotMap(routes);
    window.addEventListener("hashchange", () => this._onHashchange());
    //dispatch an initial routechange event at the first raf after startup
    requestAnimationFrame(() => this._onHashchange());
  }

  _onHashchange() {
    let currentHash = window.location.hash;
    if (this.middle === currentHash || this.left === currentHash || this.right === currentHash)
      return window.location.hash = this.left;
    const middle = HashDots.parse(currentHash).left;
    let left = this.rules.left(middle);
    let leftStr = left.map(dot => dot.toString()).join("");
    if (leftStr === this.left)
      return window.location.hash = this.left;
    let right = this.rules.right(middle);
    this.left = leftStr;
    this.right = right.map(dot => dot.toString()).join("");
    this.middle = currentHash;
    this.lastEvent = {left, middle, right};
    window.location.hash = leftStr;
    window.dispatchEvent(new CustomEvent("routechange", {detail: this.lastEvent}));
  }
}


/**
 * Handle "click" events.
 */

/* jshint +W054 */
function on_click (e) {
  if (1 !== this._which(e)) return;

  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (e.defaultPrevented) return;

  // ensure link
  // use shadow dom when available if not, fall back to composedPath()
  // for browsers that only have shady
  var el = e.target;
  var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

  if(eventPath) {
    for (var i = 0; i < eventPath.length; i++) {
      if (!eventPath[i].nodeName) continue;
      if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
      if (!eventPath[i].href) continue;

      el = eventPath[i];
      break;
    }
  }

  // continue ensure link
  // el.nodeName for svg links are 'a' instead of 'A'
  while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
  if (!el || 'A' !== el.nodeName.toUpperCase()) return;

  // check if link is inside an svg
  // in this case, both href and target are always inside an object
  var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

  // Ignore if tag has
  // 1. "download" attribute
  // 2. rel="external" attribute
  if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

  // ensure non-hash for the same path
  var link = el.getAttribute('href');
  if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

  // Check for mailto: in the href
  if (link && link.indexOf('mailto:') > -1) return;

  // check target
  // svg target is an object and its desired value is in .baseVal property
  if (svg ? el.target.baseVal : el.target) return;

  // x-origin
  // note: svg links that are not relative don't call click events (and skip page.js)
  // consequently, all svg links tested inside page.js are relative and in the same origin
  if (!svg && !this.sameOrigin(el.href)) return;

  // rebuild path
  // There aren't .pathname and .search properties in svg links, so we use href
  // Also, svg href is an object and its desired value is in .baseVal property
  var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

  path = path[0] !== '/' ? '/' + path : path;

  // strip leading "/[drive letter]:" on NW.js on Windows
  if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
    path = path.replace(/^\/[a-zA-Z]:\//, '/');
  }

  // same page
  var orig = path;
  var pageBase = this._getBase();

  if (path.indexOf(pageBase) === 0) {
    path = path.substr(pageBase.length);
  }

  if (this._hashbang) path = path.replace('#!', '');

  if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
    return;
  }

  e.preventDefault();
  this.show(orig);
};