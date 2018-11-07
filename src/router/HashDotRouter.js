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

//todo pattern: how to make a link click that bubbles up to the window absolute in all browsers? document.baseURI??

export class SlashDotsRouter {
  constructor(routes) {
    this.routes = {};
    this.rules = new HashDotMap(routes);
    window.addEventListener("click", (ev) => {
      let filteredClick = linkHighJacker(ev);
      if (filteredClick)
        this._routeClick(filteredClick);
    });
    window.addEventListener("popstate", (ev) => this._routeClick(window.location));
    requestAnimationFrame(() => this._routeClick(window.location));   //startup routechange event at first rAF
  }

  makeAbsolute(link) {
    const url = new URL(link, document.baseURI).toString();
    return url.substr(document.baseURI.toString().length - 1);
  }

  _routeClick(link) {
    if (this.routes.rootLink === link)
      return;
    //1. find the tail of the link using the base.    //2. how to get the base
    debugger;
    let url = new URL(link, document.baseURI).toString();
    //2. exclude the base in order to get the tail
    url = url.substr(document.baseURI.toString().length - 1);
    const newRoute = this.rules.interpret(url);
    if (this.routes.rootLink !== newRoute.rootLink)
      window.dispatchEvent(new CustomEvent("routechange", {detail: this.routes = newRoute}));
    const locationOnServer = window.location.pathname + window.location.search + (window.location.hash || "");
    if (!locationOnServer.endsWith(newRoute.rootLink)) {
      const a = newRoute.rootLink.substring(1);
      history.pushState(undefined, undefined, new URL(a, document.baseURI).toString());
    }
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
    let url = new URL(link, document.baseURI);
    const base = new URL(document.baseURI);
    if (url.protocol !== base.protocol || url.port !== base.port || url.host !== base.host)
      return;
    e.preventDefault();
    return link;
  }
}