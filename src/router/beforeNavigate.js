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
 *
 * We cannot capture the HTMLFormElement.submit() method.
 * Triggering this method will bypass the beforeNavigate event. Unfortunately.
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit
 *
 * Problem 1: How to dispatch a navigation event from a custom element?
 * Answer 1: Make an <a href> or <form> inside the shadow dom of an element and "click()" it.
 * Drawback: Very verbose, very convoluted.
 *
 * Problem 2: How to intercept navigation events in a browser?
 * Answer 2: Listen for the more fundamental events of keypress and click on the window.
 * The event listener must then retrace the event path, go back to interpret the target.
 * Go back to the iframe from which it came, to discover the appropriate target frame,
 * in order to discover the appropriate BASE from where to interpret the link.
 * Drawback 2: the event path is traversed twice.
 * First up with the click, then again when the target and base is recalculated.

 * Proposal:
 * 1. add a navigate event with all the details necessary for the browser to interpret a navigation action/task.
 * 2. instead of having the click event travel all the way up to the window, and then be interpreted,
 *    have this new navigation event travel directly from the element (<a> and <form>) clicked.
 * 3. As this navigation event hits documents (the top level or iframes),
 *    its targets and base can be altered. This makes the process of interpreting the navigation
 *    action more akin to common conception.
 * 4. In order to preserve backward functionality, the navigation event does not replace the old "click()" event,
 *    but runs as a second process. This means that the existing click and keypress events first runs to completion,
 *    which can be stopped and altered as today, before a new navigation event is re-triggered from the target.
 *    This should preserve backwards compatibility for as long as needed.
 * 5. new custom elements that want can implement the new navigate event directly. This relieves them of the task of
 *    wrapping navigation in shadowDOM.
 * 6. New apps that want to listen to navigate can do so directly, without bothering with the click and keypress listeners.
 * 7. a. The proposal will support much simpler routing in SPA that use the path segments for within-app navigation.
 *    b. The proposal can support other navigation use cases such as
 *       1. white- or black-listing links on the navigation level, very useful when the content of the web app is
 *       not controlled by the developer, but either user or machine generated.
 *    c. The proposal will greatly simplify the standard and implementation of both browsers and apps long term.
 *    d. The proposal will be wastly more efficient for all usecases, as there will be no redundant filtering
 *       and processing of the clicks in JS that is also done in the "users follows a link" algorithm already performed by the browser.
 *
 *  navigate
 *
 *  Translate the navigate event and dispatch it not on the window, but
 *  on the triggering element (a, area, or form).
 *  Then, if there are documents, the documents can intercept and reroute the navigation to different targets and
 *  find the relevant base elements for that navigation event.
 *
 *  This can operate "post"-click in the beginning, thus allowing old websites with the clicks listeners that intercept
 *  navigation to be gradually faced out with newer browsers.
 *
 */

//  https://html.spec.whatwg.org/multipage/semantics.html#get-an-element's-target
function getTarget(el) {
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
    target: el.target || getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    href: el.href || new URL(this.originalHref, this.baseHref).href,
    protocol: el.protocol || this.href.substring(0, this.href.indexOf(":")),
    method: "get"
  };
}

function makeDetailSvgA(el) {
  const rel = el.getAttribute("rel");
  const origHref = el.href.animVal;
  const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
  const href = new URL(origHref, baseHref).href;
  return {
    download: el.download || el.hasAttribute("download"),
    relList: rel ? rel.trim().split(" ") : [],
    target: el.target || getTarget(el),
    originalHref: origHref,
    baseHref: baseHref,
    href: href,
    protocol: href.substring(0, href.indexOf(":")),
    method: "get"
  };
}

function makeDetailForm(el) {
  debugger;
  return {
    download: el.download || el.hasAttribute("download"),
    target: el.target || getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    resolvedHref: el.href,
    protocol: el.protocol,
    action: el.action,
    encriptionType: el.encriptionType || "default",
    method: el.method || "get",
    name: el.name,
  };
}

function makeDetailArea(el) {
  // Let the hyperlink suffix be a U+003F QUESTION MARK character, the value of x expressed as a base-ten integer using ASCII digits,
  // a U+002C COMMA character (,), and the value of y expressed as a base-ten integer using ASCII digits.
  // ASCII digits are the characters in the range U+0030 DIGIT ZERO (0) to U+0039 DIGIT NINE (9).

  return {
    download: el.download || el.hasAttribute("download"),
    target: el.target || getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    resolvedHref: el.href,
    protocol: el.protocol,
    action: el.action,
    method: "get",
    encriptionType: "someDefault",
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
  else if ((el.nodeName === "BUTTON" || el.nodeName === "INPUT") && el.type.toLowerCase() === "submit") {
    el = el.parentNode;
    while (el.nodeName !== "FORM")
      el = el.parentNode;
    return makeDetailForm(el);
  }
  return null;
}

function dispatchEventObject(e, detail) {
  const res = new CustomEvent("beforeNavigate", {detail});
  res.preventDefault = () => e.preventDefault();
  window.dispatchEvent(res);
}

//https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
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

function submitListener(e){
  console.log("yelo! " + e);
}

window.addEventListener("submit", submitListener);
window.addEventListener("click", filterClickForNavigation);
window.addEventListener("keypress", filterKeyPressForNavigation);