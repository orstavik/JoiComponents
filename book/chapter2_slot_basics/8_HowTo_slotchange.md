# HowTo: `slotchange`

The `slotchange` event is dispatched from `<slot>` elements when their `assignedNodes` change.
                             
The `slotchange` event bubbles, and this means that you can listen for all `slotchange` in the
shadowDOM of a web component by adding an event listener to its root:

```javascript
this.shadowRoot.addEventListener("slotchange", function(){console.log("i will work")});
```

The `slotchange` event is `{composed: false}`. This means that it will not propagate up into the
lightDOM, but also that you can't listen for `slotchange` events on the host element. Thus, simply
listening for `slotchange` events on `this` inside a web component will NOT work.
`this.addEventListener("slotchange", function(){console.warn("ERROR!! I DON'T WORK!!")});`

## Example: `slotchange` event

```html
<script>
  class GreenFrame extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            display: block;
            border: 10px solid green;
          }
        </style>

        <div>
          <slot id="hasFallback"><h3>You can put stuff here)</h3></slot>
        </div>`;
      this.shadowRoot.addEventListener("slotchange", function(e){
        console.log("A slotchange event has occured!");
        console.log("The slot's id is:", e.target.id);
        console.log("The slot contains:", e.target.assignedNodes({flatten: true}));
      });
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame id="one"></green-frame>                                                <!--3-->
<green-frame id="two"><h1>Hello world!</h1></green-frame>                                                <!--3-->

<script>

  const first = document.querySelector("green-frame");
  const firstSlot = first.shadowRoot.children[1].children[0];
  console.log("-------------");
  console.log("The empty slot contains:", firstSlot.assignedNodes({flatten: true}));
  console.log("-------------");

  setTimeout(function(){
    const h2 = document.createElement("h2");
    h2.innerText = "Stay green!";
    document.querySelector("green-frame#two").appendChild(h2); //[10]
  }, 2000);
</script>

<ol>
  <li>
    In the console, you will first see one slotchange event being processed.
    This is the slotchange event for the "Hello world!" text.
    There is no slotchange event for fallback nodes, but there is a slotchange event when nodes are transposed into
    an element when the element is first declared.
  </li>
  <li>
    After the initial slotchange event, you will see the content of the slot with the fallback nodes being logged.
  </li>
  <li>
    Finally, after 2000ms, you will see a second slotchange event. This slotchange event occurs as second node is
    appended in the lightDOM and then transposed into the green-frame shadowDOM.
  </li>
  <li>
    In Safari browsers (IOS todo), the initial slotchange event is *not* dispatched.
    This is a bug in the old Safari browsers.
  </li>
</ol>
```

## References

 * [todo add the link to the bug about Safaris missing initial slotchange]()
 * [MDN: `slotchange`](https://developer.mozilla.org/en-US/docs/Web/Events/slotchange)
 * [Elix project `SlotchangeMixin`](https://test.elix.org/elix/SlotContentMixin)
 * [Spesification: whatwg on slotchange](https://dom.spec.whatwg.org/#mutation-observers)

## old drafts

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
[SlotchangeMixin](../../trash/book/chapter3_element_lifecycle/chapter3_lifecycle/chapter3_old/Mixin1_SlotchangeMixin.md).

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

