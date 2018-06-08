# Pattern: PolyfillLoader

## How to load a polyfill async?
When you load your polyfill async, you loose control over when the polyfill becomes available.
This means that if another function in your web app relies on the polyfilled APIs,
this other function must be:
1. queued until 
2. the polyfill has loaded, and only then 
3. triggered.

To set this up, we use the QueAndRecallFunctions pattern from the previous chapter.
This functions que is added to global `window.polyfill` object/micro-framework.
This framework **must be global** so that it can be reached from other scripts.

Some of the polyfills (ie. HTMLTemplate and customElements), 
also needs to attach their own custom functions to this framework.
For this we use the SuperFun pattern.

To place a function that depends on polyfill support being loaded in the que, 
we wrap the function call inside a global function called `polyfill.ready()`.
This function resembles the good old JQuery `$.ready()`.
*After* the polyfills are loaded (and/or native support has been verified),
the que behind `polyfill.ready` can be flushed.

### Example: PolyfillLoader

```html
<html>
  <head>                        
    <script>
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

  var WA = !!window.Element.animate || false;

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

      //SuperFun around polyfill.ready() to patch bug in customElements polyfill
      var origReady = window.polyfill.ready;
      window.polyfill.ready = function (fn) {
        //bug in customElements polyfill?
        //    if fn() customElements.define does not trigger a call to customElements.upgrade. why?
        origReady(fn) && window.customElements && customElements.upgrade && customElements.upgrade(document);
      };

      //SuperFun around polyfill.runWhenReady to pauseCustomElementsPolyfill when flushing the que of functions.
      var origFlushQue = window.polyfill.runWhenReady;
      window.polyfill.runWhenReady = function (flag) {
        window.polyfill.pauseCustomElementsPolyfill();
        return new Promise(function(resolve, reject){
          origFlushQue(flag);
          resolve();
        }).then(function () {
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
  
  //step 6: trigger polyfill.ready() functions (default is asap)
  //        this step is necessary to empty the que when no polyfills are needed nor loaded.
  window.polyfill.runWhenReady();
})();
    </script>
    
  </head>
  <body>
    <red-dot>\</red-dot>
    <script> 
      polyfill.ready(()=>{
        class RedDot extends HTMLElement {
          connectedCallback(){
            this.style.background = "red";
            this.style.borderRadius = "50%";
            this.style.width = "150px";
            this.style.height = "250px";
          }                                                                                      
        }
        customElements.define("red-dot", RedDot);
      });
    </script>
  </body>
</html>
```

## Extra timing criteria before flushing `polyfill.ready()`
`polyfill.ready()` cannot be flushed before all the polyfills that delay it are loaded.
But, if you want, you can add additional timing criteria before you flush `polyfill.ready()`.

One such alternative timer is to wait until the document has loaded its content (`DOMContentLoaded`).
This will batch all the queued `polyfill.ready` functions until the end of main document loading.

```javascript
// Or, wait until the entire page is loaded before you flush polyfill.ready() functions anyway
(function waitForDOMLoaded(){
  if (document.readyState === "loading"){
    window.polyfill.await("DOMContentLoaded");                //[1]
    window.addEventListener("DOMContentLoaded", function(){
      window.polyfill.runWhenReady("DOMContentLoaded");       //[2]
    });
  } else {
    window.polyfill.runWhenReady();                           //[3]
  }
})();
```
1. `polyfill.await(flag)` adds a flag that must be removed before `polyfill.ready()` will flush.
2. `polyfill.runWhenReady(flag)` removes the flag, and will flush `polyfill.ready()` if all the flags are then removed.
3. You can call `polyfill.runWhenReady(flag)` or `polyfill.runWhenReady()` as many times as you need.
The `polyfill.ready()` will only flush once all flags are removed.

## Important times when loading polyfills
When you are loading polyfills you have the following important times.
1. **PolyfillSetUp**. This is the initial stage of the polyfill loading.
   * Set up `window.polyfill` object/micro-framework.
   * FeatureDetection.                            
   * Add *All* polyfill-scripts to the document.
     * async scripts added as DOM nodes to `document.head`. 
     * sync scripts added using `document.write`.
 
2. **`polyfill.runWhenReady()`**. This method checks if the following criteria has been met,
 and if so will flush the `polyfill.ready()` que.
   * each time a polyfill is loaded, and/or
   * one or more extra times that the developer desires.
     * at the end of PolyfillSetUp and/or 
     * at `DOMContentLoaded`.                          
 
3. **Flush `polyfill.ready()`**. Runs all the functions in the que.

### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).