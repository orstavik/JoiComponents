# ChildrenChangedMixin

`ChildrenChangedMixin` adds two methods to an `HTMLElement`
* `.childrenChangedCallback(newVisibleChildren, oldVisibleChildren, isSlotChange)`
* `.getVisibleChildren()`

### Example

```javascript
import {ChildrenChangedMixin} from "https://unpkg.com/joicomponents/src/ChildrenChangedMixin.js";

class MyWebComponent extends ChildrenChangedMixin(HTMLElement) {
                                               
  constructor(){
    super();
    const myVisibleChildren = this.getVisibleChildren(); //this can be called even when not connected
  }
  
  childrenChangedCallback(newChildren, oldChildren, isSlotChange) {
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
### Tests
* [ChildrenChangedCallback in codepen: https://codepen.io/orstavik/pen/XEMWLE](https://codepen.io/orstavik/pen/XEMWLE)

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
 * https://github.com/w3c/webcomponents/issues/493#issuecomment-218077582 
 
### Some considerations about _slotchange_ 
 
1) Use-case: observe slotchanges of children in the shadowDOM.
```this.shadowRoot.addEventListener("slotchange", ()=> doYourThing())));```
 
2) Requirement: Actions responding to ```slotchange``` events are queued in the event loop?
Actions responding to ```MutationObserver( func ).observe({childList: true})``` are queued in the microtask que? 
Should they not be queued in the same que?