# Problem: DeclarativeResolution

## Background/Philosophical pondering

HTML is a declarative programming language. Like Prolog and SQL.
Until the advent of web components (ie. shadowDOM and `<SLOT>`s), 
HTML was a very limited declarative language. It was super simple.
But, with web components, its powers are growing.

So what are these new powers? 
**`ShadowDOM`** adds a way to divide HTML into **blocks**.
`ShadowDOM` gives us a way to encapsulate blocks of HTML code, 
so to prevent for example CSS rules in one block from affecting another.
The **`<SLOT>`** element is an HTML **variable**.
Variables enable programmers to preserve a space for changeable content, 
making block code dynamic and able to change depending on the context in which an instance of that
block happens to be placed.
When you combine **`<SLOT>` variables** with **shadowDOM blocks**, 
a block of HTML elements can suddenly *change* its final/real/resolved/flattened content
depending on the (spatial) surrounding context.
HTML is not quite Prolog yet. But. With web components, it has taken a long step in that direction.

As a declarative programming language, to find the "answer" (ie. the flattened DOM) 
HTML needs to run a resolution process every time a new setup of elements are created.
In principle, this means that every time the non-flattened DOM changes, the HTML
resolver must start at the top of the the main document and then traverse the entire tree
and "assigning" the now correct values of all its `<SLOT>` variables.
In practice, the HTML resolver can skip most of its branches that it detects as untouched.
The algorithm that more or less moves (transposes) assignedNodes into their final SLOT location
therefore needs to do less work than what one might fear.

> Advanced. In itself, HTML is non-cyclical. Neither `<SLOT>`s nor shadowDOM provides
a vehicle to make DOM nodes reference themselves. However. When creating custom elements,
you can use cyclical structures in the JS `constructor()` to make an HTML element create itself recursively.
However, this does not affect the HTML resolver, as this JS cycle must be completed, and the a-cyclical
HTML graph presented, before the HTML resolver does its job.

## Making a DOM element === making part of a DOM branch 

Thus, with `<SLOT>` elements and shadowDOM, making a new DOM node in the unresolved DOM does not 
necessarily mean that you have made that same exact structure in the final flattened DOM.
The DOM node you have made might be a `<SLOT>` element or a custom element that contain a shadowDOM.
If so, HTML needs to run a resolution to compute the final result.
This resolution is not context independent, quite the contrary;
the resolution of an HTML element, where it will end up in the final, flattened, resolved DOM
*depends on the context **surrounding** the new node*.
With `<SLOT>`s and shadowDOM, making a DOM element is no longer an isolated, context-free event.
making a DOM element is also part of making a DOM branch, that can span several DOM (shadow) documents.

Assigning nodes, identifying which slots have changed, transposing (moving) nodes etc. are
events that look beyond the borders of a single DOM element and 
only looks at DOM elements as parts of a DOM branch.
These activities therefore also needs to run seeing a change of the non-flattened DOM
as a whole.

And this chapter concern the most important of these changes, namely the construction of DOM nodes 
as part of the construction of DOM branches.

## `slotchange` events fire per DOM element construction, not per DOM branch construction.

In current spec and browsers, the browser will dispatch one `slotchange` event
for all newly created `<SLOT>` elements and newly created slottable nodes *per document construction*, 
and NOT *per DOM branch spanning several shadow documents construction*.
In theory, this might sound desirable. But in practice, it can be quite confusing.

### Example: Extra `slotchange` events

To illustrate the problem, we return to our `GrandpaInAFrame` example 
from the previous chapter [Problem: SlotchangeEavsedropping](Problem_SlotchangeEavesdropping.md).
This time, we drop the `requestAnimationFrame`s and the `setTimeout`s and alter the log slightly.
dynamically adding content.: BAM!!

```html
<family-photo>
  <img src="https://images.pexels.com/photos/1146603/pexels-photo-1146603.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125" alt="grandpa">
  <span slot="label">My internet family</span>
</family-photo>
 
<script type="module">
  import {naiveSlotchangeCallback} from  "https://rawgit.com/orstavik/JoiComponents/master/src/slot/NaiveSlotchangeCallback.js";

  class FamilyPhoto extends HTMLElement {
    constructor() { 
      super();
      this.attachShadow({
        mode: "open"
      });
      this.shadowRoot.innerHTML = `
<wooden-frame style="display: inline-block;">
  <slot></slot>
  <bronze-label slot="label">
    <slot name="label"></slot>
  </bronze-label>
</wooden-frame> 
`;
        naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, slotchangeEvent){
      console.log("FamilyPhoto", "slot." + slot.name, indirectness, slotchangeEvent.target.assignedNodes({flatten:true})); 
    }  
  }
  class WoodenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: "open" 
      });
      this.shadowRoot.innerHTML = `
<div style="position: relative; border: 40px solid brown;">
  <slot></slot>
  <div style="position: absolute; bottom: -35px; left: 30%;">
    <slot name="label"></slot>
  </div>
</div>
`;
        naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, slotchangeEvent){
      console.log("WoodenFrame", "slot." + slot.name, indirectness, slotchangeEvent.target.assignedNodes({flatten:true})); 
    } 
  }
  class BronzeLabel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: "open"
      });
      this.shadowRoot.innerHTML = `
<style>
  :host {display: inline-block; background: yellow;}  
</style>
<slot></slot>
`;
        naiveSlotchangeCallback(this)
    }
    slotchangeCallback(slot, indirectness, slotchangeEvent){
      console.log("BronzeLabel", "slot." + slot.name, indirectness, slotchangeEvent.target.assignedNodes({flatten:true})); 
    } 
  }
  customElements.define("bronze-label", BronzeLabel);
  customElements.define("wooden-frame", WoodenFrame);
  customElements.define("family-photo", FamilyPhoto);
</script>
```
BAM!! Now we are talking dynamite dynamisme. What happened here?!

```
1. WoodenFrame slot.      1 (4) [text, img, text, text]
2. FamilyPhoto slot.      0 (4) [text, img, text, text]
3. BronzeLabel slot.      1 [span]
4. FamilyPhoto slot.label 0 [span]
5. WoodenFrame slot.      0 (7) [text, text, img, text, text, text, text]
6. WoodenFrame slot.label 0 [bronze-label]
7. BronzeLabel slot.      0 (3) [text, span, text]
```

Lets begin nesting. First, we look at the "direct" slotchange events only. 
These are the events with "0".

```
2. FamilyPhoto slot.      0 (4) [text, img, text, text]
4. FamilyPhoto slot.label 0 [span]
5. WoodenFrame slot.      0 (7) [text, text, img, text, text, text, text]
6. WoodenFrame slot.label 0 [bronze-label]
7. BronzeLabel slot.      0 (3) [text, span, text]
```

First, the construction of the shadowDOM of FamilyPhoto is initialized. 
As a new shadowDOM document is created, the HTML browser will register that 
a `slotchange` event for all its `<SLOT>` elements should be triggered after the constructor has finished.
Second, the construction of the shadowDOM of WoodenFrame is initialized.
The HTML browser adds the task of running a `slotchange` event for all its slots.
Third, BronzeLabel is created and its `slotchange` events are queued.
This gives us 5 direct `slotchange` events.

Then we look at the four initial `slotchange` events:
```
1. WoodenFrame slot.      1 (4) [text, img, text, text]
2. FamilyPhoto slot.      0 (4) [text, img, text, text]
3. BronzeLabel slot.      1 [span]
4. FamilyPhoto slot.label 0 [span]
```
Here are two indirect `slotchange` events captured, namely the slotted children of FamilyPhoto that
get chain-slotted into WoodenFrame (the `<img>`) and BronzeLabel (the `label`) respectively.

As we can see, when `slotchange` events are registered on a *per document basis*, 
instead of viewed as a group, we get more `slotchange` events than we bargained for.
When viewed as a whole, the three custom elements should only have receiving the following events:

```
1. WoodenFrame slot.      1 (4) [text, img, text, text]
2. FamilyPhoto slot.      0 (4) [text, img, text, text]
3. BronzeLabel slot.      1 [span]
4. FamilyPhoto slot.label 0 [span]
6. WoodenFrame slot.label 0 [bronze-label]
```

And, more importantly, and from a declarative viewpoint, 
the following `slotchange` events we did not expect:

```
5. WoodenFrame slot.      0 (7) [text, text, img, text, text, text, text]
7. BronzeLabel slot.      0 (3) [text, span, text]
```

The reason these events were unexpected is that a declarative programming language such as 
HTML has no concept of dynamic time. It is not imperative. When you make a declaration such as:
```html
<family-photo>
  <img src="https://images.pexels.com/photos/1146603/pexels-photo-1146603.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=125" alt="grandpa">
  <span slot="label">My internet family</span>
</family-photo>
``` 
Conceptually, in this instance, there *is never a time* when the shadowDOM document of either
FamilyPhoto, WoodenFrame, nor BronzeLabel exists outside of the context of this particular unit as a whole.
Sure, when the computing engine creates such a construct, it will do so in incremental steps.
But, conceptually, the creation of this unit in the declarative programming language that is HTML,
is never seen as a sequence of four steps creating FamilyPhoto, WoodenFrame, BronzeLabel and main document.
Because in a declarative language such *imperative* time does not conceptually exists.

Thus. The `slotchange` events of this HTML unit, this particular DOM branch, 
should only be seen as in the context of the whole completed branch. 
And so when the HTML resolver completes the branch and then should alert the JS domain about which
`slotchange` events that have occurred, it should do so only when the complete context is available
and only trigger one such event per `<SLOT>` node.

## BatchedPostConstructorCallback to the rescue!

To summarize and simplify, the problem is that:
1. the flattening of slottable nodes occur in a DOM branch context,
2. this DOM branch context can span across multiple (shadowDOM) documents,
3. but the `slotchange` events called on *per document basis*,
4. while they should be triggered on a *per DOM branch basis*.

Luckily for us, we have a ready pattern for this problem: BatchedPostConstructorCallback.
The BatchedPostConstructorCallback basically gives us a callback that is triggered 
"as soon as the branch in which the current element is part of has been constructed".
BatchedPostConstructorCallback is trigger on a *per DOM branch basis*.

But, relying on BatchedPostConstructorCallback gives us two problems.
The browsers are themselves relying on several similar patterns to trigger `slotchange` events.
This means that:
1. some `slotchange` events are triggered after our BatchedPostConstructorCallback, and 
2. some `slotchange` events are triggered prior to it.

To solve this problem, we need to employ a double strategy. 
First, we will employ the DoublePrtPostSlotchangeTrick trick.
This trick adds a double, nested `Promise.resolve().then(...)` in the BatchedPostConstructorCallback.
This slightly skews the point of entry to allow all browser triggered `slotchange` events *just* pass us by.
Second, we trigger our own initial `slotchangeCallback(...)` manually at this time.
This ensures that all initial events are passed, at the right time, in the right order, and 
from the right place.

## `SlotchangeMixin` 

We now have all the building blocks we need to create a mixin for `slotchangeCallback(...)`.
The mixin:
1. provides the custom element with a `slotchangeCallback(myOwnSlot, indirectness, slotchangeEvent)`,
2. that do not eavesdrop on other custom element's `slotchange` events,
3. and that employs the BatchedPostConstructorCallback, 
4. with the DoublePrtPostSlotchangeTrick trick,
5. and that manually triggering all of the initial `slotchangeCallback(...)`s at the correct time,
6. and listens for later `slotchange` events so that they will be called as expected.

The `SlotchangeMixin` has one dependency, namely that the custom element that extends it has attached
an open `shadowRoot` to itself during construction.

```javascript

```

## References

## Old
When you are constructing a branch, this is what you are doing.
You are setting up a network of declarative blocks (one per shadowDOM),
and then you need to trigger a "resolution process" to flatten it.
BatchedConstructorCallback is a way to say that 
"making a tree of components should be considered part of the same HTML resolution process".