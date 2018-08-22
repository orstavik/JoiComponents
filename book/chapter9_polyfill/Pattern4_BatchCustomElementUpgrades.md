# Pattern: Batch process the CustomElement polyfill
The CustomElement polyfill relies on some costly functionality.
1. The CustomElement polyfill observes all mutations in the DOM while the DOM is being 
loaded in order to identify new customElement tags.
2. Whenever `customElements.define` is called, the CustomElement 
polyfill will traverse the entire document to try to find DOM-nodes that fit the 
new custom element definition.

Sometimes, you must pay this cost. And therefore, this behavior is there by default.
But, often you know that several `customElements.define` calls and/or parsing bigger pieces 
of the DOM can be completed together *before* the customElements polyfill traverses 
and updates the DOM.
To achieve this the customElements polyfill need to be paused 
while several customElements dependent functions run, and then restarted when
these functions finish.
This *batch processes* customElements reactions.

## Implementation: Adding a pause-button to the CustomElements polyfill?
To stop the customElements polyfill from doing its job, you call:
```javascript
customElements.polyfillWrapFlushCallback(function(flush){});
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function(){
    customElements.upgrade(document);
  });
}
```
This method will both:
* *Intercept the DOM traversal* in response to `customElement.define` and 
supply it with a method that does nothing.
* *Stop observation* of the mutations while the document is loading and
replace it with a single `customElements.upgrade(document)` call when the page has finished loading.

To restart the customElements polyfill, you call:
```javascript
customElements.polyfillWrapFlushCallback(function(flush){flush();});
customElements.upgrade(document);                                     
```
This method will:
* reverse the interception of the traversal of the DOM in response to `customElement.define`,
so that calls to `customElement.define` will trigger upgrades of the DOM,
* call `customElements.upgrade(document)` to upgrade the DOM with all the changes done while
the polyfill was paused.

To make these two methods easily accessible, we add them under the globally accessible 
`window.WebComponents` object.

```javascript
window.WebComponents = window.WebComponents || {};
window.WebComponents.stopCEPolyfill = function(){
  if(window.customElements && customElements.polyfillWrapFlushCallback){
    customElements.polyfillWrapFlushCallback(function(){});
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", function(){customElements.upgrade(document);});
  }
}
window.WebComponents.startCEPolyfill = function(){
  if(window.customElements && customElements.polyfillWrapFlushCallback){
    customElements.polyfillWrapFlushCallback(function(flush){flush();});
    customElements.upgrade(document);                                     
  }
}
```
> **Recommendation:** Stop the customElements polyfill as soon as you have loaded it, and 
> restart it when the document has finished loading (DOMContentLoaded). This:
> * disables the costly observation of mutations in the DOM while loading, and 
> * batch processes multiple calls to `customElements.define` at startup.

## Example: FeatureDetectAndPolyfill with batched customElement reactions during loading
Here is the FeatureDetectAndPolyfill example that 
batches Custom Element reactions during the loading of document.
If you intend to load web components polyfills **sync**hronously, this is all you need.

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
          if (document.readyState === "loading")
            document.addEventListener("DOMContentLoaded", function(){customElements.upgrade(document);});
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
## Sync or async?
The only major drawback of this approach is that it will block the rendering of the main page 
and other sync scripts until your web components polyfill has completed.
There are a couple of mitigating circumstances for the sync approach:

1. The problem of blocking the rendering of the main document can be alleviated 
   by moving the script with the polyfills below 
   other template code and scripts you need to run first.

2. The web component polyfills are so invasive, that you are likely going to need to que the
   execution of your other scripts and functions anyway. 
   Other scripts you can load asynchronously before your polyfill.

3. Fewer and fewer browsers need the web components polyfills. 
   So even though a minority of your users get a slower experience,
   your users as a group might not be affected too badly.

4. With less complexity loading the polyfill and less complexity of using web component APIs,
   your app gets equivalently simpler. This makes room for other complicating functionality
   that all your users might value more than a slow Time-To-Interactive.

To read more about async vs. sync loading, see the more in-depth [discussion of async vs sync loading of polyfills](Discussion_sync_vs_async_polyfilling.md).

In the next two chapters we will look at two patterns necessary to load 
the web component polyfills async:

* [QueAndRecallFunctions](Pattern5_QueAndRecallFunctions.md).
* [SuperFun](Pattern6_SuperFun.md).

Then we combine this chapter with these two patterns to load web component polyfills async in [PolyfillLoader](Pattern7_PolyfillLoader.md).
We then look at a [PolyfillLoaderGenerator](Pattern8_PolyfillLoaderGenerator.md) 
that you can use to create custom polyfill-loaders for different polyfills.

### References
* [customElements polyfill](https://github.com/webcomponents/webcomponentsjs/customElements).
* [webcomponents-loader.js](https://github.com/webcomponents/webcomponentsjs/).

## Todo
simplify. Make 3 methods:
```javascript
polyfill.customElements.restart = function(){
  if(window.customElements && customElements.polyfillWrapFlushCallback){
    customElements.polyfillWrapFlushCallback(function(flush){flush();});
    customElements.upgrade(document);                                     
  }
};
polyfill.customElements.pause = function() {
  if(window.customElements && customElements.polyfillWrapFlushCallback)
    customElements.polyfillWrapFlushCallback(function(){});
};
polyfill.customElements.pauseWhileLoading = function() {
  if(window.customElements && customElements.polyfillWrapFlushCallback && document.readyState === "loading"){
    customElements.polyfillWrapFlushCallback(function(){});
    document.addEventListener("DOMContentLoaded", function(){polyfill.customElements.restart();});
  }
};
```
* add them on a global polyfill object.
* add them 
<!--
TODO Exemplify "flickering layout" problems of slow customElements:
1. Lets say you have a web page with 10 different custom elements.
2. Each of these elements greatly change their size and shape and appearance once they get 
connected to the DOM. 
3. Now, if you update all these web components one by one, and 
these operations happens to be spread out across time and different frames.
4. Then your web page might completely change its appearance every time one 
of the elements gets updated, ie. 10 times or more. 
-->