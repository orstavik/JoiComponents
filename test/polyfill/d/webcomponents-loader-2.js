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

  window.WebComponents1 = {
    waitFor: function (waitFn) {
      if (!waitFn)
        return;
      if (!this._waitingFunctions)
        return waitFn instanceof Function ? waitFn() : waitFn;
      this._waitingFunctions.push(waitFn);
    },
    _waitingFunctions: [],
    flushWaitingFunctions: function () {
      var tmp = this._waitingFunctions;
      this._waitingFunctions = undefined;
      return Promise.all(tmp.map(function (fn) {
        return fn instanceof Function ? fn() : fn;
      }));
    }
  };

  window.WebComponents2 = {
    _pausedCustomElementsFlushFn: undefined,
    pauseCustomElementsPolyfill: function () {
      if (!window.customElements || !customElements.polyfillWrapFlushCallback)
        return;
      customElements.polyfillWrapFlushCallback(function (originalFlushCallback) {
        this._pausedCustomElementsFlushFn = originalFlushCallback;
      });
    },
    restartCustomElementsPolyfill: function () {
      if (!window.customElements || !customElements.polyfillWrapFlushCallback || !this._pausedCustomElementsFlushFn)
        return;
      this._pausedCustomElementsFlushFn && this._pausedCustomElementsFlushFn();
      this._pausedCustomElementsFlushFn = undefined;
      customElements.polyfillWrapFlushCallback(function (originalFlushCallback) {
        originalFlushCallback();
      });
    }
  };

  window.WebComponents3 = {
    bootstrapTemplatePolyfill: function () {
      if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap)
        HTMLTemplateElement.bootstrap(window.document);
    }
  };

  var newScript = document.createElement('script');
  newScript.src = "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce.js";
  newScript.setAttribute('onload', 'window.WebComponents2.pauseCustomElementsPolyfill()');
  document.write(newScript.outerHTML);
  document.addEventListener('DOMContentLoaded', function () {
    window.WebComponents3.bootstrapTemplatePolyfill();
    window.WebComponents1.flushWaitingFunctions().then(
      window.WebComponents2.restartCustomElementsPolyfill
    );
  });
})();