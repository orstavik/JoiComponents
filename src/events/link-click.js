function filterLinkClicks(e) {
  if (e.metaKey)
    return;
  for (let el = e.target; el; el = el.parentNode) {
    if (el.nodeName === "A" || el.nodeName === "a" || el.nodeName === "AREA"){
      //start PriorEvent
      const linkClick = new CustomEvent("link-click", {bubbles: true, composed: true});
      //PriorEvent preventDefault wrapper (standard)
      linkClick.preventDefault = function(){
        e.preventDefault();
        e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
      };
      //PriorEvent preventDefault wrapper (addon)
      linkClick.preventDefaultBrowsingOnly = function(){
        e.preventDefault();
      };
      linkClick.stopTrailingClickEvent = function(){
        e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
      };
      return el.dispatchEvent(linkClick);
      //end PriorEvent
    }
  }
}
(window || document).addEventListener("click", e => filterLinkClicks(e), true);