# Problem: Redundant slotchange events

todo 
This description is old.
This problem is caused by consequent DOM compositions due to constructors of custom elements
being nested within each other in the constructor.

//ref https://github.com/w3c/webcomponents/issues/764#issuecomment-425620510

When you chain slots, the browser will dispatch multiple `slotchange` events for 
*the same slot* for *the same change*.
Furthermore, the content of the `slotchange` event sometimes, but not always, originate 
from the slot in which the content changed, thus making 
**the `slotchange` event data trickle down from slots in the lightDOM (or lightDOM's lightDOM)**.
This behavior is unpredictable and needs to be handled.

## Example: GrandFather slotchange
In this example we set up a chained slot that looks like this:
```
grand-father
  #shadow
    the-father
      #shadow 
        the-child
          #shadow
            slot
          slot 
      slot
  "text"
```
We add a slotchange event listener that logs `element.tagName` and `event.path` for all three custom elements.    
The problem is:
* that when slots are chained 3 times, 
the lower slot will receive 3 slotchange events for the same change, and 
the middle slot will receive 2 slotchange events, and 
the upper slot will receive 1 slotchange event.
* The event data in the redundant events will originate from the slot in the lightDOM of the custom element.
And the lightDOM's lightDOM of the custom element. 

> Redundant `slotchange` events trickles down the lightDOM.

```html
<script>
function log(e){
  console.log(this.tagName, e.composedPath());
}  
  
class GrandFather extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<the-father><slot></slot></the-father>";
    this.shadowRoot.addEventListener("slotchange", log.bind(this));
  }
}
class TheFather extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<the-child><slot></slot></the-child>";
    this.shadowRoot.addEventListener("slotchange", log.bind(this));
  }
}
class TheChild extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<slot></slot>";
    this.shadowRoot.addEventListener("slotchange", log.bind(this));
  }
}
customElements.define("grand-father", GrandFather);
customElements.define("the-father", TheFather);
customElements.define("the-child", TheChild);
</script>

<grand-father>text</grand-father>
```
When the `<grand-father>text</grand-father>` element is added, it adds a `"text"` node as a child.
This `"text"` node is then chain-slotted all the way down into `<the-child>`. 
This triggers 6(?!) slotchange events that logs:
```
THE-CHILD (5) [slot, slot, document-fragment, the-child, document-fragment]
THE-FATHER (5) [slot, slot, document-fragment, the-child, document-fragment]
THE-CHILD (2) [slot, document-fragment]
THE-CHILD (8) [slot, slot, slot, document-fragment, the-child, document-fragment, the-father, document-fragment]
THE-FATHER (8) [slot, slot, slot, document-fragment, the-child, document-fragment, the-father, document-fragment]
GRAND-FATHER (8) [slot, slot, slot, document-fragment, the-child, document-fragment, the-father, document-fragment]
```
What you would expect from such a setup is a single `slotchange` event per slot.
You would also expect that the event data of each of these `slotchange` events originated from the slot in that document:
```
THE-CHILD (2) [slot, document-fragment]
THE-FATHER (2) [slot, document-fragment]
GRAND-FATHER (2) [slot, document-fragment]    
```

### `.assignedNodes()` is not-a-problem

However, `.assignedNodes()` works fine (in Chrome).
If you ask for the `.assignedNodes()` for every slotchange event above, 
the `.assignedNodes()` all return the completed updated result. 
So, the problem is only:
* redundant slotchange events with
* trickle down event data.

### The order of chained slotchange events
I think ordering the dispatch of events depth first is best. 
Depth first gives a clear order. 
And depth first would be indifferent to where the slotchange first triggered, 
ie. it would not matter if the change was made on the level of the-child, the-father or the grand-father.
Is my opinion.

### Same behavior in dynamic JS
If you add the element dynamically in JS, and 
with only a doubly chained slot, you get the same behavior:
```javascript
setTimeout(function(){
  const father = document.createElement("the-father");
  father.appendChild(document.createElement("div"));
}, 3000);
```
Logs:
```
THE-CHILD (2) [slot, document-fragment]
THE-CHILD (5) [slot, slot, document-fragment, the-child, document-fragment]
THE-FATHER (5) [slot, slot, document-fragment, the-child, document-fragment]
```

## Solution: filter slotchange events

1. As the `slot` elements in `slotchangeEvent.path` can originate from the lightDOM,
   you need to find the right `slot` element.
   The right `slot` element is the `slot` element whose `.getRootNode()`
   is the shadowRoot of the custom element.
```javascript
 const mySlot = slotchangeEvent.path.find(n => n.tagName === "SLOT" && n.getRootNode() === this.shadowRoot);
```
   Att! You need to use `.tagName === "SLOT"` if you want this filter to work with the polyfill.

2. You likely need/want to filter out the redundant slotchange events.
   If not, you can run heavy operations several times when it is not necesarry.
   Fortunately, all the redundant slotchange events are dispatched within the same microTaskCycle (in Chrome). 
   Therefore, you can:
   1. react to the first `slotchange` event you receive,
   2. find the correct slotchange data using the `.assignedNodes()`,
   3. flag that `slot` as `alreadyProcessed`,
   4. if you get another `slotchange` event for a slot that is `alreadyProcessed`, you just skip that `slotchange` event,
   5. and finally, at the end of the microTaskCycle, you remove the flag again.

## References
* dunno