# Pattern: FeatureDetectAndPolyfillAsync

## Polyfilling web components: async?
The benefit of loading scripts **async** is that the script you are adding will not block the rendering of your page, 
neither while you:
1. download the script nor 
2. execute the script. 
This means that if you have a series of html elements coming after the loading of the script,
the browser will not delay rendering these elements until                                          
after you have finished both downloading and then executed the new script.
However, the drawback of async loading is that the features in your script are not ready straight away.
This is especially important for polyfills which you intend other parts of your code to rely on.
This means that even though other scripts are added to the DOM later than your script,
these scripts must make sure that any code that relies on the polyfill must:
1. queued and then later
2. re-called, when the polyfill has finished loading/is ready.
This we will look at in the next chapter.

<!--
The benefit of loading scripts async is that neither 
a) download the script nor b) the execution of the script will
block the rendering of your page. 
This means that if you have a series of html elements coming after the loading of the polyfill,
the browser will not delay rendering these elements until                                          
after you have finished both downloading and then executed the polyfill script.
However, the drawback of async loading is that the features you polyfill will 
only be ready at a later point in time. This means that you cannot rely on this feature being ready,
even though other scripts are added to the DOM later than your script that feature-detects and 
loads the polyfills.
And in turn, this means that all functions you call that relies on your polyfill must first be:
1. queued and then later
2. re-called, when the polyfill has finished loading/is ready.
-->

## How to load a polyfill async?
When you load your polyfill async, you loose control over when the polyfill 
will become available.
This means that you need to make sure that all functions in your web app that relies on
the polyfilled APIs being available are queued and only run after the polyfill is ready.
We use the QueAndRecallFunctions pattern from the previous chapter, and 
to make it available to other scripts, we add it to our global WebComponents polyfill object: `window.WebComponents`.
To top it off, we also dispatch a custom event `WebComponentsReady` after all the queued functions have run.

```javascript
window.WebComponents = window.WebComponents || {};
window.WebComponents._que = [];
window.WebComponents.waitFor = 
  function(fn){
    if (!fn)
      return;
    this._que? this._que.push(fn) : fn();
  };
window.WebComponents.flushAndReady = 
  function(){
    if (this._que === undefined)
      return;
    var que = this._que;
    this._que = undefined;
    Promise.all(que.map(function(fn) {
      return fn instanceof Function ? fn(): fn;
    }))
    .then(function() {
      //at this point the que is empty!!
      document.dispatchEvent(new CustomEvent("WebComponentsReady", {bubbles: true}));
    })
    .catch(function(err) {
      console.error(err);       //todo should I throw an Error here instead?
    });
  };
```

Functions that require WebComponent support should be run via this que using 
the `WebComponents.waitFor()` method.
When the polyfills are loaded (or native support has been verified) this que can then be flushed.
If you want, you can add additional timing criteria such as waiting for "DOMContentLoaded"
to batch the web component processes.  
Attention: It is not a problem to call the `window.WebComponents.flushAndReady()` more than once.
But, make sure that you only call the method *after* all your timing criteria are met.

```javascript
var runPolyfill = function(){
  if (document.readyState === "completed" && window.customElements){
    window.WebComponents.flushAndReady();
  }
}

//step 3a: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component", MyComponent);
  document.querySelector("my-component").shadowRoot.innerHTML;
});
window.WebComponents.waitFor(() => {
  customElements.define("my-component", MyComponent);
  document.querySelector("my-component").shadowRoot.innerHTML;
});
//step 3b: recall and flush methods added to the window.WebComponents que at the time of your choosing.
document.addEventListener("DOMContentLoaded", runPolyfill);
```

## Example: FeatureDetectAndPolyfillAsync
When you put it all together, it becomes:

```html
<html>
  <head>                        
    <script> /** Polyfill code **/
      //Setup 1: declare the function for loading script async
      function loadScriptAsync(url, onLoadFn) {
        const script = document.createElement("script");
        script.src = url;
        if (onLoadFn)
          script.addEventListener("load", onLoadFn);
        script.addEventListener("error", (err) => {throw new URIError("The script " + url + " didn't load correctly.");});
        document.head.appendChild(script);
      }
      
      //Setup 2: add methods for pausing customElements polyfill
      window.WebComponents = window.WebComponents || {};
      window.WebComponents.stopCEPolyfill = function(){
        if(window.customElements && customElements.polyfillWrapFlushCallback){
          customElements.polyfillWrapFlushCallback(function(){});
        }
      }
      window.WebComponents.startCEPolyfill = function(){
        if(window.customElements && customElements.polyfillWrapFlushCallback){
          customElements.polyfillWrapFlushCallback(function(flush){flush();});
          customElements.upgrade(document);                                     
        }
      }
      
      //Setup 3: add methods for que for WebComponents dependent functions
      window.WebComponents._que = [];
      window.WebComponents.waitFor = 
        function(fn){
          if (!fn)
            return;
          this._que? this._que.push(fn) : fn();                                              
        };
      window.WebComponents.flushAndReady = 
        function(){
          if (this._que === undefined)
            return;
          var que = this._que;
          this._que = undefined;
          Promise.all(que.map(function(fn) {
            return fn instanceof Function ? fn(): fn;
          }))
          .then(function() {
            //at this point the que is empty!!
            document.dispatchEvent(new CustomEvent("WebComponentsReady", {bubbles: true}));
          })
          .catch(function(err) {
            console.error(err);       //todo should I throw an Error here instead?
          });
        };

      //setup 4: add method for flushing webcomponents que when both the DOMContentLoaded and 
      //         the polyfill scripts have loaded
      var runPolyfill = function(){
        if (document.readyState !== "completed" || !window.customElements)
          return;
        window.WebComponents.flushAndReady();
        window.WebComponents.startCEPolyfill();
      }
      
      //step 1: feature detection
      var CE = window.customElements; 
      var SD = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
      var ES6 = window.Promise && Array.from && window.URL && window.Symbol;
      var TE = !(function() {
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
        return clone.content.childNodes.length === 0 || 
               clone.content.firstChild.content.childNodes.length === 0;
      })();
      
      //step 2: load polyfill async based on feature detection
      const base = "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/";
      if (CE && SD && TE && ES6) {                                          
      } else if (!CE && SD && TE && ES6) {                                                   
        loadScriptAsync(base + "webcomponents-ce.js", function(){    
          WebComponents.stopCEPolyfill();
          runPolyfill();
        });    
      } else if (!CE && !SD && TE && ES6) {                                                  
        loadScriptAsync(base + "webcomponents-sd-ce.js", function(){
          WebComponents.stopCEPolyfill();
          runPolyfill();
        });    
      } else { /*if (!CE && !SD && !TE && !ES6) {*/                                          
        loadScriptAsync(base + "webcomponents-sd-ce-pf.js", function(){
          WebComponents.stopCEPolyfill();
          HTMLTemplateElement.bootstrap(document); 
          runPolyfill();
        });
      }
      
      //step 3: restart the customElements polyfill on DOMContentLoaded
      window.addEventListener("DOMContentLoaded", runPolyfill);
    </script>
    
  </head>
  <body>
    <red-dot>\</red-dot>
    <script> /** APP code**/
      //my red-dot element
      class RedDot extends HTMLElement {
        connectedCallback(){
          this.style.background = "red";
          this.style.borderRadius = "50%";
          this.style.width = "150px";
          this.style.height = "250px";
        }
      }
      //app-specific loading method
      WebComponents.waitFor(()=>{
        customElements.define("red-dot", RedDot);
      });
    </script>
  </body>
</html>
```



### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).

<!--
## window.WebComponents - QueAndRecallFunctions relying on web component features
As described in the previous chapter, there are two reasons to QueAndRecallFunctions 
when using web components.

1. you might need to delay calls to functions that require web component APIs to be present,
such as:
   * `customElements.define`, calls that you need to register new html-tags
   * `myCustomElement.shadowRoot`, queries or manipulation of DOM that require shadowDom API,
   * `.innerHTML`, `.children` or `.querySelector()` calls that anticipates a structure of the DOM 
      not yet set up.

2. Polyfilling web components is heavily interfering with the DOM.
Queries and manipulation of the DOM can therefore in some instances be affected 
by the polyfill, and such functions should therefore also be queued and run *after*
the polyfill has loaded.
-->