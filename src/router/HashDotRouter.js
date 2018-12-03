import {HashDotMap} from "./HashDot.js";

function stripQueryHash(url) {
  var q = url.indexOf("?");
  var h = url.indexOf("#");
  if (q === -1 && h === -1)
    return url;
  if (h === -1) return url.substring(0, q);
  if (q === -1) return url.substring(0, h);
  return url.substring(0, Math.min(q, h));
}

export function getBaseHref() {
  //todo this if clause is brittle, I have not fully researched this
  if (document.baseURI) {
    const s = stripQueryHash(document.baseURI);
    return s.substring(0, s.lastIndexOf("/") + 1);
  }
  var base = document.querySelector('base[href]');
  if (base)
    return base.href;
  return window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/';
}

/**
 * HighjackLink identifies on simple left-button clicks with no simultaneous keypresses
 * on <a>-links in HTML or SVG that point to a location within the specified base.
 *
 * The base is assumed to be a directory: a link without query or hash ending with slash.
 *
 * HighjackLink only works with does not check same origin of the base for interpreting the url.
 * Thus, this can be manipulated by the router.
 *
 * HighJackLink DOES not check for .defaultPrevented nor trigger .preventDefault() on any event.
 *
 * https://www.w3.org/TR/SVG2/linking.html#AElementHrefAttribute
 *
 * @param e
 * @param base
 * @returns {string} link as seen from the base when highjacked, otherwise undefined
 * @depends {URL} https://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 */
export function highjackLink(e, base) {
  //1. skip all non-left single clicks
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey)
    return;

  for (let el = e.target; el; el = el.parentNode) {                 //IE and Edge does not support composedPath()
    //2. find the first <a href> in the event path
    if (el.nodeName !== "A" && el.nodeName !== "a")
      continue;
    //3a. skip 'download' and 'external'.
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external')
      return;

    let link = typeof el.href !== 'object' || el.href.constructor.name !== 'SVGAnimatedString' ?
      el.getAttribute('href') :
      el.href.animVal;    //.animVal should always be the active reference of the link (not .baseVal as in Page.js).

    //3b. skip 'mailto:...', javascript:
    if (link.startsWith('mailto:') || link.startsWith('javascript:'))
      return;

    //3c. skip x-origins
    let absLink = new URL(link, base).href;
    if (!absLink.startsWith(base))
      return;
    e.preventDefault();
    return absLink;
  }
}

function interpret(newLocation, rules) {
  const query = rules.query(newLocation).reverse().ruleIsSubsetOfQuery().transform().recursive();
  let lefts = Array.from(query);
  let rights = Array.from(query.reset().reverse());
  let middle = query.original;
  let paths = lefts.reverse().concat([middle]).concat(rights);
  return {
    rootLink: paths[0].map(dot => dot.toString()).join(""),
    left: paths[0],
    middle,
    right: paths[paths.length - 1],
    paths
  };
}

export class HashDotsRouter {
  constructor(routes) {
    this.routes = {};
    this.rules = HashDotMap.make(routes);
    window.addEventListener("hashchange", () => this._navigate());
    requestAnimationFrame(() => this._navigate());                    //startup routechange event at first rAF
  }

  _navigate() {
    if (this.routes.rootLink === window.location.hash)
      return;
    const newRoute = interpret(window.location.hash, this.rules);
    if (this.routes.rootLink !== newRoute.rootLink)
      window.dispatchEvent(new CustomEvent("routechange", {detail: this.routes = newRoute}));
    if (newRoute.rootLink !== window.location.hash)
      window.location.hash = newRoute.rootLink;
  }
}

/**
 * @depends {URL, pushState} IE10-11 supports pushState, but not URL
 */
export class SlashDotsRouter {
  constructor(routes) {
    this.routes = {};
    this.rules = HashDotMap.make(routes);
    window.addEventListener("click", (ev) => {
      //If the click event has already been .defaultPrevented, the router does nothing.
      if (ev.defaultPrevented)
        return;
      const base = getBaseHref();
      let filteredClick = highjackLink(ev, base);
      if (filteredClick) {
        this._navigate(filteredClick, base);
        ev.preventDefault();
      }
    });
    window.addEventListener("popstate", (ev) => this._navigate(window.location.href, getBaseHref()));
    requestAnimationFrame(() => this._navigate(window.location.href, getBaseHref()));   //startup routechange event at first rAF
  }

  _navigate(full, base) {
    const baseXlastSlash = base.substr(0, base.length - 1);
    let link = full.substr(baseXlastSlash.length);
    if (this.routes.rootLink === link)
      return;
    const newRoute = interpret(window.location.hash, this.rules);
    if (this.routes.rootLink !== newRoute.rootLink)
      window.dispatchEvent(new CustomEvent("routechange", {detail: this.routes = newRoute}));
    const newFull = baseXlastSlash + newRoute.rootLink;
    if (window.location.href !== newFull) {
      history.pushState(undefined, undefined, newFull);
    }
  }
}