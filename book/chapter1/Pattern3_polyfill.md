# Pattern: Load polyfills based on feature detection

## What is a polyfill and how to use it?
A "polyfill" is a javascript file that patches an old 
browser so that it can closely mimic the functionality of a new browser.
The idea is: add a couple of JS files to your web page, and 
they will make any old browser behave as good as new.

But, there is a problem polyfilling browsers. 
Browsers are "old" and "new" in different areas. 
Safari X.Y for example has implemented the standard for customElements and shadowDom, 
but not JS pointerevents.
Two other browsers such as Edge 16 and Firefox 60 has support for pointerevents, 
but not for customElements and shadowDom. 
This also changes over time. 
Firefox is expected to ship customElements and shadowDom soon (summer 2018?). 
And back in 2017, Safari X.Y only supported shadowDom and not customElements.

Because different browsers need different polyfills, we are faced with a dilemma:
1. Load all polyfills always, regardless of whether or not they are needed. 
This gives a simple structure in the code, but causes many browsers to download unwanted files.
2. Load only the polyfills needed. Find out which polyfills you need and download these. 
This reduces amount of polyfill data needed to be downloaded, but adds complexity to the code.

When providing polyfills for web components, there are three features you need to polyfill:
customElements, shadowDom and HTMLTemplate. 
Today (May 2018), both Chrome and Safari support all three web component APIs and thereby ensures that 
2/3 of all browsers in use today need no polyfill.
Therefore, if you choose to let all your users download all three the polyfills always, 
you would *tripple* your and your users total network traffic for your polyfills.
This seems callous.
For web components, the choice should therefore be straight forward: 
**load only the web component polyfills needed**.

### Step 1: Feature detection

In order to only download a polyfill when it is needed, 
we must first find out if the browser already supports the feature or API.
This is called "feature detection". 
Feature detection works by testing out a query for the API in question, and 
if it is there and behaves as we specify, the feature is detected.
Below is the feature detection for web components (Custom Elements, Shadow DOM, and HTML Templates).

```javascript
const CE = window.customElements; 
const SD = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
const HT = 'content' in document.createElement('template') && document.createDocumentFragment().cloneNode() instanceof DocumentFragment;
```
### Step 2a: Load script *async*

Once the need for a polyfill is detected, you can download and install the polyfill.
To download and install a polyfill, you:
1. create a new `<script>` element,
2. add the link to the polyfill as this `<script>` elements `src`, and
3. append this script to the `<head>` element in the document.                                             

When you append a script to the `<head>` element, that script will be loaded **async**hronously.
In addition we can add a custom callback function that will be called when the script has finished loading,
plus a generic callback function if the script throws an Error.

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
                                                        
The benefit of async loading of scripts is that it will not halt the rendering of your page. 
The drawback of async loading is that your scripts will only be ready at a later point in time.
Because you cannot quarantee when your polyfill is ready, 
all functions that relies on your scripts being ready must therefore be 
a) queued and then later b) re-called when the script is ready.

### Step 2b: Load script *sync*                          

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

### Step 3: Que and recall polyfill-dependent functions

Polyfilling web components is heavily interfering with the DOM. 
Therefore, in a polyfilled web components app, 
we must wait for all web component polyfills to be loaded before we can safely:
1. register our webcomponents with `customElements.define` and
2. access the DOM.

Both **async** and **sync** loading of polyfills can benefit from making sure that 
polyfills dependent functions are called:
1. after the polyfill has loaded and everything is ready and 
2. at the same time, so to save time and layout flickering.

To que and recall polyfill-dependent functions, the following steps are made:
1. A list for the function que is set up.
2. Functions to be queued are added to this list using a function.
3. When ready, a function is called that runs all the functions in the list in their order of insertion, 
and then removes the que.
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
    for (var i = 0; i < this._que.length; i++) 
      this._que[i]();
    this._que = undefined;
  }
};
```

### Step 1, 2a and 3 combined
We can now put it all together. We will here make two 

#### loading polyfill (async)
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
  }
};

//step 2: set up function for loading script async
function loadScriptAsync(url, onLoadFn) {
  const script = document.createElement("script");
  script.src = url;
  if (onLoadFn)
    script.addEventListener("load", onLoadFn);
  script.addEventListener("error", (err) => {throw new URIError("The script " + url + " didn't load correctly.");});
  document.head.appendChild(script);
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
  loadScriptAsync(base + "webcomponents-ce.js", window.WebComponents.flushAndReady);
} else if (!SD && !CE && TE) {                                                        //[3]
  loadScriptAsync(base + "webcomponents-sd-ce.js", window.WebComponents.flushAndReady);
} else { //if (!SD && !CE && TE) {                                                    //[4]                                                                  //[4]
  loadScriptAsync(base + "webcomponents-sd-ce-te.js", window.WebComponents.flushAndReady);
}

//step 5: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component-one", MyComponentOne);
  customElements.define("my-component-two", MyComponentTwo);
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
  }
};

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
  loadScriptSync(base + "webcomponents-ce.js", window.WebComponents.flushAndReady);
} else if (!SD && !CE && TE) {                                                        //[3]
  loadScriptSync(base + "webcomponents-sd-ce.js", window.WebComponents.flushAndReady);
} else { //if (!SD && !CE && TE) {                                                    //[4]                                                                  //[4]
  loadScriptSync(base + "webcomponents-sd-ce-te.js", window.WebComponents.flushAndReady);
}

//step 5: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component-one", MyComponentOne);
  customElements.define("my-component-two", MyComponentTwo);
});
</script>
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