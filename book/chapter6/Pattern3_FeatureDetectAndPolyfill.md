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

## To sync or async? That is the web components polyfill question
The main drawback of loading a script sync, is that it will:
* delay the rendering of later parts of the DOM, and
* delay the running of later scripts.

The most immediate cure for this ill, is to place the polyfill sync *after* 
the other DOM template and scripts that you want to be rendered/run *before* the polyfill.

Another cure for this ill is to load the polyfill *async*.
If you load your polyfill async, the browser will not delay 
neither later scripts nor the rendering process.
That sounds great! But.. Is it really?

There is a mayor downside to loading web component polyfills async.
If some of your later scripts depend on the polyfill (ie. queries or manipulates the DOM),
these functions must be delayed until the web component polyfill has loaded and is ready.
This in turn means that you have to identify which of these functions need to be delayed 
and somehow que them so that they are run after the polyfill is ready.
This is invasive: the simplest path to accomplish this is to:
1. set up a function que, 
2. add the functions manipulating the DOM into this que in all the other scripts that can be 
run async / in parallell, and
3. trigger this que from the polyfill loader.

To load your web components async is both complex *and* invasive.
The complexity in itself is not necessarily a show-stopper, but 
the fact that all other scripts must relate to and place their functions in a que most certainly can be.

When working with polyfills, limitations in the polyfill can reduce the number of features 
or the extent to which we might use a feature on the platform. 
We can call this "platform constraints".
However, when we add the requirement that functions in other scripts *must* use a new 
function or feature, we are essentially *extending* the platform. 
We can consider this a "micro framework".
And we would very much like to avoid adding frameworks to our platform.
To add features, frameworks add themselves as a dependencies.
That is fine if you really need them or benefit from them, bad if you don't.

Therefore, if you in order to load the polyfill async need to add a micro-framework-functions-que dependency 
to your entire app, you most definitively want to evaluate whether or not this is worth it.
Here are some of the questions you might ask yourself:
* When will the need for the polyfill diminish so that I can remove the dependency?
* How much extra complexity and thereby risk of errors am I adding by adding this dependency?
* Will the complexity of the functions que come at the expense of functionality in my app?
Will I have to wait to add other functions due to the complexity added by the functions que?
* How many of my users are affected by the change? And how much time does it really cost them?
* How long until these users browsers update so to void the need to wait for the polyfill?
* How critical is it for your application to decrease the wait for this group of users? 
How many users are affected?

If I were to make a general recommendation, it would definitively be to load the polyfill for 
web components sync. Soon, only Edge and IE or the mayor browsers will need the polyfill,
and the complexity and drawback of adding the micro-framework-functions-que dependency should
not be underestimated. 
But, if you run a big app with many users and therefore have the resources and will to 
do the extra work required to support them, the milliseconds you can page load time 
can be worth it.
And finally, if you go down the route of async loading polyfills, I recommend that you start 
developing using sync loaded polyfills and then later augment the app to support async 
loaded polyfills when you get closer to production.

However, first, we will look at the [BatchCustomElementUpgrades](Pattern4_BatchCustomElementUpgrades.md) pattern.
This pattern makes the use of the customElements polyfill more efficient.
Then we will look at the pattern [QueAndRecallFunctions](Pattern5_QueAndRecallFunctions.md).
This pattern is needed to make our final pattern [FeatureDetectAndPolyfillAsync](Pattern6_FeatureDetectAndPolyfillAsync.md).

### References
* [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs/).

