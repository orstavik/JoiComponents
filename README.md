#Joi Mixins
Two independent, standalone mixins that provide two callback hooks for web components: 
* .sizeChangedCallback
* .childrenChangedCallback

## .sizeChangedCallback
The purpose of this SizeChangedMixin is to provide a function hook that is triggered
everytime the size of the contentRectangle of the webcomponent changes, but only once per frame.
Such a hook has two primary use-cases:
1. "web-component mediaquery": You need to change the innerDOM of an element based on its available screen size.
2. You want to change some attributes of dependent elements (such as size or position) based on a combination of
size and/or content.

All elements implementing SizeChangedMixin have changes in their _inner_ size observed.
"Inner size" is defined as "contentRect" in Chrome's ResizeObserver,
or "window.getComputedStyle(this).width+height".

In Chrome, this is done using ResizeObserver. The ResizeObserver has the following limitations:
1. it does not observe {display: inline} elements.
2. it runs three-order after layout in a special ResizeObserver que.

In other browsers, this is done in the requestAnimationQue.

ATT!! sizeChangedCallback does not take into account css transforms. Neither in ResizeObserver nor rAF mode.
This is not a big problem as layout of the children are likely to want to be transformed with the parent,
and if you need to parse transform matrix, you can do still do it, but using your own rAF listener that
checks and parses the style.transform tag for changes.

You use it as follows:

```javascript
import {SizeChangedMixin} from "https://rawgit.com/orstavik/children-changed-callback/master/src/SizeChangedMixin.js";

class MyWebComponent extends SizeChangedMixin(HTMLElement) {
                                               

  sizeChangedCallback({width, height}) {
    //called every time the contentRectangle's width or height (the inner frame) of this element changes
    //but only while the instance of MyWebComponent is connected to the DOM.
  }                                                                
  
  
}
customElements.define("my-web-component", MyWebComponent);
const el = new MyWebComponent();
//1. .sizeChangedCallback is NOT triggered since el is not connected to DOM.
el.style.width = "100px";
//2. .sizeChangedCallback is triggered when el gets connected to DOM.
document.querySelector("body").appendChild(el);
//3. .sizeChangedCallback is triggered while el is connected and its size changes, 
//but only once per frame, hence the setTimeout.
setTimeout( () => el.style.width = "200px", 100);
```                                                                   
### Pattern basaed .sizeChangedCallback for fullscreen resizes?
If you are tracking the full screen size, use this pattern instead of the sizeChangedMixin:

```javascript
class MyWebComponent extends HTMLElement {
                                               
  constructor(){
    super();
    this._resizeListener = e => this.sizeChangedCallback({width: window.innerWidth, height: window.innerHeight});
  }
  
  connectedCallback(){
    window.addEventListener("resize", this._resizeListener);
    this.sizeChangedCallback({width: window.innerWidth, height: window.innerHeight});
  }

  disconnectedCallback(){
    window.removeEventListener("resize", this._resizeListener);
  }

  sizeChangedCallback({width, height}) {
    //set up your shadowDOM here.
    //make sure you cache your last width and height, so that you don't redraw the shadowDom everytime you don't want.
  }                                                                
}
customElements.define("my-web-component", MyWebComponent);
```                                                                   
This is a direct parallel to css mediaquery. 
The benefit of using this js based pattern for web components, 
is that you can alter both the style and the shadowDom of your webcomponents here.

## .childrenChangedCallback

This mixin adds two methods to an HTMLElement
 * .childrenChangedCallback(newVisibleChildren, oldVisibleChildren)
 * .getVisibleChildren()

You use it as follows:

```javascript
import {ChildrenChangedMixin} from "https://unpkg.com/children-changed-callback/src/ChildrenChangedMixin.js";

class MyWebComponent extends ChildrenChangedMixin(HTMLElement) {
                                               
  constructor(){
    super();
    const myVisibleChildren = this.getVisibleChildren(); //this can be called even when not connected
  }
  
  childrenChangedCallback(newChildren, oldChildren) {
    //this method is called everytime a visible child changes
    //but only while the instance of MyWebComponent is connected to the DOM.
  }
  
  
}
customElements.define("my-web-component", MyWebComponent);
const el = new MyWebComponent();
el.appendChild(document.createElement("div")); //.childrenChangedCallback is NOT triggered since el is not connected to DOM.
document.querySelector("body").appendChild(el);//.childrenChangedCallback is triggered when el gets connected to DOM.
el.appendChild(document.createElement("div")); //.childrenChangedCallback is triggered while el is connected and childList changes.
```
 * [Test of ChildrenChangedCallback in codepen: https://codepen.io/orstavik/pen/XEMWLE](https://codepen.io/orstavik/pen/XEMWLE)

### "visibleChildren" of HTMLElements
Using ```<slot>``` is a way to declaratively in the HTML arrange html components at
composition time of multiple components, as opposed to at creation time of each 
and every component. But, outside of HTML, a slotted child and a normal child 
should in most cases be treated equally. A slotted child is primarily "just a child":
it looks that way on screen, and should act that way in the DOM js environment too.
Only very rarely, and more often in a platform context than an app context, 
does a developer need to know if the change of a visible
child was slotted, as opposed to a direct change of the DOM.
   
Thus, ```visibleChildren``` of an HTMLElement are _both_ normal ```.children``` 
_and_ "slotted children" (```.assignedNodes()```).
The ```visibleChildren``` is a list of the element's ```children``` where 
the slot elements has been replaced with their ```.assignedNodes()```.
In most cases where we talk about "children" we are thinking about these 
"visible children" and not _just_ the "normal children". (cf. Web components gold standard on content assignment).

### when visibleChildren changes
Currently, the platform provides observation of
 * "normal children" changes through ```MutationObserver(...).observe({childList: true})```
 * "slotted children" changes through the ```slotchange``` Event.
 
However, in most cases, when we say "children changed" we refer to "visible children changed". 
We need to observe  changes of both "normal children" and "slotted children". 
To observe such "visible children" changes, one must combine the two methods. 
This is what ChildrenChangedMixin is doing.
Another approach would be to extend MutationObserver to provide something like a "visibleChildList" 
option that would react to any changes of the "visible children". 

ref:
 * https://github.com/webcomponents/gold-standard/wiki/Content-Changes
 * https://github.com/webcomponents/gold-standard/wiki/Content-Assignment
 * https://github.com/webcomponents/gold-standard/wiki/Detachment                                  
 * https://www.polymer-project.org/2.0/docs/devguide/shadow-dom#observe-nodes
 * https://www.polymer-project.org/2.0/docs/api/classes/Polymer.FlattenedNodesObserver 
 
 ### Some considerations about _slotchange_ 
 
1) Use-case: observe slotchanges of children in the shadowDOM.
```this.shadowRoot.addEventListener("slotchange", ()=> doYourThing())));```
 
2) Requirement: Actions responding to ```slotchange``` events are queued in the event loop?
Actions responding to ```MutationObserver( func ).observe({childList: true})``` are queued in the microtask que? 
Should they not be queued in the same que?