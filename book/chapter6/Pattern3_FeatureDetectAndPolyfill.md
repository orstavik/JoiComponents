# Pattern: FeatureDetectAndPolyfill
Using the two patterns FeatureDetection and DynamicallyLoadScript we can compose a new pattern:
FeatureDetectAndPolyfill. We will load the polyfill script **async** and 
try to illustrate how to FeatureDetectAndPolyfill bare bones without a functions que. 

```html
<html>
  <head>
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
      function loadMyElements(){
        customElements.define("red-dot", RedDot);
      }
    </script>
    
    <script> /** Polyfill code **/
      //Setup: declare the function for loading script async
      function loadScriptAsync(url, onLoadFn) {
        const script = document.createElement("script");
        script.src = url;
        if (onLoadFn)
          script.addEventListener("load", onLoadFn);
        script.addEventListener("error", function(){throw new URIError("The script " + url + " didn't load correctly.");});
        document.head.appendChild(script);
      }
            
      //step 1: feature detection
      var CE = window.customElements; 
      var SD = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
      var ES6 = window.Promise && Array.from && window.URL && window.Symbol;
      var TE = (function() {
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
               clone.content.firstChild.content.childNodes.length !== 0
      })();
      
      //step 2: load polyfill async based on feature detection
      const base = "https://cdn.rawgit.com/webcomponentsjs/webcomponentsjs/1.2.0/";
      if (CE && SD && TE && ES6) {                                          
        loadMyElements();                                                   //[1]
      } else if (!CE && SD && TE && ES6) {                                                   
        loadScriptAsync(base + "webcomponents-ce.js", loadMyElements);      //[2]
      } else if (!CE && !SD && TE && ES6) {                                                  
        loadScriptAsync(base + "webcomponents-sd-ce.js", loadMyElements);   //[3]
      } else { /*if (!CE && !SD && !TE && !ES6) {*/                                          
        loadScriptSync(base + "webcomponents-sd-ce-te.js", loadMyElements); //[4]
      }
    </script>
    
  </head>
  <body>
    <red-dot>\</red-dot>
  </body>
</html>
```
There are many combinations of polyfills that are supported and possible.
However, I have chosen the following selection:
1. **No polyfill needed** - This covers the bulk of Chrome and Safari (2/3 of the browsers).
2. **webcomponents-ce.js** - Safari 10.0-10.2 had support for shadowDom, but not Custom Elements. (ca.0.5%) 
3. **webcomponents-sd-ce.js** - This covers Firefox (10%) and Safari older than 10.0. 
4. **webcomponents-sd-cs-te.js** - This covers Edge and older browsers polyfilled for es5. 


## Problem 1: HTMLTemplateElement.bootstrap(window.document) 
```javascript
function callWhenLoadedHTMLTemplate() {
  //todo study this. I'm guessing that I only need to run this when I have loaded HTML Template polyfill?
  //if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap)  //todo and then I'm guessing that I might not need to test for window.HTMLTemplateElement, and maybe not even for HTMLTemplateElement.bootstrap??
  //  HTMLTemplateElement.bootstrap(window.document);
  //HTMLTemplateElement.bootstrap && HTMLTemplateElement.bootstrap(window.document);
  HTMLTemplateElement.bootstrap(window.document);
  flushWebComponentsWaitForAndUpgradeCE();
}
```

## Problem 2: customElements.polyfillWrapFlushCallback
Extra 2: When polyfilling customElements, you can control when the upgrade will flush

```javascript
//step X: set up a special function for the CE polyfill
//todo what the hell is this. I need to research that function
function upgradeCE(){
  customElements.polyfillWrapFlushCallback(function (flushCallback) {
    flushCallback();
  });
}

//step Y: todo research when if why and wtf omg I need the upgradeCE function.
function flushWebComponentsWaitForAndUpgradeCE(){
  window.WebComponents.flushAndReady();
  upgradeCE();
}
```
todo Find out what the purpose of the methods 

### References
* [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs/).

