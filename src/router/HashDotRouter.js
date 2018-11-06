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

//depends on new URL, which IE must polyfill
//https://www.jsdelivr.com/package/npm/url-polyfill
/**
 *
 * @param e
 * @returns undefined if the click is not a link or the link is not highjacked
 *          otherwise, the {string} highjacked link.
 */
function linkHighJacker(e) {
  //1. skip all non-left single clicks
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented)
    return;

  for (let el = e.target; el; el = el.parentNode) {                 //IE and Edge does not support composedPath()
    //2. find the first <a href> in the event path
    if (el.nodeName !== "A" && el.nodeName !== "a")
      continue;
    //3a. skip 'download' and 'external'.
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external')
      return;
    let link = ((typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString') ?
      el.href.baseVal :
      el.getAttribute('href');
    //3b. skip '#...', 'mailto:...' and '' (empty)
    if (link.startsWith("#") || link.startsWith('mailto:') || "")
      return;
    //3c. skip x-origins
    let url = new URL(link, location);
    if (url.protocol !== location.protocol || url.port !== location.port || url.host !== location.host)
      return;
    e.preventDefault();
    return link;
  }
}