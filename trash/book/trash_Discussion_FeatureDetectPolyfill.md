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


As is evident from the code, the polyfill loader is growing in both size and complexity.
And there are still more details that needs to be added.
This might be too much complexity for your project. 
At this point, you might want to press the exit button, and move over to the 
[webcomponents-loader.js](todo/webcomponents-loader.js).


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