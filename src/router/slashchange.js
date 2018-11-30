/**
 * baseURI polyfill
 * @depends Object.defineProperty
 ***/
(function (undefined) {

  if (Node in this && ('baseURI' in Node.prototype === false)) {
    Object.defineProperty(Node.prototype, 'baseURI', {
      get: function () {
        var base = (this.ownerDocument || this).querySelector('base[href]');
        return (base || window.location).href;
      },
      configurable: true,
      enumerable: true
    });
  }

}).call('object' === typeof window && window || 'object' === typeof self && self || 'object' === typeof global && global || {});

/**
 * isLinkClickWithinBase
 *
 * @depends Node.baseURI
 * @depends URL
 ***/
function isLinkClickWithinBase(e, base) {
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
    var absLink = new URL(link, base).href;
    return absLink.startsWith(base) ? absLink : undefined;
  }
}

function clickToSlashchange(e){
  let localLink = isLinkClickWithinBase(e, base);
  if (!localLink)
    return;
  e.preventDefault();
  window.dispatchEvent(new CustomEvent("slashchange", {detail: {base: base, link: localLink.substring(base.length)}}));
}

var base;
window.addSlashchangeEvent = function() {
  debugger;
  base = this.getAttribute("href");
  window.addEventListener("click", clickToSlashchange);
};