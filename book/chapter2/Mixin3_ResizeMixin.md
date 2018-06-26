# ResizeMixin

The purpose of `ResizeMixin` is to provide a reactive method called `resizeCallback(contentRect)`
and the method `getContentRect()`.
The ResizeMixin observes the contentRectangle of the custom element, and then triggers 
`resizeCallback` method every time the size of the contentRectangle of the webcomponent changes (once per frame).
`resizeCallback` has two primary use-cases:
1. web-component mediaquery: You need to change the style or the innerDOM of a custom element based on 
its available screen size.
2. You want to change some attributes of dependent elements (such as size or position) 
based on a combination of size and/or content (cf. [SlotchangeMixin](Mixin1_SlotchangeMixin.md)).

### Example of use:

```javascript
import {ResizeMixin} from "./ResizeMixin.js";

class MyWebComponent extends ResizeMixin(HTMLElement) {  //[1a]
                                               
  resizeCallback({width, height}) {                      //[2]
    console.log(`my inner dimensions are: width: ${width}px, height: ${height}px`);
  }                                                                
  
}
customElements.define("my-web-component", MyWebComponent);    //[1b]
const el = new MyWebComponent();                              
el.style.width = "100px";                                     //[3]
document.querySelector("body").appendChild(el);               //[4]
setTimeout( () => el.style.width = "200px", 100);             //[5]                          
```                                                                   
1. Adding the functional mixin as on a custom element:
`ResizeMixin(HTMLElement)`
`customElements.define("my-web-component", MyWebComponent);`
2. `resizeCallback({width, height})` is called every time the contentRectangle's width or height 
changes, while the element is connected to the DOM.
3. `resizeCallback()` *is not* triggered here since `el` is not connected to DOM.
4. `resizeCallback()` *gets* triggered here as `el` gets connected to DOM.
5. Because `resizeCallback()` is only observed during "requestAnimationFrame-time" or during "ResizeObserver-time" 
and once per frame per element, to trigger a second callback, 
we must delay the trigger until a later point (here using `setTimeout(..., 100)`).

## getContentRect()
`getContentRect(cachedOnly)` is a function that returns the "inner size" of the element in which 
shadowDom and children can be rendered. The "inner size" of the element is defined as 
```javascript
{
  width: window.getComputedStyle(this).width,
  height: window.getComputedStyle(this).height
}
```
If `true` is passed as parameter, then only the last cached value of the contentRect will be supplied and no
LayooutThrashing call to `getComputedStyle()` will be made.

### Pattern based .resizeCallback for fullscreen resizes?
If you are tracking the full screen size, use this pattern instead of the sizeChangedMixin:

```javascript
class MyWebComponent extends HTMLElement {
                                               
  constructor(){
    super();
    this._resizeListener = e => this.resizeCallback({width: window.innerWidth, height: window.innerHeight});
  }
  
  connectedCallback(){
    window.addEventListener("resize", this._resizeListener);
    this.resizeCallback({width: window.innerWidth, height: window.innerHeight});
  }

  disconnectedCallback(){
    window.removeEventListener("resize", this._resizeListener);
  }

  resizeCallback({width, height}) {
    //the components style can likely be controlled by css mediaqueries directly here.
    //But if you want to change the shadowDOM, you should do so here.
    //make sure you cache your last width and height, so that you don't redraw the shadowDom everytime you don't want.
  }                                                                
}
customElements.define("my-web-component", MyWebComponent);
```                                                                   
This is a direct parallel to css mediaquery. 
The benefit of using this js based pattern for web components, 
is that you can alter both the style and the shadowDom of your webcomponents here.

## Implementation details
1. Chrome's `ResizeObserver` runs three-order after layout at a special "ResizeObserver-time". 
In other browsers, this is done in the "requestAnimationFrame-time".
2. `ResizeMixin` handles **no css transforms**, neither at ResizeObserver-time nor requestAnimationFrame-time.
This is ok because the size of the children are transformed same as the parent.
If you really need to handle css transforms as well, then check, cache and parse the style.transform 
tag at requestAnimationFrame-time. 
3. Chrome's `ResizeObserver` does not observe `{display: inline}` elements.
4. In Chrome, the `contentRect` parameter created by `ResizeObserver` can differ slightly from 
the definition of `getContentRect()` that uses `getComputedStyle()`.

#### References
* https://wicg.github.io/ResizeObserver/
* https://github.com/WICG/ResizeObserver/blob/master/explainer.md
* https://gist.github.com/paulirish/5d52fb081b3570c81e3a
* https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing
* https://googlechrome.github.io/samples/resizeobserver/
* https://github.com/WICG/ResizeObserver/issues/3
* https://github.com/w3ctag/design-principles/issues/78
* https://github.com/wnr/element-resize-detector
* https://github.com/ebidel/demos/blob/master/dom_resize_events.html#L152-L170
