/**
 * https://html.spec.whatwg.org/multipage/links.html#following-hyperlinks
 *
 * Global event composition. We listen for click, keypress, and submit events, and then
 * we turn some of those events into beforeNavigate events.
 *
 * The `beforeNavigate` event intercepts navigation from:
 * 1. `<a href="...">`-links in both HTML and SVG documents,
 * 2. `<area href="">`-links in image maps, and
 * 3. `<form>`-submissions.
 *
 * The navigation can be initiated by:
 * a. the user clicking on element ,
 * b. pressing enter when the element is in focus or an accesskey which will trigger a click event on the element, or
 * c. scripts simulating such user action via APIs such as `click()`, `.dispatchEvent(...)`, etc.,
 * d. but not via .
 *
 * ATT!! There is one caveat:
 * When <form> submissions are triggered by the `HTMLFormElement.submit()` method,
 * no navigation event will be triggered. `HTMLFormElement.submit()` has a custom
 * logic that specifically makes bypass any validation and event processing to be
 * executed no matter what.
 *
 * The `beforeNavigate` event contains the following methods:
 *  * .preventDefault(): stops the browser from triggering its navigating behavior.
 *  * .url(): the url object of the navigation.
 *  * .base(): the base for the navigation.
 *  * .targetDocument(): the target document for the navigation (usually the main document, but it can also be an iframe).
 *  * .download: the download option
 *  * .relList: other options (undefined for `<form>`-submit)
 *  * .method: "GET" (default) | "POST" (always "GET" for `<a>` and `<area>` tags).
 *  * .encryptionType: the method of encryption of `<form>`-submit "POST" content (undefined for `<a>` and `<area>` tags).
 *  * .elements: the DOM elements with "POST" content for `<form>`-submit, both "POST" and "GET" (undefined for `<a>` and `<area>` tags).
 *  download: if true, the browser should download the resource instead of navigating to it (false by default)
 *  * relList: a list of strings with the `rel` properties   todo research
 *  * target: "_blank" | "_self"(default) | "_parent" | "_top" | frame-name
 *  //todo target: targetDocument?? Do we want to turn this into a reference to the actual document node??
 *  //todo I think yes. This requires a lot of processing of rel and target based on the DOM.
 *  * originalHref: a string with the href as it was given in the element
 *  * baseHref: the associated base href for the navigate event   todo research  .baseURI on the targetDocument()?
 *  * href: the resolved originalHref based on the baseHref
 *  * url: the href as a URL() object, that contains the protocol.
 *  * method: "get"(default) | "post" | "delete" | "put" | xxx  todo research
 *  * encryptionType: todo research
 *  * content: data from post request
 *  * todo maybe we want to add the navigating element: a, area form
 *  * todo are we missing some important aspects here??
 *
 * todo 1. A navigation request can contain both POST data and GET query parameters.
 *         This is 'wrong', but who knows what some servers need.
 * todo 2. set up the url object instead of the href, protocol.
 * todo 3. replace target with the actual element. write the algorithm for that. I think yes.
 *         make getTarget(), and then have the baseURI from that target() when you make the URL
 * todo 4. are there parts of the relList that can be removed once we know the target document? I think not.
 *         it is annoying that download is not part of the relList. I think the relList should be considered like options.
 * todo 5. start to see which browser specific problems we are going to encounter.
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

function makeDetailObject(download,
                          relList,
                          target,
                          originalHref,
                          baseHref,
                          href,
                          protocol,
                          method,
                          encryptionType) {
  return {
    download,
    relList,
    target,
    originalHref,
    baseHref,
    href,
    protocol,
    method,
    encryptionType
  };
}

function makeDetailHtmlA(el) {
  const method = "get";
  const protocol = el.protocol || this.href.substring(0, this.href.indexOf(":"));
  const href = el.href || new URL(this.originalHref, this.baseHref).href;
  const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
  const originalHref = el.getAttribute("href");
  const target = el.target || getTarget(el);
  const relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
  const download = el.download || el.hasAttribute("download");
  const encryptionType = "omgSomething";
  return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
}

function makeDetailSvgA(el) {
  const rel = el.getAttribute("rel");
  const originalHref = el.href.animVal;
  const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
  const href = new URL(originalHref, baseHref).href;
  const download = el.download || el.hasAttribute("download");
  const relList = rel ? rel.trim().split(" ") : [];
  const target = el.target || getTarget(el);
  const protocol = href.substring(0, href.indexOf(":"));
  const method = "get";
  const encryptionType = "omgSomething";
  return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
}

function makeDetailForm(el) {
  //todo do we need to validate the form data here?? I think not. research this.
  const relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
  const download = el.download || el.hasAttribute("download");
  const target = el.target || getTarget(el);
  const originalHref = el.getAttribute("href");
  const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
  const href = el.href;
  const protocol = el.protocol;
  const encryptionType = el.encryptionType || "default";
  const method = el.method || "get";
  // const content = process(el.elements);
  return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
}

function makeDetailArea(el) {
  // Let the hyperlink suffix be a U+003F QUESTION MARK character, the value of x expressed as a base-ten integer using ASCII digits,
  // a U+002C COMMA character (,), and the value of y expressed as a base-ten integer using ASCII digits.
  // ASCII digits are the characters in the range U+0030 DIGIT ZERO (0) to U+0039 DIGIT NINE (9).

  const download = el.download || el.hasAttribute("download");
  const target = el.target || getTarget(el);
  const originalHref = el.getAttribute("href");
  const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
  const href = el.href;
  const protocol = el.protocol;
  const method = "get";
  const relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
  const encryptionType = "omgSomething";
  return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
}

function makeNavigationDetail(el) {
  if (el.nodeName === "A")
    return makeDetailHtmlA(el);
  else if (el.nodeName === "a")
    return makeDetailSvgA(el);
  else if (el.nodeName === "AREA")
    return makeDetailArea(el);
  else
    return null;
}

function makeEvent(e, target, detail) {
  const res = new CustomEvent("beforeNavigate", {detail});
  res.target = target;
  res.preventDefault = () => e.preventDefault();
  res.defaultPrevented = e.defaultPrevented;
  res.bubbles = e.bubbles;  //todo check this
  res.baseURI = function(){
    return this.targetDocument().baseURI();
  };
  res.targetDocument = function(){
    return this.target.ownerDocument;
  };
  res.url = function(){
    return new URL(this.target.href, this.baseURI());
  };
  res.download = target.hasAttribute("download");
  res.relList = target.relList || (target.rel ? target.rel.trim().split(" ") : []);
  res.method = "GET";
  return res;
}

//https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
function filterClickForNavigation(e) {
  if (e.metaKey)
    return;
  for (let el = e.target; el; el = el.parentNode) {
    const detail = makeNavigationDetail(el);
    if (detail)
      return window.dispatchEvent(makeEvent(e, el, detail));
  }
}

function filterKeyPressForNavigation(e) {
  if (e.key !== "Enter" || e.metaKey)
    return;
  const detail = makeNavigationDetail(e.target);
  if (detail)
    window.dispatchEvent(makeEvent(e, e.target, detail));
}

function submitListener(e) {
  const event = makeEvent(e, e.target, makeDetailForm(e.target));
  event.method = e.target.method || event.method;
  event.elements = e.target.elements;
  event.encryptionType = e.target.encryptionType;
  window.dispatchEvent(event);
}

window.addEventListener("submit", submitListener);
window.addEventListener("click", filterClickForNavigation);
window.addEventListener("keypress", filterKeyPressForNavigation);