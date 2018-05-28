# Mixin: ChildrenChanged

The `visibleChildren` pattern show how to list children of custom elements with a shadowDOM.
However, the DOM is dynamic. 
At run-time elements can be added and removed from the list of children for any elements using JS.
Therefore, custom elements that need to interact with its children, 
must also react when elements are added or removed from this dynamic list of its `visibleChildren`.
Enter ChildrenChangedMixin.

## How to detect changes of visibleChildren
To observe such changes to `visibleChildren`, changes to both "normal children" and "slotted children"
must be observed. The platform provides two different API for doing this observation:
 * "normal children" changes through ```MutationObserver(...).observe({childList: true})```
 * "slotted children" changes through the ```slotchange``` Event.

Using the pattern `ReactiveMethod` and `FunctionalMixin`, 
these two API are combined to observe any and all changes to an elements `visibleChildren`
and trigger a life cycle method `.childrenChangedCallback(newVisibleChildren, oldVisibleChildren, isSlotChange)`
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

todo
we have 4 different scenarios:
1. lightdom children observation. Common, its good.
2. shadowDom children observation via slotchange. no children are added/removed from this.shadowRoot.children.
Common scenario, needs only slotchange I think. I think my example with `<my-ol>` is like this. 
3. shadowDom children observation with no slot. Same as 1, but with this.shadowRoot instead of this.
4. shadowDom children observation with both slot and children. 
Same as if ManBucketList would add new goals to its shadowRoot *and* need to react to it.
I find this improbable.
todo end  

## Example

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
## Tests
* [ChildrenChangedCallback in codepen: https://codepen.io/orstavik/pen/XEMWLE](https://codepen.io/orstavik/pen/XEMWLE)

<!--
## Anti-pattern: .childrenChanged directly on an element object 

When making a shadowDOM it is often tempting to place the slot as a child of another element inside the shadowDOM.
This is ok if you will not change the elements surrounding the element

It is possible to observe the changes of .children elements directly on an existing element rather than an element type.
However, such observations are tricky to manage.
As described in the patterns ReactiveMethod and FunctionalMixin, one of the main problems of 
listening and observing changes in DOM elements is to efficiently add and remove them when needed.
When .childrenChanged is added to a custom element type, the `connectedCallback` and 
`disconnectedCallback` provide simple hooks where this management can be accomplished.
todo check if MutationObserver automatically removes/pauses observation of elements taken out of the DOM.

observing changes to children as an object extension rather than a Functional Mixin

adding `<slot>`not as a direct child of the shadowRoot and wanting to observe .childrenChangedCallback
                                              
This becomes an antipattern, because you cannot then have .childrenChangedCallback.
And that means that you will need to use an object extension. And this is much harder to manage the
connected/disconnectedCallback add and remove listeners that you need to make it efficient memory and speed.

When you do this anti-pattern, the fix is simple. Change the root down into the

Do not place `<slot>` element's as descendants of other elements in your shadowRoot if you intend 
to observe changes to it.
This will make it very hard for the element to be both open for dynamic changes of its elements from JS
, slot-changes from outside, and activate and remove observers and listeners for both of these changes efficiently.
It makes sensible encapsulation of life cycle reactions more difficult because these reactions are no longer
associated with the element as a whole, but only one part of the element.
 
it retrieves its values from children (??todo or descendants??) of its host element, ie. from its lightDOM.
-->

## References
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
Actions responding to ```MutationObserver( func ).observe({childList: true})``` are queued 
in the microtask que? Should they not be queued in the same que?

## Acknowledgments


<!--
`ChildrenChangedMixin` is one pattern that implements the observation of such changes.
And is `slotchange` event composed: true by default? I think yes.

Should it be implemented as an object extension??
Since it is likely to be applied to children of the shadowRoot? 
No, this is an anti-pattern. The HelicopterParentChild should be set up, 
making sure that there is no need to add the `<slot>` under another element in the shadowRoot, 
but adding `<slot>` directly under the shadowRoot.

Another approach would be to extend MutationObserver to provide something like a "visibleChildList" 
option that would react to any changes of the "visible children". 
-->