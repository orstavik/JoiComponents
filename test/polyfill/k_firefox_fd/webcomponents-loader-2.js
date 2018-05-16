/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function () {
  'use strict';

  function loadScriptAsync(url, onAsyncLoad) {
    var newScript = document.createElement('script');
    newScript.src = url;
    onAsyncLoad && newScript.addEventListener('load', onAsyncLoad);
    document.head.append(newScript);
  }

  function loadScriptSync(url, onAsyncLoadAsString) {
    var newScript = document.createElement('script');
    newScript.src = url;
    onAsyncLoadAsString && newScript.setAttribute("onload", onAsyncLoadAsString);
    document.write(newScript.outerHTML);
  }

  window.WebComponents = {
    waitFor: function (waitFn) {
      if (!waitFn)
        return;
      if (window.WebComponents._waitingFunctions) {
        window.WebComponents._waitingFunctions.push(waitFn);
      } else if (waitFn instanceof Function) {
        waitFn();
        customElements.upgrade(document);
      }
    },
    _waitingFunctions: [],
    flushWaitingFunctions: function () {
      window.WebComponents.pauseCustomElementsPolyfill();
      return Promise.all(window.WebComponents._waitingFunctions.map(function (fn) {
        return fn instanceof Function ? fn() : fn;
      })).then(function () {
        window.WebComponents._waitingFunctions = undefined;
        window.WebComponents.restartCustomElementsPolyfill();
      }).catch(function (err) {
        console.error(err);
      });
    },
    pauseCustomElementsPolyfill: function () {
      if (window.customElements && customElements.polyfillWrapFlushCallback)
        customElements.polyfillWrapFlushCallback(function () {
        });
    },
    restartCustomElementsPolyfill: function () {
      if (!window.customElements || !customElements.polyfillWrapFlushCallback)
        return;
      customElements.upgrade(document);
      customElements.polyfillWrapFlushCallback(function (originalFlushCallback) {
        originalFlushCallback();
      });
    },
    bootstrapTemplatePolyfill: function () {
      if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap)
        HTMLTemplateElement.bootstrap(window.document);
    }
  };

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
    window.WebComponentsPolyMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-sd-ce.js", function () {
        window.WebComponents.bootstrapTemplatePolyfill();
        window.WebComponents.flushWaitingFunctions();
      }) :
      loadScriptSync(wcBase + "webcomponents-sd-ce.js", "window.WebComponents.bootstrapTemplatePolyfill();window.WebComponents.flushWaitingFunctions();");
  } else if (!SD && !CE) {
    window.WebComponentsPolyMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-sd-ce.js", window.WebComponents.flushWaitingFunctions) :
      loadScriptSync(wcBase + "webcomponents-sd-ce.js", "window.WebComponents.flushWaitingFunctions();");
  } else if (!SD) {
    window.WebComponentsPolyMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-sd.js", window.WebComponents.flushWaitingFunctions) :
      loadScriptSync(wcBase + "webcomponents-sd.js", "window.WebComponents.flushWaitingFunctions();");
  } else if (!CE) {
    window.WebComponentsPolyMode === "async" ?
      loadScriptAsync(wcBase + "webcomponents-ce.js", window.WebComponents.flushWaitingFunctions) :
      loadScriptSync(wcBase + "webcomponents-ce.js", "window.WebComponents.flushWaitingFunctions();");
  }
})();