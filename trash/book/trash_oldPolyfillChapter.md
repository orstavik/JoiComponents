# Pattern: FeatureDetectAndPolyfill

> This pattern is based on the good work of the team behind webcomponentsjs.org.
> The chapter aims to also function as an explainer for the webcompontents-loader.js
> so that users prefering to use the webcompontents-loader.js can do so with a clear 
> (sub)consciousness. 
> Many thanks to the great work and inspirational ethos from the work behind polyfills!

## What is a polyfill?
A "polyfill" is a javascript file that patches an old 
browser so that it can closely mimic the functionality of a new browser.                      
The idea is: add a couple of JS files to your web page, and 
they will make any old browser behave as good as new.

But, there are a couple of problems polyfilling browsers. 
First, most features of a browser are very tricky to polyfill.
Many new features of a browsers require access to underlying infrastructure in the browser
that are not accessible from JS.
The polyfills for webcomponents, and especially the shadowDOM polyfill, are examples of such 
features that are hard to polyfill both *correctly* and *efficiently*.
When polyfilling such features, the feature is often mimicked, rather than precisely patched.

Second, browsers are "old" and "new" in different areas. 
For example, Safari 10.3+ supports customElements and shadowDom, but not JS pointerevents, 
while Edge 16 and Firefox 60 supports pointerevents, but not customElements and shadowDom. 
This differences also change over time. 
Firefox is expected to ship customElements and shadowDom soon (summer 2018?). 
And back in 2017, Safari 10.0 supported only shadowDom, not Custom Elements.

Because different browsers need different polyfills, we are faced with a dilemma:
1. **Polyfills always**, regardless of whether or not they are needed. 
This gives a simple structure in the code, but causes many browsers to download unwanted files.
2. Load only the polyfills needed. Find out which polyfills you need and download these. 
This reduces amount of polyfill data needed to be downloaded, but adds complexity to the code.
This second choice is called **feature detection**.

### PartialPattern 1: FeatureDetection (for web components APIs)

To use web components, you need (to polyfill) three APIs: 
CustomElements, shadowDom and HTMLTemplate. 
As of May 2018, both Chrome and Safari support all three web component APIs, and
this means that more than 2/3 of your users do not need to download any polyfill files.
This means that if you choose to **polyfill always**, your users as a group will
need to download and inspect at least 3x as many JS files as if you use **feature detection**.
This seems callous, and so for web components (and many other polyfills) 
**feature detection** is the default choice.
         
**Feature detection** by itself is straightforward and simple.
1. You identify which features you need. 
In the case of web components, you need Custom Elements, Shadow DOM, and HTML Templates
2. You query the browser to see if these features exists and works as expected. 
This is done by checking for a global property such as `window.customElements` and/or 
a behavior such as `document.createDocumentFragment().cloneNode() instanceof DocumentFragment`.

Below is the code to feature detect the APIs needed to run web components.

```javascript
var ES6 = window.Promise && Array.from && window.URL && window.Symbol;
var CE = window.customElements; 
var SD = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
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
```
### PartialPattern 2: Load script and polyfill *async*

Once the need for a polyfill is detected, you can download and install the polyfill.
To download and install a polyfill, you:
1. create a new `<script>` element,
2. add the link to the polyfill as this `<script>` elements `src`, and
3. append this script to the `<head>` element in the document. 
(When you append a script to the `<head>` element, that script will be loaded **async**hronously.)
4. add a custom callback function that will be called when the script has loaded,
   and a generic callback function if the script fails to load.                                              

```javascript                                                   
function loadScriptAsync(url, onLoadFn) {
  const script = document.createElement("script");
  script.src = url;
  if (onLoadFn)
    script.addEventListener("load", onLoadFn);
  script.addEventListener("error", (err) => {throw new URIError("The script " + url + " didn't load correctly.");});
  document.head.appendChild(script);
}
```
To load a polyfill based on the 

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

### PartialPattern 3: Que and recall polyfill-dependent functions
                                          
When using web components, you need to register new html-tags using 
`customElements.define`. 
If you are using your app in a browser that does not support web components, 
this feature is not accessible until your polyfill has finished loading, and 
all functions with such calls must therefore be queued and recalled later.
Also, using and polyfilling web components is heavily interfering with the DOM.
Queries and manipulation of the DOM can therefore in some instances be affected 
by the polyfill, and such functions should therefore also be queued and run *after*
the polyfill has loaded.
This requires the set up of a que for functions, and 
a trigger that can flush this que *after* the polyfills has loaded or native support 
has been verified.

To que and recall polyfill-dependent functions, the following steps are made:
1. A list for the function que is set up.
2. Functions to be queued are added to this list using a function.
3. When ready, all the functions in the que are run in their order of insertion.
Once completed, the que is removed and the 'WebComponentsReady' event is dispatched from the document. 
4. If a function is attempted added to the que after the que has been emptied, 
it is simply run immediately.

```javascript
window.WebComponents = {
  _que: [],
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
    var que = this._que;
    this._que = undefined;
    for (var i = 0; i < que.length; i++) 
      que[i]();                     //!! pedagogical simplification, will error with Promises !!
  }
};
```
There is one catch: `async` functions.
With the advent of `async function` and `Promise` in JS, 
both functions and `Promise`s might be added to the que.
To capture this, we must update our flushAndReady method to await all functions before exiting.

```javascript
window.WebComponents = {
  _que: [],
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
    var que = this._que;
    this._que = undefined;
    Promise.all(que.map(function(fn) {
      return fn instanceof Function ? fn(): fn;
    }))
    .then(function() {
      //at this point the que is empty!!
    })
    .catch(function(err) {
      console.error(err);       //todo should I throw an Error here instead?
    });
  }
};
```
Functions that require WebComponent support can now be added 
using the `WebComponents.waitFor()` method.

```javascript
//step 3: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component", MyComponent);
  document.querySelector("my-component").shadowRoot.innerHTML;
});
```

## FeatureDetectAndPolyfill = PartialPattern 1 + 2 + 3
Now we can start putting together our FeatureDetectPolyfill pattern.
We use our 3 previous partial patterns and link them up with the following polyfill bundles 
from "https://cdn.rawgit.com/webcomponentsjs/webcomponentsjs/2.0.0/".

However, there are some obstacles. 
Remember when I said "there are a couple of problems polyfilling browsers", and 
that polyfilling webcomponents can be especially tricky.
Well, here we will need to get into these tricks and troubles.
But first, we will look at a simplified version of our FeatureDetectAndPolyfill 
so as to understand how the partial patterns work together before we add all the complecting details.
                                                                                       
#### FeatureDetectAndPolyfill: a simplified version
```html
<script>
//Setup 1: declare the Que for polyfill-dependent functions
window.WebComponents = {
  _que: [],
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
    var que = this._que;
    this._que = undefined;
    Promise.all(que.map(function(fn) {
      return fn instanceof Function ? fn(): fn;
    }))
    .then(function() {
      //at this point the que is empty!!
    })
    .catch(function(err) {
      console.error(err);
    });
  }
};

//Setup 2: declare the function for loading script (async)
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
if (CE && SD && TE && ES6) {                                                              //[1]
  window.WebComponents.flushAndReady();
} else if (!CE && SD && TE && ES6) {                                                   
  loadScriptAsync(base + "webcomponents-ce.js", window.WebComponents.flushAndReady);      //[2]
} else if (!CE && !SD && TE && ES6) {                                                  
  loadScriptAsync(base + "webcomponents-sd-ce.js", window.WebComponents.flushAndReady);   //[3]
} else { /*if (!CE && !SD && !TE && !ES6) {*/                                          
  loadScriptSync(base + "webcomponents-sd-ce-te.js", window.WebComponents.flushAndReady); //[4]
  /*
  function() {
    //todo study this. I'm guessing that I only need to run this when I have loaded HTML Template polyfill?
    //if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap)  //todo and then I'm guessing that I might not need to test for window.HTMLTemplateElement, and maybe not even for HTMLTemplateElement.bootstrap??
    //  HTMLTemplateElement.bootstrap(window.document);
    //HTMLTemplateElement.bootstrap && HTMLTemplateElement.bootstrap(window.document);
    HTMLTemplateElement.bootstrap(window.document);
    flushWebComponentsWaitForAndUpgradeCE();
  });
  */
}

//step 3: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component-one", MyComponentOne);
  document.querySelector("my-component-one").shadowRoot.innerHTML;
});
</script>
```

#### FeatureDetectAndPolyfill: a simplified version
```html
<script>
//Setup 1: declare the Que for polyfill-dependent functions
window.WebComponents = {
  _que: [],
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
    var que = this._que;
    this._que = undefined;
    Promise.all(que.map(function(fn) {
      return fn instanceof Function ? fn(): fn;
    }))
    .then(function() {
      //at this point the que is empty!!
    })
    .catch(function(err) {
      console.error(err);
    });
  }
};

//Setup 2: declare the function for loading script (async)
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
if (CE && SD && TE && ES6) {                                                              //[1]
  window.WebComponents.flushAndReady();
} else if (!CE && SD && TE && ES6) {                                                   
  loadScriptAsync(base + "webcomponents-ce.js", window.WebComponents.flushAndReady);      //[2]
} else if (!CE && !SD && TE && ES6) {                                                  
  loadScriptAsync(base + "webcomponents-sd-ce.js", window.WebComponents.flushAndReady);   //[3]
} else { /*if (!CE && !SD && !TE && !ES6) {*/                                          
  loadScriptSync(base + "webcomponents-sd-ce-te.js", window.WebComponents.flushAndReady); //[4]
  /*
  function() {
    //todo study this. I'm guessing that I only need to run this when I have loaded HTML Template polyfill?
    //if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap)  //todo and then I'm guessing that I might not need to test for window.HTMLTemplateElement, and maybe not even for HTMLTemplateElement.bootstrap??
    //  HTMLTemplateElement.bootstrap(window.document);
    //HTMLTemplateElement.bootstrap && HTMLTemplateElement.bootstrap(window.document);
    HTMLTemplateElement.bootstrap(window.document);
    flushWebComponentsWaitForAndUpgradeCE();
  });
  */
}

//step 3: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component-one", MyComponentOne);
  document.querySelector("my-component-one").shadowRoot.innerHTML;
});
</script>
```

There are many combinations of polyfills that are supported and possible.
However, I have chosen the following selection:
1. **No polyfill needed** - This covers the bulk of Chrome and Safari (2/3 of the browsers).
2. **webcomponents-ce.js** - Safari 10.0-10.2 had support for shadowDom, but not Custom Elements. (ca.0.5%) 
3. **webcomponents-sd-ce.js** - This covers Firefox (10%) and Safari older than 10.0. 
4. **webcomponents-sd-cs-te.js** - This covers Edge and older browsers polyfilled for es5. 

#### loading polyfill (sync)
```html
<script>
//step 1: set up the Que for polyfill-dependent functions
window.WebComponents = {
  _que: [],
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
    for (var i = 0; i < this._que.length; i++) 
      this._que[i]();
    this._que = undefined;
    document.dispatchEvent(new CustomEvent('WebComponentsReady', { bubbles: true }));
  }
};

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

//step 2: set up function for loading script async
function loadScriptSync(url, onDOMContentLoaded, onLoadFnAsString) {
  const script = document.createElement("script");
  script.src = url;
  script.setAttribute('onload', onLoadFnAsString);
  script.setAttribute('onerror', "throw new URIError('The script " + url + " didn't load correctly.')");
  document.write(script.outerHTML);
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded);  
}

//step 3: feature detection
const CE = window.customElements; 
const SD = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
const TE = 'content' in document.createElement('template') && document.createDocumentFragment().cloneNode() instanceof DocumentFragment;

//step 4: load polyfill async based on feature detection
const base = "https://cdn.rawgit.com/webcomponentsjs/webcomponentsjs/1.2.0/";
if (CE && SD && TE) {                                                                 //[1]
  window.WebComponents.flushAndReady();
} else if (SD && !CE) {                                                               //[2]
  loadScriptSync(base + "webcomponents-ce.js", flushWebComponentsWaitForAndUpgradeCE);
} else if (!SD && !CE && TE) {                                                        //[3]
  loadScriptSync(base + "webcomponents-sd-ce.js", flushWebComponentsWaitForAndUpgradeCE);
} else { //if (!SD && !CE && TE) {                                                    //[4]                                                                  //[4]
  loadScriptSync(base + "webcomponents-sd-ce-te.js", function() {
    //todo study this. I'm guessing that I only need to run this when I have loaded HTML Template polyfill?
    //if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap)  //todo and then I'm guessing that I might not need to test for window.HTMLTemplateElement, and maybe not even for HTMLTemplateElement.bootstrap??
    //  HTMLTemplateElement.bootstrap(window.document);
    //HTMLTemplateElement.bootstrap && HTMLTemplateElement.bootstrap(window.document);
    HTMLTemplateElement.bootstrap(window.document);
    window.WebComponents.flushAndReady();
    upgradeCE();
  });
}

//step 5: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component-one", MyComponentOne);
  customElements.define("my-component-two", MyComponentTwo);
});
</script>
```
### Extra 1: step 2b: Load script *sync*                          

Sometimes you want your web component polyfill to run as soon as possible.
Your page depends on web components to make any sense at all, and 
so your first order of business is to load the polyfills.
To load a script synchronously you make a `<script>` with a `src` link as in the previous example.
But then, instead of appending the `<script>` to the document `<head>`, 
you use `document.write` to place the `<script>` into the document 
immediately and run it synchronously.

```javascript
function loadScriptSync(url, onLoadFnAsString) {
  const script = document.createElement("script");
  script.src = url;
  script.setAttribute('onload', onLoadFnAsString);
  script.setAttribute('onerror', "throw new URIError('The script " + url + " didn't load correctly.')");
  document.write(script.outerHTML);
}
//document.addEventListener('DOMContentLoaded', ready);
```
The benefit of synchronous script loading is that you have more control of when the polyfill is loaded.
This will enable you to rely on your polyfill being present for later calls without needing 
to que and re-call such polyfill dependent functions.
However, sometimes, it is beneficial to update all the webcomponents at the same time.
When using polyfills, the process of updating the page can be quite intensive, and 
therefore batching all the updates of the web components can be smart.

**Sync** loading of polyfills also can benefit from making sure that 
polyfill-dependent functions are batched and called as a group at a later time:
Such calls can both be more efficient for the polyfill, and avoid actions being spread out over time 
causing for example a flickering layout. (todo check this one)

### Extra 2: When polyfilling customElements, you can control when the upgrade will flush
```javascript

//step X: set up a special function for the CE polyfill
//todo what the hell is this. I need to research that function
function upgradeCE(){
  customElements.polyfillWrapFlushCallback(function (flushCallback) {
    flushCallback();
  });
}

//step Y: 
function flushWebComponentsWaitForAndUpgradeCE(){
  window.WebComponents.flushAndReady();
  upgradeCE();
}


```

## Discussion

There are two main benefits of setting up your own polyfill loader for web components:
1. By inlining your polyfill loader in your entrypoint html file (such as index.html), 
you reduce the waterfall with one level.
2. By rolling your own polyfill loader, 
you can easily add other polyfills such as JS pointerevents in the same structure.
This simplifies your structure and any effort for speeding up one polyfill will likely accrue to all polyfills.
                                                                                   
### References
* [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs/).
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
* [MDN on dynamically loading scripts](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement).

<!--

Custom elements and shadowDom provide an excellent interface for integrating custom HTML+JS+CSS modules. 
Custom elements provide a great means both to organize and stabilize your own work and 
collaborate with others. It might not be perfect. And it needs to be polyfilled in old browsers. 
But it will still provides you with the only, cleanest and simplest API for making native HTML+JS+CSS modules.

Other times, you might want to process the other parts of your web page first,
you prioritize the rendering of images and other, normal HTML template.
If you added the polyfills synchronously, 
this part of your web presentation would be halted while you download and process the polyfills.

The smart move, if you can, is to avoid having to rely on web components for your initial paint.
That is likely to give you a visible front for your page much quicker, especially on a slow network.
To do so, you must load your web component polyfills asynchronously.
-->