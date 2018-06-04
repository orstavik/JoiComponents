# Pattern: FeatureDetectAndPolyfillAsync

## Example: webcomponent-loader.js resembling webcomponentsjs-loader.js

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
        if (document.readyState === "loading" || !window.customElements)
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