# Pattern: NaiveSlotCallback

In the previous chapter about SlotMatroska, we saw the many problems associated with both the `<slot>` 
element and `slotchange` event. In this chapter we will solve many of them. 
But what form should this solution take? 
Should we solve the problems associated with the `slotchange` event as a composed event? 
Should we try to monkey-patch the `.assignedNodes()` function? 
Or, should we add a new lifecycle callback?

By trial and error, I have concluded that the best approach to fix SlotMatroska problems
is to create a new lifecycle callback called `slotCallback(..)`. This `slotCallback(..)` is formed
as a mixin called `SlotCallbackMixin`. This mixin can be made completely self-reliant and does not 
have to alter any native behavior or affect any other part of the system than the individual web 
components that use it. This, in my opinion, gives us a robust fix to as many SlotMatroska problems
as we can hope for today, while neither implementing any design-time or run-time app framework, 
distorting the native platform nor making our web components less reusable.

## `NaiveSlotCallbackMixin`

The most naive implementation just converts any `slotchange` event
that passes the shadowRoot to a `slotCallback(slotchangeEvent)`, and only while the web component
is connected to the DOM.

```javascript
const slotchangeListener = Symbol("slotchangeListener");

export function SlotCallbackMixin(base) {
  return class SlotCallbackMixin extends base {
    
    constructor(){
      super();
      this[slotchangeListener] = this.slotCallback.bind(this)
    }
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      this.shadowRoot.addEventListener("slotchange", this[slotchangeListener]);
    }    
    disconnectedCallback(){
      super.disconnectedCallback && super.disconnectedCallback();
      this.shadowRoot.removeEventListener("slotchange", this[slotchangeListener]);
    }    
  }
}
```
There are *many* problems with this approach.
1. There might not be a `this.shadowRoot` to add an event listener to.
2. `slotchange` might often be dispatched before the element has yet been connected to the DOM.
3. This naive solution addresses none of the SlotMatroska problems.

But, being a properly naive solution, it works in the best case scenario.
And we can see it in action like so:

```html
<script type="module">

import {SlotCallbackMixin} from "../../src/NaiveSlotCallbackMixin.js";

class GreenFrame extends SlotCallbackMixin(HTMLElement){
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
    <style>
    div {
      border: 4px solid green;
    }
    </style>
    <div><slot>picture this!</slot></div>
    `;
  }
  
  slotCallback(slotchange){
    console.log(slotchange);
  }
}
customElements.define("green-frame", GreenFrame);
</script>

<green-frame></green-frame>

<script >
setTimeout(function(){
  document.querySelector("green-frame").innerText = "Hello sunshine!";
}, 1000);
</script>
```

## Plan for the `slotCallback()`

To safely construct `SlotCallbackMixin`, I will gradually build it up over several chapters.
Each step in this process will solve one or more of the SlotMatroska problems.

1. we solve the small problem of SlotchangeNipSlip and locate the `<slot>` element 
which is the source of the `slotchange` event in the current shadowDOM.

2. we solve *both* the problems related to missing initial `slotchange` events 
(SlotchangeLostOnSafari and NoFallbackSlotchange) *and* the problems concerning `slotchange` 
timing and redundancy (PrematureSlotchange and half of SlotchangeSurprise). 
To do this, we use a mixin pattern called BatchedConstructorCallback. 
This is quite a big step
We establish a second  the problems related to timing of  shadowRoot which actually is 
in which the 

3. we solve *both* the problems related to missing initial `slotchange` events 
(SlotchangeLostOnSafari and NoFallbackSlotchange) *and* the problems concerning `slotchange` 
timing and redundancy (PrematureSlotchange and half of SlotchangeSurprise). 
To do this, we use a mixin pattern called BatchedConstructorCallback. 
This is quite a big step
We establish a second  the problems related to timing of  shadowRoot which actually is 
in which the 

4. we start a discussion about whether the `slotCallback()` should be triggered when nodes
*could* be slotted into a web component or when nodes actually are. We will here argue for
callbacks are most useful when they signal an external situation the web component can react to
internally, instead of an internal change of state.

5. we alter the `slotCallback()` to listen for changes in *potentially* slotted nodes, called
"slottables". This `slotCallback()` is more powerful and versatile, plus also relieves the mixin
of already having a shadowDOM. Ie. with this version of `slotCallback()`, a web component can delay
constructing a shadowDOM at all until it actually has some nodes to slot into it.

6. we solve the FallbackNodesFallout problem and the remainder of the SlotchangeSurprise problem.
When a `<slot>` is only filled with another `<slot>`
element with no fallback nodes and no assigned nodes plus surrounding whitespace (but not only 
whitespace), it will consider this empty and trigger the `<slot>` element 
to show its fallbackNodes by appending "-hidden" to the `name` of the `<slot>` element.
When used, this requires the CSS rules selecting `<slot>` elements based on its `name` attribute
to use `^=` instead of `=`. However, this solution is implemented inside out, so it is only the
web component implementing this fix that needs to handle this step. 

7. To fix SlotStyleCreep, an inner web component must actively set style properties on all nested 
`<slot>` elements to none. This is fairly heavy handed and obtrusive, and therefore not implemented.

## References

 * 