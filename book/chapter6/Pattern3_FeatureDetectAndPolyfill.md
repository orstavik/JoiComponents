# Pattern: FeatureDetectAndPolyfill

## Why polyfill web components sync?
Using the pattern for feature detection, 
we handle the variation in polyfilling for different browsers.
Put simply, FeatureDetection solves the problem of browser variation.

However, the web component polyfills are also invasive.
When polyfilling customElements and shadowDom,
the polyfills alter many of the core DOM functions.
Therefore, if you run a function against the DOM that you expect to be supported by the
polyfill *before* the polyfill has finished loading, this can create real problems.

The simplest and least invasive strategy to ensure that a polyfill *always* loads 
*before* other scripts that depend on it, is to load it **sync**.
When you load your script *sync*, any other script loaded by the browser will be delayed 
until your *sync* script has finished loading.
                                                               
## Example: FeatureDetectAndPolyfillSync web components
Using the two patterns FeatureDetection and DynamicallyLoadScript we compose a new pattern:
FeatureDetectAndPolyfill. 

```html
<html>
  <head>
    <script> /** Polyfill code **/
      //Setup: declare the function for loading script sync
      function loadScriptSync(url, onAsyncLoadAsString) {
        var newScript = document.createElement('script');
        newScript.src = url;
        onAsyncLoadAsString && newScript.setAttribute("onload", onAsyncLoadAsString);
        document.write(newScript.outerHTML);
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
        loadMyElements();                                   //[1]
      } else if (!CE && SD && TE && ES6) {                                                   
        loadScriptSync(base + "webcomponents-ce.js");       //[2]
      } else if (!CE && !SD && TE && ES6) {                                                  
        loadScriptSync(base + "webcomponents-sd-ce.js");    //[3]
      } else { /*if (!CE && !SD && !TE && !ES6) {*/                                          
        loadScriptSync(base + "webcomponents-sd-ce-pf.js",  //[4] 
          "HTMLTemplateElement.bootstrap(window.document);" //[5]
        ); 
      }
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
      customElements.define("red-dot", RedDot);
    </script>
  </body>
</html>
```
1. **No polyfill needed** - This covers the bulk of Chrome and Safari (2/3 of the browsers).
2. **webcomponents-ce.js** - Safari 10.0-10.2 had support for shadowDom, but not Custom Elements. (ca.0.5%) 
3. **webcomponents-sd-ce.js** - This covers Firefox (10%) and Safari older than 10.0. 
4. **webcomponents-sd-cs-te.js** - This covers Edge and older browsers (IE) using es5. 
5. When using the polyfill for HTMLTemplate, the `HTMLTemplateElement.bootstrap(document)` method
is run to process any `template` elements already added to the DOM before the polyfill was registered.
If you *know* that no template elements has been added to the DOM prior to the polyfill being loaded,
this call is not necessary.

However, first, we will look at the [BatchCustomElementUpgrades](Pattern4_BatchCustomElementUpgrades.md) pattern.
This pattern makes the use of the customElements polyfill more efficient.
Then we will look at the pattern [QueAndRecallFunctions](Pattern5_QueAndRecallFunctions.md).
This pattern is needed to make our final pattern [FeatureDetectAndPolyfillAsync](Pattern6_FeatureDetectAndPolyfillAsync.md).

### References
* [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs/).

