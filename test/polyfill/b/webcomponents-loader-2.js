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

  var polyfillsLoaded = false;
  var whenLoadedFns = [];
  var allowUpgrades = false;
  var flushFn;

  function runWhenLoadedFns() {
    allowUpgrades = false;
    var done = function () {
      allowUpgrades = true;
      whenLoadedFns.length = 0;
      flushFn && flushFn();
    };
    return Promise.all(whenLoadedFns.map(function (fn) {
      return fn instanceof Function ? fn() : fn;
    })).then(function () {
      done();
    }).catch(function (err) {
      console.error(err);
    });
  }

  window.WebComponents = window.WebComponents || {
    ready: false,
    _batchCustomElements: function() {
      if (window.customElements && customElements.polyfillWrapFlushCallback) {
        customElements.polyfillWrapFlushCallback(function (flushCallback) {
          flushFn = flushCallback;
          if (allowUpgrades) {
            flushFn();
          }
        });
      }
    },
    waitFor: function (waitFn) {
      if (!waitFn) {
        return;
      }
      whenLoadedFns.push(waitFn);
      if (polyfillsLoaded) {
        runWhenLoadedFns();
      }
    }
  };

  var newScript = document.createElement('script');
  // Load it from the right place.
  newScript.src = "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce.js";
  // make sure custom elements are batched whenever parser gets to the injected script
  newScript.setAttribute('onload', 'window.WebComponents._batchCustomElements()');
  document.write(newScript.outerHTML);
  document.addEventListener('DOMContentLoaded', function(){
    // bootstrap <template> elements before custom elements
    if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
      HTMLTemplateElement.bootstrap(window.document);
    }
    polyfillsLoaded = true;
    runWhenLoadedFns();
  });
})();
