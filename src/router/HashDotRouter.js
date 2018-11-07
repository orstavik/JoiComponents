import {HashDotMap} from "./HashDot.js";

export class HashDotsRouter {
  constructor(routes) {
    this.routes = {};
    this.rules = new HashDotMap(routes);
    window.addEventListener("hashchange", () => this._onHashchange());
    requestAnimationFrame(() => this._onHashchange());                    //startup routechange event at first rAF
  }

  _onHashchange() {
    if (this.routes.rootLink === window.location.hash)
      return;
    const newRoute = this.rules.interpret(window.location.hash);
    if (this.routes.rootLink !== newRoute.rootLink)
      window.dispatchEvent(new CustomEvent("routechange", {detail: this.routes = newRoute}));
    if (newRoute.rootLink !== window.location.hash)
      window.location.hash = newRoute.rootLink;
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