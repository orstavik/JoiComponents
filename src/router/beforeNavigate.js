/**
 * https://html.spec.whatwg.org/multipage/links.html#following-hyperlinks
 *
 * The `beforeNavigate` event intercepts navigation from:
 * 1. `<a href="...">`-links in both HTML and SVG documents,
 * 2. `<area href="">`-links in image maps, and
 * 3. `<form>`-submissions.
 *
 * The navigation can be initiated by:
 * a. the user clicking on element,
 * b. pressing enter when the element is in focus, or
 * c. scripts simulating such user action via APIs such as `click()`, `.dispatchEvent(...)`, etc.
 *
 * The `beforeNavigate` event contains an event `detail` with the following data:
 *  * download: if true, the browser should download the resource instead of navigating to it (false by default)
 *  * relList: a list of strings with the `rel` properties
 *  * target: "_blank" | "_self"(default) | "_parent" | "_top"
 *  * originalHref: a string with the href as it was given in the element
 *  * baseHref: the associated base href for the navigate event
 *  * href: the resolved originalHref based on the baseHref
 *  * protocol: the protocol for the resolved href
 *  * method: "get"(default) | "post"
 *  *
 */

//  https://html.spec.whatwg.org/multipage/semantics.html#get-an-element's-target
function getTarget(el) {
  if (el.target)
    return el.target;
  const res = el.getAttribute("target");
  if (res)
    return res;
  let base = el.ownerDocument.querySelector("base[target]");
  return base ? base.getAttribute("target") || "" : "";
}

function makeDetailHtmlA(el) {
  return {
    download: el.download || el.hasAttribute("download"),
    relList: el.relList || el.rel.trim().split(" "),    //todo do I need trim()?
    target: getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    href: el.href || new URL(this.originalHref, this.baseHref).href,
    protocol: el.protocol || this.href.substring(0, this.href.indexOf(":"))
  };
}

function makeDetailSvgA(el) {
  const rel = el.rel.trim() || el.getAttribute("rel").trim();   //todo do I need trim()?
  return {
    download: el.download || el.hasAttribute("download"),
    relList: rel ? rel.split(" ") : [],
    target: getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    href: el.href.animVal.href,
    protocol: el.href.animVal.protocol
  };
}

function makeDetailForm(el) {
  return {
    download: el.download || el.hasAttribute("download"),
    target: getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    resolvedHref: el.href,
    protocol: el.protocol,
    action: el.action,
    accesskey: el.accessKey,
    method: el.method,
    name: el.name,
  };
}

function makeDetailArea(el) {
  // Let the hyperlink suffix be a U+003F QUESTION MARK character, the value of x expressed as a base-ten integer using ASCII digits,
  // a U+002C COMMA character (,), and the value of y expressed as a base-ten integer using ASCII digits.
  // ASCII digits are the characters in the range U+0030 DIGIT ZERO (0) to U+0039 DIGIT NINE (9).

    return {
    download: el.download || el.hasAttribute("download"),
    target: getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    resolvedHref: el.href,
    protocol: el.protocol,
    action: el.action,
    accesskey: el.accessKey,
    method: el.method,
    name: el.name,
  };
}

function makeNavigationDetail(el) {
  if (el.nodeName === "A")
    return makeDetailHtmlA(el);
  else if (el.nodeName === "a")
    return makeDetailSvgA(el);
  else if (el.nodeName === "AREA")
    return makeDetailArea(el);
  else if (el.nodeName === "FORM")
    return makeDetailForm(el);
  return null;
}

function dispatchEventObject(e, detail) {
  const res = new CustomEvent("beforeNavigate", {detail});
  res.preventDefault = () => e.preventDefault();
  window.dispatchEvent(res);
}

function filterClickForNavigation(e) {
  if (e.metaKey)           //todo this i think is needed. Any modifying key will block the navigation I suspect.
    return;
  for (let el = e.target; el; el = el.parentNode) {
    const detail = makeNavigationDetail(el);
    if (detail)
      return dispatchEventObject(e, detail);
  }
}

function filterKeyPressForNavigation(e) {
  if (e.key !== "Enter" || e.metaKey)
    return;
  const detail = makeNavigationDetail(e.target);
  if (detail)
    dispatchEventObject(e, detail);
}

window.addEventListener("click", filterClickForNavigation);
window.addEventListener("keypress", filterKeyPressForNavigation);