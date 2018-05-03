# Pattern: Web components everywhere using polyfills (in es6 land)

## Pattern 1: Load only the polyfills needed
A "polyfill" is a small javascript library that enables old browsers to mimick the functionality of a new browser.
(todo add refs)
However, browsers are "old" and "new" in different areas. Safari X.Y for example has implemented 
the standard for customElements and shadowDom, but not implemented the standard for JS pointerevents.
Other browsers such as Edge and Firefox has implemented JS pointerevents, but not implemented 
customElements and shadowDom. This also changes over time. Firefox is expected to ship customElements and shadowDom soon 
(summer 2018?), and who knows, maybe the team behind Safari will finally swallow their pride and 
give us JS pointerevents.

Because different browsers need different polyfills, we as developers are faced with a dilemma:
1. Load all polyfills always, regardless of whether or not they are needed. 
This gives a simple structure in the code, but causes all users to download files they might not need.
2. Load only the polyfills needed. Detect which features need to be polyfilled, 
and only selectively download those. This reduces the number of files users need to download, 
but adds complexity to the app code and structure.

When providing polyfills for web components, there are three features that likely need to be polyfilled:
customElements, shadowDom and HTMLTemplate. However, both Chrome and Safari support all three of these
API ensuring that more than 2/3 of the browsers need no polyfill to run.
The choice of downloading the polyfill for all browsers would therefore add more than 3x the network 
traffic necessary for the polyfill.
Hence, the choice between polyfill strategy 1 and 2 is therefore fairly simple for **web components: 
load only the polyfills needed**.

This pattern is the         

### Step 1: Feature detection

In order to only load a polyfill when it is needed, we must first find out if the browser already supports 
the feature we want to polyfill. This is called "feature detection". To illustrate this, we list here the 
JS feature detection queries for three web component APIs `Custom Elements`, `Shadow DOM`, and `HTML Templates`.

```javascript
const ce = window.customElements; 
const sh = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
const te = 'content' in document.createElement('template') && document.createDocumentFragment().cloneNode() instanceof DocumentFragment;
```
### Step 2: Load upon demand

Once a need for a polyfill is detected, you need to load the polyfill on demand.
As this should be a patch to the global scope, you do this by:
* creating a normal `script` element,
* add the link to the needed polyfill js-file, and
* append the script element to the head of the current document.

```javascript
function loadPolyfill(url, onloadFunction) {
  const poly = document.createElement("script");
  poly.onerror = (err) => {throw new URIError("The polyfill " + err.target.src + " didn't load correctly.");};
  if (onloadFunction) { poly.onload = onloadFunction; }
  document.head.appendChild(poly);
  poly.src = url;
}
```
In addition, we register a callback function that throws an error if the polyfill fails to load,
and a callback function that is triggered when the polyfill has loaded.

todo //this does not support some old Chrome browsers?? 

### Step 3: Let me know when `webcomponentsReady`

Polyfilling web components is heavily interfering with the DOM. 
Therefore, in a polyfilled web components app, 
we must wait for all web component polyfills to be loaded before we can safely:
1. register our webcomponents with `customElements.define` and
2. access the DOM.

To do so, we set up and fire a custom event called `webcomponentsReady`.
`webcomponentsReady` is fired on the `window` element when both HTMLTemplates, custom elements and 
shadowDom are available.


### Step 1, 2 and 3 combined
Putting it all together, dynamic loading of custom elements can be done like this:


```javascript
function loadPolyfill(url, onloadFunction) {
  const poly = document.createElement("script");
  poly.onerror = (err) => {throw new URIError("The polyfill " + err.target.src + " didn't load correctly.");};
  if (onloadFunction) { poly.onload = onloadFunction; }
  document.head.appendChild(poly);
  poly.src = url;
}

const ce = window.customElements; 
const sh = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
const te = 'content' in document.createElement('template') && document.createDocumentFragment().cloneNode() instanceof DocumentFragment;

if ((ce && sh) && te) {                                         //[1,2]
  requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent("webcomponentsReady")));
} else if (te) {                                                //[3]
  loadPolyfill("https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.2.0/webcomponents-sd-ce.js", ()=> window.dispatchEvent(new CustomEvent("webcomponentsReady")));
} else if (!te){                                                //[4]
  loadPolyfill("https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.2.0/webcomponents-lite.js", ()=> window.dispatchEvent(new CustomEvent("webcomponentsReady")));
}

//and then you can safely both `customElements.define` and access the dom and shadowDom.
window.addEventListener("webcomponentsReady", ()=>{
  customElements.define("my-component-one", MyComponentOne);
  customElements.define("my-component-two", MyComponentTwo);
  
  console.log(document.querySelector("#myComponent").shadowRoot.innerHTML);
})

```
1. Safari IOS 10.0-10.2 (0.5%) has support for shadowDom, but not customElements, so this is loaded as one. 
2. ((Chrome and Safari.)) The browser has no need to polyfill web components, and so it fires `webcomponentsReady` at the next animation frame.
3. ((Firefox.)) The browser has full support for HTML templates natively, and so loads polyfill for shadowDom and customElements only.
4. ((Edge.)) The browser does not support 

## Discussion

There are two main benefits of setting up your own polyfill loader:
1. you can do it directly in index.html, thus reducing the waterfall with one level.
2. you can load upon demand other polyfills such as JS pointer events without adding much in terms of complexity.


Custom elements and shadowDom provide an excellent interface for integrating custom HTML+JS+CSS modules. 
Custom elements provide a great means both to organize and stabilize your own work and 
collaborate with others. It might not be perfect. And it needs to be polyfilled in old browsers. 
But it will still provides you with the only, cleanest and simplest API for making native HTML+JS+CSS modules.


### References
* [MDN on dynamically loading scripts](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement).