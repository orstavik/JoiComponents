# Mixin: ChildrenChanged

## `MutationObserver`

The DOM is dynamic. 
Using JS, developers add and remove nodes in the DOM all the run-time.
In the normal DOM, such changes are observed using the `MutationObserver` API.

```javascript
function onChange(changes) {
  for (let c of changes) {
    console.log(c.target, "'s .children have changed.");
  }
}
const someElement = document.createElement("div");
const myObserver = new MutationObserver(onChange);
myObserver.observe(someElement, {childList: true});
someElement.appendChild(document.createElement("span"));    //someElement's children have changed.
```

The `MutationObserver` observes changes in the list of `.children` of individual DOM nodes.
You create a `MutationObserver` object with  a particular function, and 
then you register a particular node and what type of mutation in the DOM you would like to observe.
Then, when such a mutation happens to the DOM, the function is run.

This function is given the list of all the changes for all the changes you asked for on that object.
(But if you only specified `childList: true`, this list contains only one entry).
And then you can add the reaction you need to the change. 
The MutationObserver does not work for recursive changes, 
and so if you for example need to observe changes in the entire DOM, 
you would need to add such `MutationObserver`s to all DOM nodes with children.

## `slotchange`
Inside the shadowDOM the monitoring of childNodes is a little bit different.
First of all, a shadowDOM is:
1. supposed to be *much* smaller than a normal DOM,
2. the shadowDOM are often rarely be dynamically changed, and 
3. if changed, these changes should originate from code within the customElement itself.

>Changes of a custom elements shadowDOM should only be performed 
from within the class definition of said custom element.

Therefore, you don't really need MutationObserver's inside a shadowDOM.
If the DOM dynamically changes, you should be able to see exactly 
where and when that occurs inside the same code where the DOM is specified.
And because you should only dynamically change the shadowDOM from 
where you also specify it, changes of the DOM can easily be managed proactively 
where they are triggered, as opposed to reactively from an observer.

> Using a `MutationObserver` inside a shadowDOM is likely a symptom of a bloated custom element or 
a custom element whose shadowDOM is reached into from the outside (cf. anti-pattern reaching).
  
However, inside the shadowDOM there can also be `<slot>`s.
And the `assignedNodes()` of these `<slot>`s can change.
Such changes will change the nodes that will be displayed in the flattened DOM,
and sometimes we need to be notified of that. Enter `slotchange` event.

The `slotchange` event is dispatched every time the `assignedNodes` of a `slot` changes.
But, there are some inconveniences with the `slotchange` event.

First inconvenience is that `slotchange` does not bubble. 
This means that you must add the `slotchange` event listener directly on each `slot` node, 
as opposed to one common `slotchange` event listener on `this.shadowRoot`.

The second inconvenience is that `slotchange` is not fired the first time a slot 
gets `assignedNodes` in Safari, while it is fired in Chrome and the polyfill. 
This difference must be harmonized.

## Example 1: listening for slotchanges directly in a custom element
In this example we will look at a component that reacts to the changes of any of its slots.

In order to tackle the problem of Safari not dispatching the initial `slotchange` event that
Chrome and the polyfill does, we will:
1. trigger the reaction of a `slotchange` manually at startup so that you ensure that 
the initial trigger is executed in any browser (ie once in Safari and twice in Chrome),
2. cache the result of the `flattenedChildren` on the host node for these reactions, and
3. make sure that `slotchangeCallback()` is not called unless the element's `flattenedChildren` 
really has changed.

```javascript
import {flattenedChildren} from "./flattenedChildren.js";

function getNecessarySlots(el) {
  const slots = el.querySelectorAll("slot");
  const res = [];
  for (let i = 0; i < slots.length; i++) {
    let slot = slots[i];
    let name = slot.getAttribute("name");
    if (!name || name === "")
      return [slot];
    res.push(slot);
  }
  return res;
}

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

class SlotchangeComponent extends HTMLElement {
    
  constructor(){
    super();
    this._slotListener = (e) => this._triggerSlotchangeCallback(e);
    this._slots = [];
    this._flattenedChildren = undefined;
  }
  
  connectedCallback(){
    this.shadowRoot.innerHTML= `
      <div id="one">
        <slot name="one"></slot>
      </div>
      <div id="two">
        <slot></slot>
      </div>`;
    this.addSlotListeners();
    this._triggerSlotchangeCallback(null);
  }
  
  disconnectedCallback(){
    this.removeSlotListeners();
  }
  
  addSlotListeners(){
    this._slots = getNecessarySlots(this.shadowRoot);
    for (let slot of this._slots)
      slot.addEventListener("slotchange", this._slotListener);
  }
  
  removeSlotListeners(){
    for (let slot of this._slots)
      slot.addEventListener("slotchange", this._slotListener);
    this._slots = [];
  }
  
  _triggerSlotchangeCallback(e){
    const old = this._flattenedChildren;
    const nevv = flattenedChildren(this);
    if (arrayEquals(old, nevv))
      return;
    this._flattenedChildren = nevv;
    this.slotchangeCallback(nevv, old, e);
  }
  
  slotchangeCallback(newFlattenedChildren, oldFlattenedChildren, event){
    //all the slottable flattenedChildren of the component would be
    const allChildrenFlattened = flattenedChildren(this.shadowRoot);
    //when the slot event is triggered, you can do this as well
    if (event) {
      const slot = event.currentTarget;                           
      const slotParent = slot.parent;
      const newFlattenedChildren = flattenedChildren(slotParent); 
    }
    console.log("some slot has changed");
  }
}
```
There is a lot of code here that we use to solve two issues:                                            
1. `slotchange` does not bubble. 
To tackle this issue, we must search for either a no-name slot or all the named slots
inside the shadowDOM and add event listener for `slotchange` to all these nodes,
and clean it up. Phu.. its a mouthful.
2. the disharmony between `slotchange` in Safari and Chrome.
To fix this problem, we cache the value of the transposable nodes between each potential triggering
`slotchange` event. This ensures that the `slotchangeCallback(...)` will only be called once
every time there is a change, regardless of how many times it is attempted triggered.

This is starting to become complex, so we would like to isolate that in a functional mixin.

## Mixin 1: SlotChangeMixin
```javascript
function getNecessarySlots(el) {
  const slots = el.querySelectorAll("slot");
  const res = [];
  for (let i = 0; i < slots.length; i++) {
    let slot = slots[i];
    let name = slot.getAttribute("name");
    if (!name || name === "")
      return [slot];
    res.push(slot);
  }
  return res;
}

function arrayEquals(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function SlotChangeMixin(Base) {
  return class SlotChangeMixin extends Base {

    constructor() {
      super();
      this[slotchangeListener] = (e) => this[triggerSlotchangeCallback](e);
      this[slots] = [];
      this[hostFlattenedChildren] = undefined;
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addSlotListeners();
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeSlotListeners();
    }

    updateSlotListeners() {                                         //[2]
      this.removeSlotListeners();
      this.addSlotListeners();
    }

    addSlotListeners() {
      this[slots] = getNecessarySlots(this.shadowRoot);
      for (let slot of this[slots])
        slot.addEventListener("slotchange", this[slotchangeListener]);
      this[triggerSlotchangeCallback]();
    }

    removeSlotListeners() {
      for (let slot of this[slots])
        slot.addEventListener("slotchange", this[slotchangeListener]);
      this[slots] = [];
    }

    [triggerSlotchangeCallback](e) {
      const old = this[hostFlattenedChildren];
      const nevv = hostFlattenedChildren(this);
      if (arrayEquals(old, nevv))
        return;
      this[hostFlattenedChildren] = nevv;
      this.slotchangeCallback(nevv, old, e);
    }
  }
};
```
This mixin works well, *when* the following conditions are met:
1. The component has a shadowDOM, ie. `this.attachShadow({mode: "open"})` is called in the constructor,
which I recommend.
2. This shadowDOM is populated *before* the Mixin `connectedCallback()` is triggered, *or*
3. `updateSlotListeners()` is called *after* every update of the shadowDOM that 
affects its `<slot>` elements.

Now, if the `slotchange` event did bubble, like the specification says, 
conditions 2. and 3. would be bypassed by listening for `slotchange` events on `this.shadowRoot` 
instead of on the actual `<slot>` node directly (cf. https://dom.spec.whatwg.org/#mutation-observers).
But in neither Chrome and Safari, `slotchange` does not bubble. 
I think I heard someone mention "performance reasons". If only it had..
(todo let me know if this is wrong, either in interpreting the standard or that Safari make the event bubble!!)

This approach works well *if* a) the shadowDOM is static and preferably 
b) the shadowDOM is populated *before* the mixin callback is made.
But, this approach does is brittle for dynamic changes of the shadowDOM 
that might affect `slot` nodes. 
If you alter the shadowDOM and forget to call `updateSlotListeners()`, the mixin fails without warning.

However, there is an alternative approach to achieve the same effect with fewer preconditions.
But before we can start with this alternative approach, 
we need to take a step back and look again at what `slot`s and `assignedNodes()` are.

## Example: Green Frame and assignedNodes()

The nodes that are assigned the default, no-name `slot` in a shadowDOM
are in basic principle the `.children` nodes of the `host` node.
In basic scenarios, this means that inside a custom element
`this.children` equal `this.shadowRoot.querySelector("slot:not([name])").assignedNodes()`.
And this in turn means that a callback from a childList MutationObserver on the `host` element
should resemble `slotchange` event dispatched from the default slot.

We can exemplify such a scenario with GreenFrame, a custom element that 
displays two pictures in a green frame.

```javascript
class GreenFrame extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback(){
    this.shadowRoot.innerHTML = `
      <div style="border: 10px solid green">
        <slot></slot>                                                      
      </div>`;
  }
  getSlotContent(){
    return this.shadowRoot.querySelector("slot").assignedNodes();
  }
}
customElements.define("green-frame", GreenFrame);
```

Used like this in the main document.

```html
<green-frame>                                               
  <img id="girl" src="green_eyed_girl.jpg" height="100px" alt="green eyed girl" />   <!-- X1 -->
  <img id="car" src="green_car.jpg" height="100px" alt="green eyed girl" />         <!-- X2 -->
</green-frame>
<script>
  const gf = document.querySelector("green-frame");
  const children = gf.children;            // = [img#girl, img#car]
  const assigned = gf.getSlotContent();    // = [img#girl, img#car]  (the two arrays that reference the nodes are different though).
</script>
```
 
Ok, this works in a basic example. But, what if `green-frame` is used inside another custom element,
and that custom element placed a `<slot>` as a child of `green-frame`?
Let's try. We make a second custom element: `OuterGreenFrame`.

```javascript
class OuterGreenFrame extends HTMLElement {
  constructor(){
    super();                                                      
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback(){
    this.shadowRoot.innerHTML = `
      <div style="border: 3px solid darkgreen">
        <green-frame>                                               
          <slot></slot>
        </green-frame>
      </div>`;
  }
  getSlotContent(){
    return this.shadowRoot.querySelector("slot:not([name])").assignedNodes();
  }
}
customElements.define("outer-green-frame", OuterGreenFrame);
```

and we use it similarly in main document:

```html
<outer-green-frame>                                               
  <img id="girl" src="green_eyed_girl.jpg" height="100px" alt="green eyed girl" />   <!-- X1 -->
  <img id="car" src="green_car.jpg" height="100px" alt="green eyed girl" />         <!-- X2 -->
</outer-green-frame>
<script>
  const ogf = document.querySelector("outer-green-frame");
  const outerChildren = ogf.children;                      // = [img#girl, img#car]
  const outerAssigned = ogf.getSlotContent();              // = [img#girl, img#car]
  const gf = ogf.shadowRoot.querySelector("green-frame");  //Do not reach directly for the shadowRoot on other elements in your code. This is only done for example purposes.
  const innerChildren = gf.children;                       // = [slot]               !!the chained slot!!
  const innerAssigned = gf.getSlotContent();               // = [img#girl, img#car] 
</script>
```
We can call such a scenario like this "chained slots".
Chained slots occur when custom elements add their slot element as the child of another custom element.
Nested slots. A slot inside a slot. And what happens then?

First, we see that `outerAssigned` and `innerAssigned` have the same two image elements.
This is because:
1. The two `img` nodes from the main document are transposed 
to the `assignedNodes` of `outer-green-frame`.
2. The `assignedNodes` of the slot in `outer-green-frame` (ie. the two img nodes) are
then transposed further into the slot of the inner `green-frame`.
Since the the `green-frame` host element does not have any other `.children` than the `<slot>`,
the `outerAssigned` and `innerAssigned` contain the same elements.

Second, as was the situation for the host element in our previous, basic example, 
the list of `assignedNodes` also equals the `.children` of the `outer-green-frame` host element.

But third, we also see that `innerChildren` differes from the rest.
It only contains the slot node, not the assignedNodes of that slot.
That is because the .children property of an element does not reflect the flattened DOM, 
but the normal DOM.

## Mixin 2: ChildrenChanged

So, if we start with the basic example above,                              
an alternative approach to observing `slotchange` events is to observe changes in the list of children of the host element.
But, if one of those children happen to be a slot, 
we also need to observe the `slotchange` event of either:
1. the first no-name slot child, or
2. all named slot children.

This approach gives us a `slotchange` callback that relies on `MutationObserver` for 
its initial response. And this has one surprising, but important benefits:
the custom element no longer needs an instantiated and populated shadowRoot. 
And this in turn means that the custom element that uses ChildrenChangedMixin can 
*alter* its shadowDOM *after* the mixin has added its observer, 
*without* having to worry about such changes muting the mixin.
Or, put simply, this mixin does not require its inheriting custom elements to call 
`updateSlotListeners()` when the shadowDOM changes.

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
