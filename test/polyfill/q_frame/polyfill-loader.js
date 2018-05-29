(function () {
  'use strict';

  var loadingMode = document.readyState === "loading" ? "sync" : "async";

  function loadScriptAsync(url, onAsyncLoad) {
    var newScript = document.createElement('script');
    newScript.src = url;
    onAsyncLoad && newScript.addEventListener('load', onAsyncLoad);
    document.head.appendChild(newScript);
  }

  function loadScriptSync(url, onAsyncLoadAsString) {
    var newScript = document.createElement('script');
    newScript.src = url;
    onAsyncLoadAsString && newScript.setAttribute("onload", onAsyncLoadAsString);
    document.write(newScript.outerHTML);
  }

  //step 1: Feature detection
  // Feature detect which polyfill needs to be imported.
  var SD =
    'attachShadow' in Element.prototype &&
    'getRootNode' in Element.prototype &&
    !(window.ShadyDOM && window.ShadyDOM.force);

  var CE = window.customElements && !window.customElements.forcePolyfill;

  var TE = (function () {
    // no real <template> because no `content` property (IE and older browsers)
    var t = document.createElement('template');
    if (!('content' in t)) {
      return true;
    }
    // broken doc fragment (older Edge)
    if (!(t.content.cloneNode() instanceof DocumentFragment)) {
      return true;
    }
    // broken <template> cloning (Edge up to at least version 17)
    var t2 = document.createElement('template');
    t2.content.appendChild(document.createElement('div'));
    t.content.appendChild(t2);
    var clone = t.cloneNode(true);
    return (clone.content.childNodes.length === 0 ||
      clone.content.firstChild.content.childNodes.length === 0);
  })();

  var ES6 = window.Promise && Array.from && window.URL && window.Symbol;

  var wcBase = "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/";

  //step 2: load polyfill based on feature

  if (SD && CE /*&& ES6 && TE*/) {                //any browser that support SD and CE, also support ES6 and TE
    window.WebComponents.flushWaitingFunctions();
  } else if (!ES6 || !TE) {       // NOTE: any browser that does not have template or ES6 features must load the full suite of polyfills.
    loadingMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-sd-ce-pf.js", function () {
        window.WebComponents.bootstrapTemplatePolyfill();
        window.WebComponents.flushWaitingFunctions();
      }) :
      loadScriptSync(wcBase + "webcomponents-sd-ce-pf.js", "window.WebComponents.bootstrapTemplatePolyfill();window.WebComponents.flushWaitingFunctions();");
  } else if (!SD && !CE) {
    loadingMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-sd-ce.js", window.WebComponents.flushWaitingFunctions) :
      loadScriptSync(wcBase + "webcomponents-sd-ce.js", "window.WebComponents.flushWaitingFunctions();");
  } else if (!SD) {
    loadingMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-sd.js", window.WebComponents.flushWaitingFunctions) :
      loadScriptSync(wcBase + "webcomponents-sd.js", "window.WebComponents.flushWaitingFunctions();");
  } else if (!CE) {
    loadingMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-ce.js", window.WebComponents.flushWaitingFunctions) :
      loadScriptSync(wcBase + "webcomponents-ce.js", "window.WebComponents.flushWaitingFunctions();");
  }
})();