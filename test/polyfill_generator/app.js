(function () {
  (function polyfillFramework() {
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

  function loadScriptSync(url, pfc) {
    pfc && window.polyfill.await(pfc);
    var newScript = document.createElement('script');
    newScript.src = url;
    newScript.setAttribute("onload", "window.polyfill.runWhenReady('" + pfc + "');");
    document.write(newScript.outerHTML);
  }

  function loadScriptAsync(url, pfc) {
    pfc && window.polyfill.await(pfc);
    var newScript = document.createElement('script');
    newScript.src = url;
    newScript.addEventListener('load', function () {
      window.polyfill.runWhenReady(pfc)
    });
    document.head.appendChild(newScript);
  }

  var CE = !!window.customElements;
  var SD = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
  var TE = (function () {
    // no real <template> because no 'content' property (IE and older browsers)
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
  var PR = !!window.Promise;
  var AF = !!Array.from;
  var SYM = !!window.Symbol;
  var URL = !!window.URL;
  var WA = !!window.Element.animate;
  var PE = !!window.PointerEvent;
  (function expandCE() {
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
  })();
  !CE && loadScriptSync("https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-ce.js", "CE");
  !SD && loadScriptSync("https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd.js", "SD");
  !TE && loadScriptSync("https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js", "TE");
  !PR && loadScriptSync("https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js", "PR");
  !AF && loadScriptSync("https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js", "AF");
  !SYM && loadScriptSync("https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js", "SYM");
  !URL && loadScriptSync("https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js", "URL");
  !WA && loadScriptSync("https://cdnjs.cloudflare.com/ajax/libs/web-animations/2.3.1/web-animations.min.js", "WA");
  !PE && loadScriptAsync("https://code.jquery.com/pep/0.4.3/pep.js");
  (function waitForDOMLoaded() {
    if (document.readyState === "loading") {
      window.polyfill.await("DOMContentLoaded");
      window.addEventListener("DOMContentLoaded", function () {
        window.polyfill.runWhenReady("DOMContentLoaded");
      });
    } else {
      window.polyfill.runWhenReady();
    }
  })();
})();