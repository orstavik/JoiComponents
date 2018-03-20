## .childrenChangedCallback

This is a small project to implement and test a mixin to add to an HTMLElement
 * .childrenChangedCallback(newVisibleChildren, oldVisibleChildren)
 * .getVisibleChildren()

You use it as follows:

```javascript
class MyWebComponent extends ChildrenChangedMixin(HTMLElement) {
  childrenChangedCallback(newChildren, oldChildren) {
    //this method is called everytime a visible child changes
    //but only while the instance of MyWebComponent is connected to the DOM.
  }
}
customElements.define("my-web-component", MyWebComponent);
const el = new MyWebComponent();
el.appendChild(document.createElement("div"));
document.querySelector("body").appendChild(el);//now childrenChangedCallback is triggered
```

### "visibleChildren" of HTMLElements
Using \<slot> is a way to declaratively in the HTML arrange html components at
composition time of multiple components, as opposed to at creation time of each 
and every component. But, outside of HTML, a slotted child and a normal child 
should in most cases be treated equally. A slotted child is primarily "just a child":
it looks that way on screen, and should act that way in the DOM js environment too.
Only very rarely, and more often in a platform context than an app context, 
does a developer need to know if the change of a visible
child was slotted, as opposed to a direct change of the DOM.
   
Thus, "visible children" of an HTMLElement are _both_ "normal .children" 
(.children) _and_ "slotted children" (.assignedNodes()).
The "visible children" is a list of the "normal .children" where 
the slot elements has been replaced with the .assignedNodes() of those slot elements.
In most cases where we talk about "children" we are thinking about these 
"visible children" and not _just_ the "normal children".

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
 * https://www.polymer-project.org/2.0/docs/devguide/shadow-dom
 * https://www.polymer-project.org/2.0/docs/api/classes/Polymer.FlattenedNodesObserver 
 
 ### Some relevant considerations about _slotchange_ 
 
 1) Use-case: observe slotchanges of children in the shadowDOM. Ie.
 ```this.shadowRoot.addEventListener("slotchange", ()=> doYourThing())));```
 
 2) Requirement: Actions responding to ```slotchange``` events are queued in the event loop?
 Actions responding to ```MutationObserver( reactFunc ).observe({childList: true})``` are
  queued in the microtask que? Should they not be queued in the same que?