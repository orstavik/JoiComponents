# Pattern: FeatureDetection

**Feature detection** by itself is straightforward and simple.
1. You identify which features you need. 
In the case of web components, you need Custom Elements, Shadow DOM, and HTML Templates.
2. You query the browser to see if these features exists and works as expected. 
This is done by checking for a global property such as `window.customElements` and/or 
a behavior such as `document.createDocumentFragment().cloneNode() instanceof DocumentFragment`.

## Example 1: FeatureDetection for web components
To use web components, you need three APIs: 
CustomElements, shadowDom and HTMLTemplate. 
         
Below is the code to feature detect the APIs needed to run web components.

```javascript
var ES6 = window.Promise && Array.from && window.URL && window.Symbol;
var CE = !!window.customElements; 
var SD = 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
var TE = (function() {
  var t = document.createElement('template');
  if (!('content' in t)) {
    return false;
  }
  if (!(t.content.cloneNode() instanceof DocumentFragment)) {
    return false;
  }
  var t2 = document.createElement('template');
  t2.content.appendChild(document.createElement('div'));
  t.content.appendChild(t2);
  var clone = t.cloneNode(true);
  return clone.content.childNodes.length && 
         clone.content.firstChild.content.childNodes.length;
})();
```
Polyfills for webcomponents are collected in a library called [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs).
Since it is three different APIs, there are seven potential combinations of the three.
However, due to current and anticipated support in browsers, 
there are only four combinations, or bundles,
 of web component polyfills that you are likely going to need. 
These bundles have been set up by webcomponentsjs:
* [customElements](https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-ce.js)  	
* [shadowDom](https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd.js)  	
* [shadowDom, customElements](https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce.js)  	
* [shadowDom, customElements, HTMLTemplate, ++](https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce-pf.js)  	

## Example 2: Other features detect and links to their polyfill
```javascript
//some ES6 features
var ES6 = window.Promise && Array.from && window.URL && window.Symbol;

//web animations
var WA = !!window.Element.animate;
var WApoly = "https://cdnjs.cloudflare.com/ajax/libs/web-animations/2.3.1/web-animations.min.js";

//pointer events
var PE = !!window.PointerEvent;
var PEPoly = "https://code.jquery.com/pep/0.4.3/pep.js";
```

### References
* [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs/).
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).