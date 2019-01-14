function dispatchPriorEvent([el, linkClick, e]) {
  if (!linkClick) return;
  linkClick.preventDefault = function () {
    e.preventDefault();
    e.stopImmediatePropagation? e.stopImmediatePropagation(): e.stopPropagation();
  };
  linkClick.trailingEvent = e;
  return el.dispatchEvent(linkClick);
}

function makeBasicNavigateEvent() {
  const browse = new CustomEvent("browse", {
    bubbles: true,
    composed: true
  });
  browse.getBaseHref = function () {
    const b = this.target.ownerDocument.querySelector("base[href]");
    return b ? b.getAttribute("href") : undefined;
  }.bind(browse);
  browse.getUrl = function () {
    return new URL(this.getHref(), this.getBaseHref());
  }.bind(browse);
  return browse;
}

function makeNavigateFromLinkClick(e) {
  const browse = makeBasicNavigateEvent();
  browse.getHref = function () {
    let href = this.target.href;
    //https://www.w3.org/html/wg/spec/text-level-semantics.html#text-level-semantics
    //1. Tests show that the isMap ?x,y value is added at the end of the link **raw**, ie. it is not parsed in as a query.
    //this means that if you have an <a href="index.html?query=a#hash"> around an <img isMap>, then
    //when you click on point x=12, y=34 on the <img> you get a link like this: "index.html?query=a#hash?12,34".
    if (e.target.nodeName === "IMG" && e.target.hasAttribute("ismap"))
      return href + "?" + e.offsetX + "," + e.offsetY;
    if (href.animVal) return href.animVal;
    return href;
  };
  return [e.target, browse, e];
}

function makeNavigateFromSubmit(e) {
  const browse = makeBasicNavigateEvent();
  browse.getHref = function (e) {
    const url = new URL(e.target.action);
    if (this.method.toUpperCase() === "GET") {
      //2. Test show that: if you have a <form action="index.html?query=already#hash" method="get">,
      //the query, but not the hash, will be overwritten by the values in the form when Chrome interprets the link.
      url.search = "";
      let elements = e.target.elements;
      for (let el of elements) {
        if (el.hasAttribute("name"))
          url.searchParams.append(el.name, el.value);
      }
    }
    return url.href;
  };
  return [e.target, browse, e];
}

var w = window || document;
w.addEventListener("submit", e => dispatchPriorEvent(makeNavigateFromSubmit(e)), true);
w.addEventListener("link-click", e => dispatchPriorEvent(makeNavigateFromLinkClick(e)), true);