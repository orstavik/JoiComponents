# Mixin: SlotChanged

```javascript
import {flattenedChildren} from "./flattenedChildren.js";

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
      this[slots] = this.shadowRoot.querySelectorAll("slot");
      for (let slot of this[slots])
        slot.addEventListener("slotchange", this[slotchangeListener]);
      this[triggerSlotchangeCallback]();
    }

    removeSlotListeners() {
      for (let slot of this[slots])
        slot.removeEventListener("slotchange", this[slotchangeListener]);
      this[slots] = [];
    }

    [triggerSlotchangeCallback](e) {
      const old = this[hostFlattenedChildren];
      const nevv = flattenedChildren(this);
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
