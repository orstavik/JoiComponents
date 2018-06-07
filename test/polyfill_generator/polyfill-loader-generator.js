'use strict';

/**
 * GENERIC RESOURCES
 */
function loadScriptAsyncReady(url, pfc) {
  pfc && window.polyfill.await(pfc);
  var newScript = document.createElement('script');
  newScript.src = url;
  newScript.addEventListener('load', function () {
    window.polyfill.runWhenReady(pfc)
  });
  document.head.appendChild(newScript);
}

function loadScriptAsyncNormal(url, pfc) {
  var newScript = document.createElement('script');
  newScript.src = url;
  newScript.addEventListener('load', function () {
    window.polyfill[pfc]();
  });
  document.head.appendChild(newScript);
}

function loadScriptSyncReady(url, pfc) {
  pfc && window.polyfill.await(pfc);
  var newScript = document.createElement('script');
  newScript.src = url;
  newScript.setAttribute("onload", "window.polyfill.runWhenReady('" + pfc + "');");
  document.write(newScript.outerHTML);
}

function loadScriptSyncNormal(url, pfc) {
  var newScript = document.createElement('script');
  newScript.src = url;
  newScript.setAttribute("onload", "window.polyfill['" + pfc + "']();");
  document.write(newScript.outerHTML);
}

function polyfillIsEmpty() {
  window.polyfill = {}
}

function polyfillHasReady() {
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
}

/**
 * Polyfill resources
 */
var names = {
  WC: "Web components",
  ES6: "es6 for WC",
  CE: "customElements",
  SD: "ShadowDOM",
  TE: "HTML Template",
  PR: "Promise",
  AF: "Array.from",
  WA: "Web animations",
  SYM: "Symbol",
  URL: "window.URL",
  PE: "PointerEvents"
};

const bundles = {
  WC: ["CE", "SD", "TE", "ES6"],
  ES6: ["PR", "AF", "SYM", "URL"]
};

const fd = {
  CE: "!!window.customElements",
  SD: "'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype",
  TE: `(function () {
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
})()`,
  PR: "!!window.Promise",
  AF: "!!Array.from",
  WA: "!!window.Element.animate",
  SYM: "!!window.Symbol",
  URL: "!!window.URL",
  PE: "!!window.PointerEvent"
};

const links = {
  CE: "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-ce.js",
  SD: "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd.js",
  TE: "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js",
  PR: "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js",
  AF: "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js",
  WA: "https://cdnjs.cloudflare.com/ajax/libs/web-animations/2.3.1/web-animations.min.js",
  SYM: "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js",
  URL: "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js",
  PE: "https://code.jquery.com/pep/0.4.3/pep.js"
};

//step 3: Update polyfill framework to support CE and TE
const pfPatch = {
  CE:                             //methods to pause polyfill
    function expandCE() {
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
    }
};

const expandReady = {
  CE:
    function expandCE() {
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
    },
  TE:
    function expandTE() {
      var origFlushQue = window.polyfill.runWhenReady;
      window.polyfill.runWhenReady = function (flag) {
        HTMLTemplateElement.bootstrap(window.document);
        return origFlushQue(flag);
      };
    }
};

const expandNormal = {
  CE: function () {
    window.polyfill.CE = function () {
      if (document.readyState !== "loading")
        return;
      customElements.polyfillWrapFlushCallback(function () {
      });
      document.addEventListener("DOMContentLoaded", function () {
        customElements.polyfillWrapFlushCallback(function (flush) {
          flush();
        });
        customElements.upgrade(document);
      });
    };
  },
  TE: function () {
    window.polyfill.CE = function () {
      HTMLTemplateElement.bootstrap(window.document);
    };
  }
};

function printFD(PFS) {
  let res = "";
  for (let PF of PFS)
    res += "var " + PF.PF + " = " + fd[PF.PF] + "\n";
  return res;
}

function printSync(PFS, polyfillReady) {
  if (!PFS.filter(PF => PF.sync).length)
    return "";
  let fun = polyfillReady ? loadScriptSyncReady : loadScriptSyncNormal;
  return fun.toString() + "\n";
}

function printAsync(PFS, polyfillReady) {
  if (!PFS.filter(PF => !PF.sync).length)
    return "";
  let fun = polyfillReady ? loadScriptAsyncReady : loadScriptAsyncNormal;
  return fun.toString() + "\n";
}

function printLoadingFunctions(PFS, polyfillReady) {
  return printSync(PFS, polyfillReady) + printAsync(PFS, polyfillReady);
}

function printPFPatches(PFS) {
  return PFS.filter(PF => pfPatch[PF.PF]).map(PF => "(" + pfPatch[PF.PF].toString() + ")();\n");
}

function printPolyfillExpansions(PFS, polyfillReady) {
  const expansion = polyfillReady ? expandReady : expandNormal;
  let res = "";
  for (let PF of PFS) {
    let expand = expansion[PF.PF];
    if (expand)
      res += "(" + expand.toString() + ")();\n";
  }
  return res;
}

function triggerLoadingFunctions(PFS, polyfillReady) {
  let res = "";
  for (let PF of PFS) {
    let funcType = PF.sync ? "Sync" : "Async";
    funcType += polyfillReady ? "Ready" : "Normal";
    const funName = "loadScript" + funcType;
    const args = PF.isAnon ? [links[PF.PF]] : [links[PF.PF], PF.PF];
    const argsStr = args.map(a => '"' + a + '"').join(", ");
    res += `!${PF.PF} && ${funName}(${argsStr});\n`;
  }
  return res;
}

function waitForDOMLoaded() {
  if (document.readyState === "loading") {
    window.polyfill.await("DOMContentLoaded");
    window.addEventListener("DOMContentLoaded", function () {
      window.polyfill.runWhenReady("DOMContentLoaded");
    });
  } else {
    window.polyfill.runWhenReady();
  }
}

function printFlushQue(flushQueType) {
  if (!flushQueType)
    return "";
  if (flushQueType === "loaded")
    return `(${waitForDOMLoaded.toString()})();\n`;
  // if (flushQueType === "asap")
  return "window.polyfill.runWhenReady();\n";
}

function explodePolyfillCode(PF, sync, isAnon) {
  let res = [];
  let bun = bundles[PF];
  if (bun) {
    for (let PF2 of bun) {
      if (bundles[PF2])
        res = res.concat(explodePolyfillCode(PF2, sync, isAnon));
      else
        res.push({PF: PF2, sync, isAnon});
    }
  } else {
    res.push({PF, sync, isAnon});
  }
  return res;
}

function parsePolyfillCodes(pfc) {
  let PFS = [];
  for (let pf of pfc) {
    let isAnon = pf.startsWith("_");
    if (isAnon)
      pf = pf.substr(1);
    let PF = pf.toUpperCase();
    let sync = pf === PF;
    if (!sync && pf.toLowerCase() !== pf)
      throw new Error("Polyfill code must be either ALL upper case or ALL lower case: " + pf);

    PFS = PFS.concat(explodePolyfillCode(PF, sync, isAnon));
  }
  return PFS;
}

function printPolyfillFramework(polyfillReady) {
  const pfw = polyfillReady ? polyfillHasReady : polyfillIsEmpty;
  return "(" + pfw.toString() + ")();\n";
}

function generatePolyfill(input) {
  let params = new URLSearchParams(input);
  let pf = params.get("pf");
  let ready = params.get("ready");
  let PFS = parsePolyfillCodes(pf.split("-"));
  let res = "";
  res += printPolyfillFramework(!!ready);
  res += printLoadingFunctions(PFS, !!ready);
  res += printFD(PFS);
  res += printPFPatches(PFS);
  res += printPolyfillExpansions(PFS, !!ready);
  res += triggerLoadingFunctions(PFS, !!ready);
  res += printFlushQue(ready);
  return "(function(){" + res + "})();"
}