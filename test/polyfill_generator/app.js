'use strict';

/**
 * GENERIC RESOURCES
 */
function loadScriptAsync(url, pfc) {
  pfc && window.polyfill.await(pfc);
  var newScript = document.createElement('script');
  newScript.src = url;
  newScript.addEventListener('load', function () {
    window.polyfill.runWhenReady(pfc)
  });
  document.head.appendChild(newScript);
}

function loadScriptSync(url, pfc) {
  pfc && window.polyfill.await(pfc);
  var newScript = document.createElement('script');
  newScript.src = url;
  newScript.setAttribute("onload", "window.polyfill.runWhenReady('" + pfc + "');");
  document.write(newScript.outerHTML);
}

function polyfillFramework() {
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
const names = {
  WC: "Web components",
  ES6: "es6 for WC",
  CE: "customElements",
  SD: "ShadowDOM",
  TE: "HTML Template",
  PR: "Promise",
  AF: "Array.from",
  WA: "Web animations",
  SYM: "Symbol",
  URL: "window.URL"
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
  CE:
    function expandCE() {
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
    }
};

const polyfillExpand = {
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

const noPolyfill = {
  CE: function TODO() {
    return 1;
  }
};

function printFD(PFS) {
  let res = "";
  for (let PF of PFS)
    res += "var " + PF.PF + " = " + fd[PF.PF] + "\n";
  return res;
}

function printSync(PFS) {
  return PFS.filter(PF => PF.sync).length ? loadScriptSync.toString() : "";
}

function printAsync(PFS) {
  return PFS.filter(PF => !PF.sync).length ? loadScriptAsync.toString() : "";
}

function printLoadingFunctions(PFS) {
  return printSync(PFS) + "\n" + printAsync(PFS) + "\n";
}

function printPFPatches(PFS, inclPolyfill) {
  let res = inclPolyfill ? "" : "windows.polyfill = windows.polyfill || {};\n";
  return res + PFS.filter(PF => pfPatch[PF.PF]).map(PF => "(" + pfPatch[PF.PF].toString() + ")();\n");
}

function printPolyfillExpansions(PFS, inclPolyfill) {
  if (!inclPolyfill)
    return "";
  let res = "";
  for (let PF of PFS) {
    let expand = polyfillExpand[PF.PF];
    if (expand)
      res += "(" + expand.toString() + ")();\n";
  }
  return res;
}

function triggerLoads(PFS) {
  let res = "";
  for (let PF of PFS) {
    const funName = PF.sync ? "loadScriptSync" : "loadScriptAsync";
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

function generatePolyfill(pfc, inclPolyfill, flushQueType) {
  let PFS = parsePolyfillCodes(pfc.split("-"));
  let res = "";
  if (inclPolyfill)
    res = "(" + polyfillFramework.toString() + ")();\n";
  res += printLoadingFunctions(PFS);
  res += printFD(PFS);
  res += printPFPatches(PFS, inclPolyfill);
  if (inclPolyfill)
    res += printPolyfillExpansions(PFS);
  res += triggerLoads(PFS);
  res += printFlushQue(flushQueType);
  return "(function(){" + res + "})();"
}