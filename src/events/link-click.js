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
      if (el.nodeName === "A" || el.nodeName === "a" || el.nodeName === "AREA")
        return el.hasAttribute("href") ? el : null;           //tomax research and confirm that we should filter out elements that does not have an href attribute
    }
    return null;
  }

  function dispatchPriorEvent(target, composedEvent, trigger) {
    if (!composedEvent || !target)
      return;
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  window.addEventListener("click", e => dispatchPriorEvent(
    filterClicks(e),
    new CustomEvent("link-click", {bubbles: true, composed: true}),
    e
  ), true);
})();