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

  /**
   * Basic flow of the loader process:
   *
   * Step 1. Find out which if any web comp polyfills are needed
   * Step 2a. If a polyfill is needed, load it either
   *          sync:
   *          async:
   * Step 2b. If no polyfill is needed, and the document has completed loading,
   *          fire the ready event.
   * Step 2c. If no polyfill is needed, but the document has not completed loading,
   *          which might occur due to some strange stuff,
   *          then
   *
   * There are 4 flows the loader can take when booting up
   *
   * - Synchronous script, no polyfills needed
   *   - wait for `DOMContentLoaded`
   *   - run callbacks passed to `waitFor`
   *   - fire WCR event
   *
   * - Synchronous script, polyfills needed
   *   - document.write the polyfill bundle
   *   - wait on the `load` event of the bundle to batch Custom Element upgrades
   *   - wait for `DOMContentLoaded`
   *   - run callbacks passed to `waitFor`
   *   - fire WCR event
   *
   * - Asynchronous script, no polyfills needed
   *   - fire WCR event, as there could not be any callbacks passed to `waitFor`
   *
   * - Asynchronous script, polyfills needed
   *   - Append the polyfill bundle script
   *   - wait for `load` event of the bundle
   *   - batch Custom Element Upgrades
   *   - run callbacks pass to `waitFor`
   *   - fire WCR event
   */

  var polyfillsLoaded = false;
  var whenLoadedFns = [];
  var allowUpgrades = false;
  var flushFn;

  function pathForScript(scriptName, polyfillName) {
    var script = document.querySelector('script[src*="' + scriptName + '"]');
    return script.src.replace(scriptName, polyfillName);
  }

  function loadScriptSynch(url) {
    var newScript = document.createElement('script');
    newScript.src = url;
    // make sure custom elements are batched whenever parser gets to the injected script
    newScript.setAttribute('onload', 'window.WebComponents._batchCustomElements()');
    document.write(newScript.outerHTML);
    document.addEventListener('DOMContentLoaded', ready);
  }

  function loadScriptAsync(url) {
    var newScript = document.createElement('script');
    newScript.src = url;
    newScript.addEventListener('load', function () {
      asyncReady();
    });
    newScript.addEventListener('error', function () {
      throw new Error('Could not load polyfill bundle' + url);
    });
    document.head.appendChild(newScript);
  }

  function loadScript(url) {
    document.readyState === 'loading' ? loadScriptSynch(url) : loadScriptAsync(url);
  }

  function fireEvent() {
    window.WebComponents.ready = true;
    document.dispatchEvent(new CustomEvent('WebComponentsReady', {bubbles: true}));
  }

  function batchCustomElements() {
    if (window.customElements && customElements.polyfillWrapFlushCallback) {
      customElements.polyfillWrapFlushCallback(function (flushCallback) {
        flushFn = flushCallback;
        if (allowUpgrades) {
          flushFn();
        }
      });
    }
  }

  function asyncReady() {
    batchCustomElements();
    ready();
  }

  function ready() {
    // bootstrap <template> elements before custom elements
    if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
      HTMLTemplateElement.bootstrap(window.document);
    }
    polyfillsLoaded = true;
    runWhenLoadedFns().then(fireEvent);
  }

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

  //todo what is the difference between ready and polyfillsLoaded
  //todo should we have a polyfillsLoaded? that starts false and ends true when it is loaded?
  //todo when polyfillsLoaded is set to true, the runWhenLoadedFns(); should run,
  //todo and then the
  window.WebComponents = window.WebComponents || {
    ready: false,
    _batchCustomElements: batchCustomElements,
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

  // Feature detect which polyfill needs to be imported.
  var sd =
    'attachShadow' in Element.prototype &&
    'getRootNode' in Element.prototype &&
    !(window.ShadyDOM && window.ShadyDOM.force);

  var ce = window.customElements && !window.customElements.forcePolyfill;

  var te = (function () {
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

  var es5 = !window.Promise || !Array.from || !window.URL || !window.Symbol || te;

  if (!es5 && sd && ce && te) {
    //todo instead of using an internal property in addition to
    polyfillsLoaded = true;    //this is set in ready()?
    if (document.readyState === 'complete') {
      fireEvent();
    } else {
      // this script may come between DCL and load, so listen for both, and cancel load listener if DCL fires
      window.addEventListener('load', ready);
      window.addEventListener('DOMContentLoaded', function () {
        window.removeEventListener('load', ready);
        ready();
      })
    }
  } else if (es5) {       // NOTE: any browser that does not have template or ES6 features must load the full suite of polyfills.
    loadScript(pathForScript('webcomponents-loader.js', 'bundles/webcomponents-sd-ce-pf.js'));
  } else if (!sd && !ce) {
    loadScript(pathForScript('webcomponents-loader.js', 'bundles/webcomponents-sd-ce.js'));
  } else if (!sd) {
    loadScript(pathForScript('webcomponents-loader.js', 'bundles/webcomponents-sd.js'));
  } else if (!ce) {
    loadScript(pathForScript('webcomponents-loader.js', 'bundles/webcomponents-ce.js'));
  }
})();