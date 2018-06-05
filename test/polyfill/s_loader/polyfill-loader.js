/**
 * Step 1: set up generic polyfill framework
 */
(function () {
  'use strict';
  var que = [];
  var flaggs = [];
  window.polyfill = {
    ready: function (waitFn) {                 //returns true when the function is run
      if (!waitFn)
        return;
      if (que)
        return que.push(waitFn);
      if (!(waitFn instanceof Function))
        return;
      waitFn();
      return true;
    },
    runWhenReady: function (pf) {       //empties the que and returns a promise resolved when all is run
      if (flaggs.length > 0) {
        if (!pf)
          return;
        var index = flaggs.indexOf(pf);
        if (index > -1)
          flaggs.splice(index, 1);               //mutates flaggs
        else
          console.error("Check your polyfills.");
        if (flaggs.length > 0)
          return;
      }
      var q = que;
      que = undefined;
      return Promise.all(q.map(function (fn) {
        return fn instanceof Function ? fn() : fn;
      }));
    },
    await: function (pf) {
      flaggs.push(pf);
    }
  }
})();

(function () {
  'use strict';

  //step 2: Feature detection
  var SD =
    'attachShadow' in Element.prototype &&
    'getRootNode' in Element.prototype &&
    !(window.ShadyDOM && window.ShadyDOM.force);

  var CE = !!(window.customElements && !window.customElements.forcePolyfill);

  var TE = (function () {
    // no real <template> because no `content` property (IE and older browsers)
    var t = document.createElement('template');
    if (!('content' in t)) {
      return false;
    }
    // broken doc fragment (older Edge)
    if (!(t.content.cloneNode() instanceof DocumentFragment)) {
      return false;
    }
    // broken <template> cloning (Edge up to at least version 17)
    var t2 = document.createElement('template');
    t2.content.appendChild(document.createElement('div'));
    t.content.appendChild(t2);
    var clone = t.cloneNode(true);
    return clone.content.childNodes.length !== 0 &&
           clone.content.firstChild.content.childNodes.length !== 0;
  })();

  var ES6 = window.Promise && Array.from && window.URL && window.Symbol;

  var WA = !!window.Element.animate;

  var PE = !!window.PointerEvent;

  //step 3: Update polyfill framework to support CE and TE
  if (!CE) {       //customElements-polyfill extensions for polyfill object
    (function expandFrameworkForCEPolyfill() {
      //adding methods to stop and restart polyfill
      window.polyfill.pauseCustomElementsPolyfill = function () {
        if (window.customElements && customElements.polyfillWrapFlushCallback) {
          customElements.polyfillWrapFlushCallback(function () {
          });
          if (document.readyState === "loading")
            document.addEventListener("DOMContentLoaded", function () {
              customElements.upgrade(document);
            });
        }
      };
      window.polyfill.restartCustomElementsPolyfill = function () {
        if (!window.customElements || !customElements.polyfillWrapFlushCallback)
          return;
        customElements.polyfillWrapFlushCallback(function (fn) {
          fn();
        });
        customElements.upgrade(document);
      };

      //SuperFun around polyfill.runWhenReady to pauseCustomElementsPolyfill when flushing the que of functions.
      var origFlushQue = window.polyfill.runWhenReady;
      window.polyfill.runWhenReady = function (flag) {
        window.polyfill.pauseCustomElementsPolyfill();
        return Promise.resolve(
          origFlushQue(flag)
        ).then(function () {
          window.polyfill.restartCustomElementsPolyfill();
        }).catch(function (err) {
          console.error(err);
          window.polyfill.restartCustomElementsPolyfill();
        });
      };
    })();
  }
  if (!TE) {
    //SuperFun around polyfill.runWhenReady to bootstrap HTMLTemplates added to the DOM prior to the polyfill being loaded.
    (function expandFrameworkForTEPolyfill() {
      var origFlushQue = window.polyfill.runWhenReady;
      window.polyfill.runWhenReady = function (flag) {
        HTMLTemplateElement.bootstrap(window.document);
        return origFlushQue(flag);
      };
    })();
  }

  //step 4: set up methods for loading polyfill files async or sync
  function loadScriptAsync(url, onLoad) {
    var newScript = document.createElement('script');
    newScript.src = url;
    onLoad && newScript.addEventListener('load', onLoad);
    document.head.appendChild(newScript);
  }

  function loadScriptSync(url, onSyncLoadAsString) {
    var newScript = document.createElement('script');
    newScript.src = url;
    onSyncLoadAsString && newScript.setAttribute("onload", onSyncLoadAsString);
    document.write(newScript.outerHTML);
  }

  /**
   * @param url to the polyfill
   * @param polyfillCode, the polyfill.runWhenReady() will not run until this code has been removed from the polyfill flaggs.
   *        if no code added, the polyfill.runWhenReady() will not await this polyfill.
   */
  function loadPolyfill(url, polyfillCode) {
    if (polyfillCode)
      window.polyfill.await(polyfillCode);
    document.readyState === "loading" ?
      loadScriptSync(url, "window.polyfill.runWhenReady('" + polyfillCode + "');") :
      loadScriptAsync(url, () => window.polyfill.runWhenReady(polyfillCode));
  }

  //step 5: load polyfill based on feature
  var wcLoc = "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/";
  var waLoc = "https://cdnjs.cloudflare.com/ajax/libs/web-animations/2.3.1/";
  var peLoc = "https://code.jquery.com/pep/0.4.3/";

  if (SD && CE && ES6 && TE) {
    //no need to load WC polyfill
  } else if (!SD && !CE && ES6 && TE) {
    loadPolyfill(wcLoc + "webcomponents-sd-ce.js", "WC");
  } else if (!SD && ES6 && TE) {
    loadPolyfill(wcLoc + "webcomponents-sd.js", "WC");
  } else if (!CE && ES6 && TE) {
    loadPolyfill(wcLoc + "webcomponents-ce.js", "WC");
  } else if (!ES6 || !TE) {       // NOTE: any browser that does not have template or ES6 features must load the full suite of polyfills.
    loadPolyfill(wcLoc + "webcomponents-sd-ce-pf.js", "WC");
  }
  if (!WA) {
    loadPolyfill(waLoc + "web-animations.min.js", "WA");
  }
  if (!PE) {
    loadPolyfill(peLoc + "pep.js"/*, "PE"*/);
    // or add no polyfill name if you don't want the flush to wait for this particular polyfill.
  }
  window.polyfill.runWhenReady(); //[x]
})();