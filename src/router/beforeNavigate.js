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
    resolvedHref: el.href || new URL(this.originalHref, this.baseHref).href,
    protocol: el.protocol || this.resolvedHref.substring(0, this.resolvedHref.indexOf(":"))
  };
}

function makeBeforeNavigateEventOfASVG(el) {
  const rel = el.rel.trim() || el.getAttribute("rel").trim();   //todo do I need trim()?
  return {
    download: el.download || el.hasAttribute("download"),
    relList: rel ? rel.split(" ") : [],
    target: getTarget(el),
    originalHref: el.getAttribute("href"),
    baseHref: (el.ownerDocument.querySelector('base[href]') || window.location).href,
    resolvedHref: el.href.animVal.href,
    protocol: el.href.animVal.protocol
  };
}

function makeNavigationDetail(el) {
  if (el.nodeName === "A")
    return makeDetailHtmlA(el);
  else if (el.nodeName === "a")
    return makeBeforeNavigateEventOfASVG(el);
  else if (el.nodeName === "AREA")
    return makeBeforeNavigateEventOfArea(el);
  else if (el.nodeName === "FORM")
    return makeBeforeNavigateEventOfForm(el);
  return null;
}

function dispatchEventObject(e, detail) {
  let res = new CustomEvent("beforeNavigate", {detail});
  res.preventDefault = () => e.preventDefault();
  window.dispatchEvent(res);
}

function filterClickForNavigation(e) {
  // if (e.button !== 0 || e.buttons.length !== 1)    //todo this is given by the spec. check if any of the browsers miss this
  //   return;
  if (e.metaKey || e.ctrlKey || e.shiftKey)           //todo this i think is needed. Any modifying key will block the navigation I suspect.
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