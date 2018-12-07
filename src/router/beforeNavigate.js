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
 *  * .bubbles: true,
 *  * .composed: true,
 *  * .relList: (only <a> and <area>) link relationship options, see https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
 *  * .method: (only <form>-submits) "GET" (default) | "POST"
 *  * .encryptionType: (only <form>-submits) the method of encryption of `<form>`-submit "POST" content
 *  * .elements: (only <form>-submits) the DOM elements with "POST" content for `<form>`-submit, both "POST" and "GET"
 *
 *
 * A navigation request can contain both POST data and GET query parameters.
 * This is 'wrong', but who knows what some servers need.
 *
 * todo 3. replace target with the actual element. write the algorithm for that. I think yes
 *         make getTarget(), and then have the baseURI from that target() when you make the URL
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

//todo question 1? should I dispatch the event from the el as the target?
//todo I would then be able to alter the properties of the navigation.
//todo That would only apply to the event if event.preventDefault().
//todo It would not have any effect if it went to the default action.


function makeNavigationEvent(el, e) {
  if (el.nodeName === "A") {
    const ev2 = makeEvent(e, el);
    //https://www.w3.org/html/wg/spec/text-level-semantics.html#text-level-semantics
    if (e.target.nodeName === "IMG" && e.target.hasAttribute("ismap")) {
      ev2.hyperlinkSuffix = function () {
        return "?" + e.offsetX + "," + e.offsetY;
      };
    }
    ev2.relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
    return ev2;
  } else if (el.nodeName === "a") {
    const ev2 = makeEvent(e, el);
    ev2.relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
    return ev2;
  } else if (el.nodeName === "AREA") {
    const ev2 = makeEvent(e, el);
    ev2.relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
    return ev2;
  } else {
    return null;
  }
}

function getParentDocument(current) {
  return current.parentNode && current.parentNode.ownerDocument ? current.parentNode.ownerDocument : null;
}

/**
 * https://html.spec.whatwg.org/multipage/browsers.html#the-rules-for-choosing-a-browsing-context-given-a-browsing-context-name
 *
 * This is a simplified version of the choosing-a-browsing-context algorithm.
 *
 * 1. <frame> and <frameset> are not supported as they are deprecated.
 * 2. There is no security checks imposed when the navigate event is created.
 *    Security is performed in the interpretation of the navigation event.
 *
 * @param frameName
 * @param originDocument
 * @returns {*}
 */
function findBrowsingContext(frameName, originDocument) {
  const target = frameName.toLowerCase();
  if (target === "_self" || target === "" || target === "_blank")
    return originDocument;
  else if (target === "_parent")
    return getParentDocument(originDocument) || originDocument;
  else if (target === "_top")
    return window.document;
  else {
    let parentDocument = getParentDocument(originDocument); //todo this is wastly simplified
    let target = window.document.querySelector("iframe[name='target']");
    if (target)
      chosen = target.document;
  }
  return chosen;
}

function getTargetAttribute(el) {
  const res = el.getAttribute("target");
  if (res)
    return res;
  let base = el.ownerDocument.querySelector("base[target]");
  return base ? base.getAttribute("target") : "";
}

function makeEvent(e, target) {
  const res = new CustomEvent("beforeNavigate", {bubbles: e.bubbles, composed: true});
  res.preventDefault = () => e.preventDefault();
  res.defaultPrevented = e.defaultPrevented;
  res.baseHref = function () {
    const targetDocument = this.browsingContext();
    const base = targetDocument.querySelector("base[href]");
    return (base || window.location).href;
  };
  //  https://html.spec.whatwg.org/multipage/semantics.html#get-an-element's-target
  res.browsingContext = function () {
    let source = el.ownerDocument;
    let noopener = el.relList.contains("noopener") || el.relList.contains("noreferrer");
    let targetAttribute = getTargetAttribute(el);
    let targetDocument = findBrowsingContext(targetAttribute, source, noopener);
    return targetDocument;
  };
  res.url = function () {
    let a = this.target.href;
    if (a.animVal)
      a = a.animVal;
    return new URL(a, this.baseHref());
  };
  res.download = target.hasAttribute("download");
  res.method = "GET";
  return res;
}

//https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
function filterClickForNavigation(e) {
  if (e.metaKey)
    return;
  for (let el = e.target; el; el = el.parentNode) {
    const ev2 = makeNavigationEvent(el, e);
    if (ev2)
      return el.dispatchEvent(ev2);
  }
}

function filterKeyPressForNavigation(e) {
  if (e.key !== "Enter" || e.metaKey)
    return;
  const ev2 = makeNavigationEvent(e.target, e);
  if (ev2)
    return e.target.dispatchEvent(ev2);
}

function submitListener(e) {
  const event = makeEvent(e, e.target);
  event.method = e.target.method || event.method;
  event.elements = e.target.elements;
  event.encryptionType = e.target.encryptionType;
  e.target.dispatchEvent(event);
}

window.addEventListener("submit", submitListener);
window.addEventListener("click", filterClickForNavigation);
window.addEventListener("keypress", filterKeyPressForNavigation);


// function getTarget(el) {
//   const res = el.getAttribute("target");
//   if (res)
//     return res;
//   let base = el.ownerDocument.querySelector("base[target]");
//   return base ? base.getAttribute("target") || "" : "";
// }
//
// function makeDetailObject(download,
//                           relList,
//                           target,
//                           originalHref,
//                           baseHref,
//                           href,
//                           protocol,
//                           method,
//                           encryptionType) {
//   return {
//     download,
//     relList,
//     target,
//     originalHref,
//     baseHref,
//     href,
//     protocol,
//     method,
//     encryptionType
//   };
// }
//
// function makeDetailHtmlA(el) {
//   const method = "get";
//   const protocol = el.protocol || this.href.substring(0, this.href.indexOf(":"));
//   const href = el.href || new URL(this.originalHref, this.baseHref).href;
//   const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
//   const originalHref = el.getAttribute("href");
//   const target = el.target || getTarget(el);
//   const relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
//   const download = el.download || el.hasAttribute("download");
//   const encryptionType = "omgSomething";
//   return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
// }
//
// function makeDetailSvgA(el) {
//   const rel = el.getAttribute("rel");
//   const originalHref = el.href.animVal;
//   const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
//   const href = new URL(originalHref, baseHref).href;
//   const download = el.download || el.hasAttribute("download");
//   const relList = rel ? rel.trim().split(" ") : [];
//   const target = el.target || getTarget(el);
//   const protocol = href.substring(0, href.indexOf(":"));
//   const method = "get";
//   const encryptionType = "omgSomething";
//   return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
// }
//
// function makeDetailForm(el) {
//   //todo do we need to validate the form data here?? I think not. research this.
//   const relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
//   const download = el.download || el.hasAttribute("download");
//   const target = el.target || getTarget(el);
//   const originalHref = el.getAttribute("href");
//   const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
//   const href = el.href;
//   const protocol = el.protocol;
//   const encryptionType = el.encryptionType || "default";
//   const method = el.method || "get";
//   // const content = process(el.elements);
//   return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
// }
//
// function makeDetailArea(el) {
//
//   const download = el.download || el.hasAttribute("download");
//   const target = el.target || getTarget(el);
//   const originalHref = el.getAttribute("href");
//   const baseHref = (el.ownerDocument.querySelector('base[href]') || window.location).href;
//   const href = el.href;
//   const protocol = el.protocol;
//   const method = "get";
//   const relList = el.relList || (el.rel ? el.rel.trim().split(" ") : []);
//   const encryptionType = "omgSomething";
//   return makeDetailObject(download, relList, target, originalHref, baseHref, href, protocol, method, encryptionType);
// }

/*
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
*/