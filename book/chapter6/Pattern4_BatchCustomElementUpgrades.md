# Pattern: Batch process the CustomElement polyfill
The CustomElement polyfill relies on some costly functionality.
1. The CustomElement polyfill observes all mutations in the document while it is being 
loaded in order to identify new custom tags in the html template.
2. Whenever `customElements.define` (and `.innerHTML`) is called, the CustomElement 
polyfill will traverse the entire document to try to find some DOM-nodes that fit the 
new custom element definition.

By putting the CustomElement on pause, and then resume it later,
you can avoid *both* observations running while the polyfill is being loaded
*and* the polyfill traversing the DOM anew every time the `customElements.define`.
This will batch process the customElement functionality which is much more efficient.

<!--
However, que and re-call functions in one fell swoop also has some other advantages.
For example: Lets say you have a web page with 10 different custom elements.
Each of these elements greatly change their size and shape and appearance once they get 
connected to the DOM. Now, if you update all these web components one by one, and 
these operations happens to be spread out across time and different frames,
then your web page might completely change its appearance every time one of the elements gets 
updated, ie. 10 times or more. (todo make a test for this one)
((**Sync** loading of polyfills also can benefit from making sure that 
polyfill-dependent functions are batched and called as a group at a later time:
Such calls can both be more efficient for the polyfill, and avoid actions being spread out over time 
causing for example a flickering layout.))

When using polyfills, the process of updating the page can be quite intensive, and 
therefore batching all the updates of the web components can be smart.
This makes queing and re-calling all functions of a certain type regardless of whether or 
not an underlying dependency is present, and 
so even apps that load polyfills sync can benefit from queing and re-calling functions that 
depend on the polyfill regardless. 
-->

## Implementation: How to stop and start the customElements polyfill?
To stop (pause) the customElements polyfill from doing its job, you call:
```javascript
if(window.customElements && customElements.polyfillWrapFlushCallback){
  customElements.polyfillWrapFlushCallback(function(flush){});
}
```
This method will:
* stop the observation of the mutations in the document and
* intercept the traversal of the DOM in response to `customElement.define` and 
supply it with a method that does nothing.

To start (restart) the customElements polyfill, you call:
```javascript
if(window.customElements && customElements.polyfillWrapFlushCallback){
  customElements.polyfillWrapFlushCallback(function(flush){flush();});
  customElements.upgrade(document);                                     
}
```
This method will:
* reverse the interception of the traversal of the DOM in response to `customElement.define`,
so that calls to `customElement.define` will trigger upgrades of the DOM,
* but it will not(!) cause an upgrade by itself.

To make these two methods easily accessible, we add them under the globally accessible 
`window.WebComponents` object.

```javascript
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
```

## Recommendation: Pause immediately and restart on DOMContentLoaded 
**Pause the customElements polyfill as soon as you have loaded it, and 
restart it when the document has finished loading.**
This will disable the costly observation of mutations in the DOM while loading, 
and it will enable you to batch multiple calls to `customElements.define` that occur while loading.

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
      
      //Setup: add methods for pausing customElements polyfill
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
      if (CE && SD && TE && ES6) {                                                          //[1]                                 
      } else if (!CE && SD && TE && ES6) {                                                   
        loadScriptSync(base + "webcomponents-ce.js", "WebComponents.stopCEPolyfill();");       
      } else if (!CE && !SD && TE && ES6) {                                                  
        loadScriptSync(base + "webcomponents-sd-ce.js", "WebComponents.stopCEPolyfill();");    
      } else { /*if (!CE && !SD && !TE && !ES6) {*/                                          
        loadScriptSync(base + "webcomponents-sd-ce-pf.js",   
          "HTMLTemplateElement.bootstrap(document); WebComponents.stopCEPolyfill();");
      }
      
      //step 3: restart the customElements polyfill on DOMContentLoaded
      window.addEventListener("DOMContentLoaded", function(){WebComponents.startCEPolyfill();});
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
Above is the FeatureDetectAndPolyfill example updated with this functionality.
If you intend to load web components polyfills **sync**hronously, as I recommend,
this is all you need.
The only major drawback of this approach is that it will block the rendering of the main page 
until your web components polyfill has completed.
There are mitigating circumstances for the sync approach:
1. Fewer and fewer browsers need the webcomponents polyfills. 
So even though a minority of your users get a slower experience,
your users as a group might appreciate the loss of complexity in polyfilling 
swapped with added complexity of business functionality.
2. The problem of blocking the rendering of the main document can be alleviated 
by moving the script with the polyfills below other template code.

However, sometimes you cannot change the loading position of the polyfill, and/or 
you cannot wait for the polyfill to download and install before rendering the rest of the 
main document. In such instances, you need to load the polyfill **async**hronously.

To load the polyfills async, you need another pattern called [QueAndRecallFunctions](Pattern5_QueAndRecallFunctions.md).
This pattern is fairly independent, and will therefore be described on its own terms, 
before we again return and [FeatureDetectAndPolyfillAsync](Pattern6_FeatureDetectAndPolyfillAsync.md).

### References
* [customElements polyfill](https://github.com/webcomponents/webcomponentsjs/customElements).
* [webcomponents-loader.js](https://github.com/webcomponents/webcomponentsjs/).

