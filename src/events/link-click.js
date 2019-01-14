//link-click event starts here

//https://www.w3.org/html/wg/spec/content-models.html#interactive-content-0
//http://qaru.site/questions/10726/can-i-nest-a-button-element-inside-an-a-using-html5

//todo make this into a discussion in the chapter, explain how the default action of the click event
//todo is not hindered when interactive content is illegally put inside an <a href> tag and still
//todo displayed in the browser.

//https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
(function () {
  function filterClicks(e) {
    if (e.metaKey)
      return;
    for (let el = e.target; el; el = el.parentNode) {
//todo   if (elementCannotBeInALink(el)) return null; cannot be used here, as the default action of the event is not filtered for illegal composition in the DOM that the browser still chooses to render.
//tomax check how this works for submit.
      if (el.nodeName === "FORM")
        return null;
      if (el.nodeName === "A" || el.nodeName === "a" || el.nodeName === "AREA") {
        return [el, new CustomEvent("link-click", {bubbles: true, composed: true}), e];
      }
    }
    return null;
  }

  function dispatchPriorEvent([el, linkClick, e]) {
    if (!linkClick)
      return;
    linkClick.preventDefault = function () {
      e.preventDefault();
      e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
    };
    linkClick.trailingEvent = e;
    return el.dispatchEvent(linkClick);
  }

  (window || document).addEventListener("click", e => dispatchPriorEvent(filterClicks(e)), true);
})();