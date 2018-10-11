# Pattern: `slotchange`

The `slotchange` event is dispatched from a `<slot>` element every time 
its `assignedNodes` changes.
                             
2. The initial-`slotchange`-event is not always dispatched in Safari (upto current version oct 2018).
//todo The tests that I have that shows the slotchange events in different browsers illustrated exactly
where this problem was

The initial-`slotchange`-event is the `slotchange` event that is dispatched 
when the slot is created and assigned nodes for the very first time.
Both Chrome and the polyfill dispatch an initial-`slotchange`-event, but Safari does not.
This discrepancy can be harmonized in the following ways:
   1. Ignore the initial-`slotchange`-event, except in Safari. 
   2. Create an extra `slotchange`-event at `connectedCallback()` only in Safari.
   3. Create an extra `slotchange`-event in all browser, but 
      ensure that the `slotchange`-event listener is only run when the `.assignedNodes()`
      of the `<slot>` has actually changed.

## Example 1: RedFrame

In this example we create a `<red-frame>`. 
The `<red-frame>` will present its content inside a red frame, but 
it also displays the number of objects inside its frame in the top left corner.

```html
<script>
  function compareArrays(a, b) {              //[1]
    return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
  }
  
  class RedFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.previouslyAssignedNodes = undefined;   //[2]
      this.attachShadow({mode: "open"});     
      this.shadowRoot.innerHTML =                 //[3]  
        `<style>
          :host {
            display: inline-block;
            border: 10px solid red;
          }                                                                              
        </style>
        <div id="count"></div>               
        <slot></slot>`;                     
    }
    
    connectedCallback(){                          //[4]
      const slot = this.shadowRoot.querySelector("slot");  
      slot.addEventListener("slotchange", this.assignedNodesChanged.bind(this));
      this.assignedNodesChanged();                //[5]
    }
    disconnectedCallback(){                       //[8]
      const slot = this.shadowRoot.querySelector("slot");  
      slot.removeEventListener("slotchange", this.assignedNodesChanged.bind(this));      
    }
    assignedNodesChanged(){                       //[6]
      const slot = this.shadowRoot.querySelector("slot");
      const currentlyAssignedNodes = slot.assignedNodes();
      if (!compareArrays(this.previouslyAssignedNodes, currentlyAssignedNodes)){
        this.previouslyAssignedNodes = currentlyAssignedNodes;
        this.updateCount(this.previouslyAssignedNodes.length);           
      }       
    }
    updateCount(count){                           //[7]
      const div = this.shadowRoot.getElementById("count");
      div.innerText = this.cachedCount;      
    }
  }
  customElements.define("red-frame", RedFrame);
</script>

<red-frame>                                      <!--[9]-->
  <img src="tomato.jpg" alt="tomato">
  <img src="strawberry.jpg" alt="strawberry">
</red-frame>

<script>
  setTimeout(function(){
    const cherry = document.createElement("img");
    cherry.src = "cherry.jpg";
    cherry.alt = "cherry";
    document.querySelector("red-frame").appendChild(cherry); //[10]
  }, 2000);
</script>
```
1. A function `compareArrays(a,b)` is added to be used later.
2. A property `.previouslyAssignedNodes` is added to `<red-frame>` element to 
cache the previous values of the slotted nodes.
3. The `<red-frame>` is set up with a `<div>` to display the count 
and a `<slot>` to display the content.
4. When the `<red-frame>` is connected to the DOM, 
the `.assignedNodesChanged()` function is added as an event listener 
directly on the `<slot>` node. It is *not* possible to add the event listener on
`this.shadowRoot`, as the `slotchange` event *does not bubble*.
5. At the end of `connectedCallback()` an extra call to the `slotchange` 
event listener function `.assignedNodesChanged()` is added manually.
This will trigger an equivalent initial-`slotchange`-event in Safari.
6. When `.assignedNodesChanged()` is triggered, 
it checks to see if the currently assigned nodes have changed since 
it last was triggered. This ensures that the manually added
initial-`slotchange`-event does not trigger twice in Chrome and the polyfill.
7. Finally, `updateCount(count)` is triggered when the `.assignedNodes()` 
actually have changed, and updates the text inn the `<div id="count">`.
8. Whenever the element is disconnected from the DOM, 
the `slotchange` event listener is cleaned up.
9. When the example is first loaded, 
a `<red-frame>` element with two `<img>` is connected to the DOM.
The `.connectedCallback()` of `<red-frame>` trigger `.assignedNodesChanged()` manually
in all browsers and causes an additional `slotchange` event in Chrome and the polyfill.
10. After 2 sec a third image is added. This causes a `slotchange` event in all browsers.

Adding the `slotchange` listener, caching the assigned nodes, and checking the assigned nodes
to cancel redundant callbacks is adding code and complexity to our web components.
To encapsulate this complexity we can create a Mixin that we can reuse across elements.
There are two ways to do so, and you can read more about them in
[SlotchangeMixin](../chapter3_lifecycle/chapter3_old/Mixin1_SlotchangeMixin.md).

## Example: IfOnly

A good way to understand the principle behind `slotchange` and the `.slotchangedCallback()`,
is to look at an example of how `<red-frame>` would have been implemented **if only**
Safari had thrown the initial-`slotchange`-event *and* both Safari and Chrome had made
`slotchange` bubble. 

```javascript
class IfOnly__RedFrame extends HTMLElement {       
  
  constructor(){
    super();
    this._slotChangedListener = (e) => this.slotchangedCallback(e);
    this.attachShadow({mode: "open"});     
    this.shadowRoot.innerHTML =                  
      `<style>
        :host {
          display: inline-block;
          border: 10px solid red;
        }                                                                              
      </style>
      <div id="count"></div>               
      <slot></slot>`;
    this.count = this.shadowRoot.getElementById("count");
  }
  
  connectedCallback(){                          
    this.shadowRoot.addEventListener("slotchange", this._slotChangedListener);
  }
  disconnectedCallback(){                       
    this.shadowRoot.removeEventListener("slotchange", this._slotChangedListener);
  }
  slotchangedCallback(e){                       
    this.count.innerText = e.currentTarget.assignedNodes().length;      
  }
}
customElements.define("red-frame", IfOnly__RedFrame);
```

In this example, there is no need to cache the previously assigned nodes nor 
to discover nor update the `<slot>` elements inside `this.shadowRoot`.
This *greatly* reduces the complexity of listening for `slotchange` events and 
thus the complexity of the components that do so.

## References
 * [MDN: `slotchange`](https://developer.mozilla.org/en-US/docs/Web/Events/slotchange)
 * [Elix project `SlotchangeMixin`](https://test.elix.org/elix/SlotContentMixin)
 * [Spesification: whatwg on slotchange](https://dom.spec.whatwg.org/#mutation-observers)
 
## TODOS
2. check that Safari also slotchange event {bubble: false}