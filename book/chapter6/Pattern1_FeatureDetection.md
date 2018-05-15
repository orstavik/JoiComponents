# Pattern: FeatureDetection (for web components APIs) FeatureDetectAndPolyfill

### PartialPattern 1: 

**Feature detection** by itself is straightforward and simple.
1. You identify which features you need. 
In the case of web components, you need Custom Elements, Shadow DOM, and HTML Templates
2. You query the browser to see if these features exists and works as expected. 
This is done by checking for a global property such as `window.customElements` and/or 
a behavior such as `document.createDocumentFragment().cloneNode() instanceof DocumentFragment`.

## Example 1: FeatureDetection for web components
To use web components, you need (to polyfill) three APIs: 
CustomElements, shadowDom and HTMLTemplate. 
         
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
The corresponding polyfills for these features are here:
* [polyfill](link)
*

As of May 2018, both Chrome and Safari support all three web component APIs.
This means that more than 2/3 of your users browsers no longer need to download any polyfill files.
This in turn means that if you choose to **polyfill always**, your users as a group will
have to download and inspect at least 3x as many JS files as if you use **feature detection**.
This is callous, especially since both you and many of your users are paying for this network traffic.
Therefore, when you are using web components (and web component polyfills) **feature detection** 
is the default choice.

## Example 2: Other features detect and links to their polyfill
```javascript
var ES6 = window.Promise && Array.from && window.URL && window.Symbol;
//todo webanimations API
//todo pointerEvents
```

The corresponding polyfills for these features are here:
* [polyfill](link)
*

### References
* [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs/).
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
