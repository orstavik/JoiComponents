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

  var url = "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce.js";
  // loadScriptAsync(url, function(){window.WebComponents.flushWaitingFunctions();});
  loadScriptSync(url, "window.WebComponents.flushWaitingFunctions();");

  // function onAsyncLoadWithTE() {
  //   window.WebComponents.bootstrapTemplatePolyfill();
  //   window.WebComponents.flushWaitingFunctions();
  // }
})();