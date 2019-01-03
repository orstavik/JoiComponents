/**
 * https://html.spec.whatwg.org/multipage/links.html#following-hyperlinks
 *
 * Browse event is set up using "global event composition".
 * 1. Listen for
 *    1. click-to-browse events. click-to-browse events are click events that come from
 *       `<a href="...">` (both in HTML and inline SVG) and `<area href="">` elements.
 *    2. submit events. `submit` events come from `<form>` elements.
 * 3. Dispatch browse event.
 *
 * click-to-browse and submit events can be triggered by:
 * a. The user clicking on an element that is inside an `<a href="...">`, `<area href="">`, or `<input type="button">` element.
 * b. The user pressing enter when the element is in focus or using an accesskey which will trigger a click event on the element.
 * c. A script simulating user action via APIs such as `click()` and `.dispatchEvent(new MouseEvent("click", ...))`.
 *
 * The `browse` event wraps around the original event so
 * that `.preventDefault()` and `.defaultPrevented` will work as expected.
 *
 * The `browse` event:
 *  * .bubbles: true,
 *  * .composed: true,
 *
 * The `browse` event has the following custom properties:
 *  * .method: "POST" or "GET"
 *  * .target: the `<a href>` or `<form>` that defines the browse
 *  * .base(): the base for the navigation.
 *  * .url(): the url object of the navigation, ie. the resolved 'href' or 'action'.
 *  * .target(): name of the target frame, download included
 *  (only <a> and <area>)
 *  * .relList: link relationship options, see https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
 *  (only <form>-submits)
 *    //* .targetDocument(): the target document for the navigation (usually the main document, but it can also be an iframe).
 *    //* .download: the download option
 *  * .encryptionType: (only <form>-submits) the method of encryption of `<form>`-submit "POST" content
 *  * .elements: (only <form>-submits) the DOM elements with "POST" content for `<form>`-submit, both "POST" and "GET"
 *    //* .data: should I change the elements and suffix to become just data??
 *    // suffix would be {"123,234": undefined} "123,234" is the x and y coordinates.
 *    // which would be added as something.html?123,234 or something.html?query=this&123,234 todo check out this last problem.
 *    .internal getter that returns true if the browse event is within the web page.
 *    .external getter that returns true if the browse event is external to the web page.
 *
 * A browse event can contain both POST data and GET query parameters.
 * This is 'wrong', but who knows what some servers need.
 *
 * todo 5. start to see which browser specific problems we are going to encounter.
 *
 * ATT!! There is one caveat:
 * When <form> submissions are triggered by the `HTMLFormElement.submit()` method,
 * no navigation event will be triggered. `HTMLFormElement.submit()` has a custom
 * logic that specifically makes bypass any validation and event processing to be
 * executed no matter what.
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
 * Answer 2: Listen for click and submit events on the window/iframe document.
 * Click events must be filtered by retracing one or more steps in the event path starting from the target.
 * Go back to the iframe from which it came, to discover the appropriate target frame,
 * in order to discover the appropriate BASE from where to interpret the link.
 * Drawback 2:
 * the event path is traversed twice.
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

//This is a good thing, the event.target would then be the appropriate a href.
//If the navigation detail is changed, then the receiver would/should be able to alter the data of the request.
//The form data are stored as references to the form elements. Updating that would implicitly mean to alter the form elements themselves.
//The same is true of a href. An alternative would be to make a hidden copy of the navigation event as a temporary a or form
//and then populate that one. That would make the navigation request complete. The limits would be that the navigation event should not be
//listened for on the window, as the task is generated at that point. It should be listened for at window.document.
//That would make it a polyfill.
//
//The question being. Do I want to make a polyfill for something that does not yet exist?
//The point of the thing would be that I would get a navigation event that I could alter the content of the event, and
//not the linked HTMLs. This is much more in line with HTML composeability. The template stays fixed, while the dynamics
//of the DOM and elements are realized as DOM events. This is the best behavior.
//
//To alter an event is to for example wrap it.
//
//When you have internal navigation control, and then an event is triggered.
//If something alters the content of this event, such as ismap, then you don't want to update the href prop of the
//original a href element. That would be wrong. What you would like is to have an event with data that would be
//alterable. And then if this event completes, then you would like to make it navigate at that point.
//
//A means to is to make the event return the default if not an overriding value is set.
//It is a class with many getters and setters.
//if there is no set value, then use the existing one.
//once the event goes to action, then the updated values are transferred to the original target, and then executed.

//download should be a target, not a property by itself.
//if you have the target _self or _blank or.
//if you have an external target, you could try to find that _top or _parent or _name browsing context.
//from an iframe, you can do this. Or should I just let it pass..
//
//rel I don't think the navigate event should process, external norefferer etc is for the router itself.
//
//todo make a navigate(request) function. It needs all the potential stuff to make a form submit.
//todo it needs the href/action, suffix from ismap, target (that eats download), elements which is a key/value set,
//todo method (post/get), encryptionStyle, relList.
//
//if the navigate is triggered without an event.target, then either a <form> or a <a> is created and clicked.
//  in this case, the new a or form is also added to a skip_processing_this_target property, thus
//  making sure it is not double processed.
//else if the navigate is triggered on <a>, but the event is changed to post, then a <form> is created.
//else if the navigate is triggered on <form> or a <a>, then that target values is updated, and
//the event is just let pass by.

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
    // let parentDocument = getParentDocument(originDocument);
    for (let pd = originDocument; pd; pd = getParentDocument(pd)) {
      let nearestFrame = window.document.querySelector("iframe[name='" + frameName + "']");
      if (nearestFrame)
        return nearestFrame.document;
    }
    return null;
  }
}

function getTargetAttribute(el) {
  const res = el.getAttribute("target");
  if (res)
    return res;
  let base = el.ownerDocument.querySelector("base[target]");
  return base ? base.getAttribute("target") : "";
}

//wrapper pattern for altering an event going in the DOM
class BrowseEvent extends Event {
  constructor(orig, target) {
    super("beforeNavigate", {target: target, bubbles: orig.bubbles, composed: true});
    this.orig = orig;
    this.suffix = orig.target.nodeName === "IMG" && orig.target.hasAttribute("ismap") ?
      "?" + orig.offsetX + "," + orig.offsetY :
      "";
  }

  preventDefault() {
    return this.orig.preventDefault();
  }

  get defaultPrevented() {
    return this.orig.defaultPrevented;
  }

  get relList() {
    return this.target.relList || (this.target.rel ? this.target.rel.trim().split(" ") : []);
  }

  //  https://html.spec.whatwg.org/multipage/semantics.html#get-an-element's-target
  sourceDocument() {
    return this.target.ownerDocument;
  }

  get download() {
    return this.target.hasAttribute("download");
  }

  get method() {
    return this.target.method || "GET";
  }

  targetFrameDocument() {
    let source = this.target.ownerDocument;
    let noopener = this.target.relList.contains("noopener") || this.target.relList.contains("noreferrer");
    let targetAttribute = getTargetAttribute(this.target);
    return findBrowsingContext(targetAttribute, source, noopener);
  }

  //method to get the target of the link
  //method to get the target document object if possible.

  // baseHref() {
  //   const targetDocument = this.targetFrameDocument();
  //   const base = targetDocument.querySelector("base[href]");
  //   return (base || window.location).href;
  // }
  //
  baseHref2() {
    const b = this.target.ownerDocument.querySelector("base[href]");
    return b ? b.getAttribute("href") : undefined;
  }

  getFormUrl() {
    const a = new URL(this.target.action);
    if (this.method.toUpperCase() === "GET") {
      //2. Test show that: if you have a <form action="index.html?query=already#hash" method="get">,
      //the query, but not the hash, will be overwritten by the values in the form when Chrome interprets the link.
      a.search = "";
      let elements = this.elements;
      for (let el of elements) {
        if (el.hasAttribute("name"))
          a.searchParams.append(el.name, el.value);
      }
    }
    return a.href;
  }

  getLinkUrl() {
    let a = this.target.href;
    if (a.animVal)
      a = a.animVal;
    //https://www.w3.org/html/wg/spec/text-level-semantics.html#text-level-semantics
    a += this.suffix;
    //1. Tests show that the isMap ?x,y value is added at the end of the link **raw**, ie. it is not parsed in as a query.
    //this means that if you have an <a href="index.html?query=a#hash"> around an <img isMap>, then
    //when you click on point x=12, y=34 on the <img> you get a link like this: "index.html?query=a#hash?12,34".
    return a;
  }

  get url() {
    let a = this.target.nodeName === "FORM" ? this.getFormUrl() : this.getLinkUrl();
    return new URL(a, this.baseHref2());
  }

  get elements() {
    return this.target.elements;
  }

  encryptionType() {
    return this.target.encryptionType;
  }
}

//https://www.w3.org/html/wg/spec/content-models.html#interactive-content-0
//http://qaru.site/questions/10726/can-i-nest-a-button-element-inside-an-a-using-html5
//todo find above discussion in english
function elementCannotBeInALink(el) {
  return el.nodeName === "BODY" ||        //FIND MORE LIKE THIS!

    (el.nodeName === "AUDIO" && el.hasAttribute("controls")) ||
    (el.nodeName === "VIDEO" && el.hasAttribute("controls")) ||

    el.nodeName === "BUTTON" ||
    (el.nodeName === "INPUT" && el.getAttribute("type") !== "hidden") ||
    el.nodeName === "SELECT" ||
    el.nodeName === "TEXTAREA" ||
    el.nodeName === "KEYGEN" ||

    el.nodeName === "DETAILS" ||
    el.nodeName === "LABEL" ||
    el.nodeName === "EMBED" ||
    (el.nodeName === "OBJECT" /*&& el.hasAttribute("usemap")*/) || //todo, this will not trigger a click??
    el.nodeName === "IFRAME" ||
    (el.nodeName === "MENU" && el.getAttribute("type") === "toolbar"); //todo check the menu
}

//https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
function filterBrowseClicks(e) {
  if (e.metaKey)
    return;
  for (let el = e.target; el; el = el.parentNode) {
    if (elementCannotBeInALink(el))
      return;
    if (el.nodeName === "A" || el.nodeName === "a" || el.nodeName === "AREA")
      el.dispatchEvent(new BrowseEvent(e, el));
  }
}

function submitListener(e) {
  e.target.dispatchEvent(new BrowseEvent(e, e.target));
}

/**
 * You can't block the torpedoes.
 * 1. if the script uses .submit(), it cannot be controlled.
 * 2. if there are multiple iframes on the page, and one such iframe directs a navigation task to this document,
 *    it cannot be controlled.
 * 3. if the scripts uses `window.open()`, `location.assign()`, `history.pushState`, `history.replaceState`,
 *    it cannot be controlled.
 *
 * Don't use 1 and 2. If you do, it will not be part of the navigation.
 *
 * Use 3 as part of the navigation control only.
 */

function navigateEvent(doc) {
  doc.addEventListener("submit", submitListener);
  doc.addEventListener("click", filterBrowseClicks);
}

navigateEvent(window);