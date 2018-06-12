# Mixin: ChildrenChanged

The problem with SlotchangeMixin is:
1. it requires the existence of a slot inside the element, and
2. the listener for this slot needs to be updated every time the shadowRoot changes content 
because the slotchange event does not bubble.

To bypass the problems of the slotchange event, 
we can instead directly observe when the potentially assignable nodes of a custom element changes.
To do so, we observe changes in the list of children of the host element.
And, if one of those children happen to be a slot, 
we also add a `slotchange` listener to those nodes.

This approach gives us a `slotchange` callback that relies on `MutationObserver` for 
its initial response. With the added benefit that 
updates of the shadowDOM no longer might require the Mixin to update its slotchange listener.
This means that users of ChildrenChangedMixin can 
*alter* its shadowDOM *after* the mixin has added its observer, 
*without* having to worry about such changes muting the mixin.
No need to `updateSlotListeners()` when the shadowDOM changes.

[link to the source of ChildrenChangedMixin](../../src/ChildrenChangedMixin.js)

## How to react to dynamic changes of the DOM inside a custom element?

`.flattenedChildren()` will give us a resolved list of the children of an element inside the shadowDOM
 (cf. slots_flattenedChildren).
But we still need to know *when* to ask for it.
Ok, we start simple. 
We know that we can ask for `.flattenedChildren()` in `connectedCallback()`,
*after* the shadowDOM is connected. 
This will give us `.flattenedChildren` the list of the elements (does this work in safari??).
But as the DOM is dynamic, we also need to be notified and possibly react when `.flattenedChildren`
change. 
 
To observe such changes to `flattenedChildren`, changes to both "normal children" and "slotted children"
must be observed. The platform provides two different API for doing this observation:
 * "normal children" changes through ```MutationObserver(...).observe({childList: true})```
 * "slotted children" changes through the ```slotchange``` Event.          

Using the pattern `ReactiveMethod` and `FunctionalMixin`, 
these two API are combined to observe any and all changes to an elements `flattenedChildren`
and trigger a life cycle method `.childrenChangedCallback(newflattenedChildren, oldflattenedChildren, isSlotChange)`
whenever such a change occurs.

The `ChildrenChangedMixin(Base)` uses the `constructor()` to initialize both listeners, and 
`connectedCallback()` and `disconnectedCallback()` to efficiently add and remove these listeners when needed.
In `connectedCallback()` ChildrenChangedMixin will first see if the element is using a shadowRoot.
If *no* shadowRoot is set, `ChildrenChangedMixin` will simply observe for changes to lightDOM `.children` 
of the `host` element (`this`).
However, if shadowRoot *is* set, `ChildrenChangedMixin` will do two things:
1. It will observe for changes to the `shadowRoot.children`. 
This is likely not necessary, and should be a voluntary pattern added in the component itself?
2. It will check to see if there are any `HTMLSlotElement`s that are directly attached to the shadowRoot.
If so, it will also add listeners for the `slotchange` event on these HTMLSlotElements.
And, finally, whenever the ChildrenChanges, these listeners will be checked to make sure no new `<slot>` elements are added or removed.

## Example

```javascript
import {ChildrenChangedMixin, getVisibleChildren} from "./ChildrenChangedMixin.js";

class MyWebComponent extends ChildrenChangedMixin(HTMLElement) {
                                               
  constructor(){
    super();
    const myVisibleChildren = getVisibleChildren(this); //this can be called even when not connected
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
## Tests
* [ChildrenChangedCallback in codepen: https://codepen.io/orstavik/pen/XEMWLE](https://codepen.io/orstavik/pen/XEMWLE)

## References
* https://github.com/webcomponents/gold-standard/wiki/Content-Changes
* https://github.com/webcomponents/gold-standard/wiki/Content-Assignment
* https://github.com/webcomponents/gold-standard/wiki/Detachment                                  
* https://www.polymer-project.org/2.0/docs/devguide/shadow-dom#observe-nodes
* https://www.polymer-project.org/2.0/docs/api/classes/Polymer.FlattenedNodesObserver
* https://github.com/w3c/webcomponents/issues/493#issuecomment-218077582
* https://dom.spec.whatwg.org/#mutation-observers
* https://github.com/whatwg/dom/issues/126
 
## Acknowledgments
Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
