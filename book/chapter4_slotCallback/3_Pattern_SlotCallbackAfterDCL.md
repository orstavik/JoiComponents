# Pattern: SlotCallbackAfterDCL

## When do `slotchange` events run while the main document is parsed?

`slotchange` events are dispatched *while* the main document is being parsed.
These `slotchange` events can alert about DOM branch states that do *not* exist in a declarative HTML
context. This is confusing, cf. [Problem: PrematureSlotchange](../chapter3_slot_matroska/9_Problem_PrematureSlotchange).

There are reasons why `slotchange` events *should* run before the main document DOM branch is complete.
Such parsing-pauses can be caused by: 
* the browser needs to run a `<scripts>` or 
* the browser is forced to wait for the network to deliver the second half of the document content. 

During parser-pauses, the browser *should* make a view based on a *temporary* DOM branch. 
And this *half-way* view *could* in turn benefit from running `slotchange` reactions on the 
temporary DOM branch. Hence, `slotchange` events are run during parser-pauses.

## Why run `slotchange` events *during* parser-pauses?

How so? `slotchange` reactions are most useful to either:
1. the state of the flatDOM-childNodes inform the web component with the `<slot>` element in a way
   that causes the "parent" web component to alter the structure or styles in its shadowDOM, or
2. the state of the parent web component informs and alters the structure or style properties of
   the shadowDOM of the flatDOM-childNodes.

The [HelicopterParentChild](../chapter6_html_comp/Pattern2_HelicopterParentChild) describes this
in more detail. Such uni-lateral or bi-lateral shadowDOM "adjustments" between a web component and
its flatDOM-childNodes are nice to complete as soon as possible, but these changes should not be a 
*make-or-break* requirement of any component, but rather "adjustments". For example, if the numbers 
of list items are updated according to some kind of sequence, then these numbers should replace a 
default value, not an empty space.

## Why *not* run `slotchange` events during parser-pauses?

There is a problem running `slotchange` events during parser-pauses: it is not consistent.

 * If the browser has loaded and registered the definition of a web component *before* a parsing-pause, 
then a shadowDOM and `<slot>` elements may exist and hence trigger `slotchange` events. 
 * If the browser has not yet registered a web component definition, then no shadowDOM, no `<slot>`, 
and no `slotchange` event. 

The state of different web component definitions might be hard to ascertain, as they often depend on 
the order of files being downloaded over the network and browser caching. Therefore, the temporary
DOM branches may vary with questions such as: 
 * is the browser just refreshing, and the page and all the files loaded and cached?
 * how far is it to different resources from the current location, are all the files loaded from the
   same local dev-server for example? 

Running `slotchange` reactions early can therefore give the developer a false or partial understanding 
of the temporary DOM branch contexts `slotchange` events will run against. And the factors influencing 
the makeup of potential, partial, temporary DOM branches are so many and varied they become 
practically impossible to manage.

## Convention: `slotchange` reactions *always after* DCL

> DCL, or `DOMContentLoaded`, is an event that marks the end of the construction of the DOM branch
> of the main document.

Currently, `slotchange` reactions can be processed *before* DCL. This updates the view often.
But, can cause `slotchange` reactions to run several times and against unknown contexts.
What if we instead simply said that **`slotchange` reactions are always processed *after* DCL**?

The benefit of processing `slotchange` reactions after DCL is a consistent, uniform context for 
all initial `slotchange` reactions. 
What you see in HTML (or build in JS), is what your `slotchange` event gets.
There will be no PrematureSlotchange events and no SlotchangeSurprises *before* DCL.

The drawback of running `slotchange` reactions after DCL is that temporary views will not be adjusted.
However, this problem can occur without this convention too, due to other contextual factors. 
And with all `slotchange` reactions delayed, the developer will be alerted about the problems of this
unprocessed state and can alter the CSS and HTML of his files to correct for this behavior. 

## Example: `MyDclSlotCallbackMixin`

We therefore postpone all our `slotchange` callbacks until after DCL. We establish a que
with `<slot>` elements that the DCL will call a `slotCallback(..)` for on the web component later. 
This ensures that one gets no PrematureSlotchange events before DCL.
This que also only stores each `<slot>` element *once*, thus avoiding some redundant 
SlotchangeSurprises.

```javascript
const slotchangeListener = Symbol("slotchangeListener");

function notNipSlip(composedPath, shadowRoot){
  for(let node of composedPath){
    if (node.tagName !== "SLOT")
      return null;
    if (node.ownerDocument === shadowRoot)
      return node;
  }
  return null;
}

let slots = [];

function doCallSlotCallback(slotchange){
  const slot = notNipSlip(slotchange, this.shadowRoot);
  slot && this.slotCallback(slot);
}

function delayCallSlotCallback(slotchange){
  const slot = notNipSlip(slotchange, this.shadowRoot);
  if (!slot || slots.indexOf(slot) >= 0)
    return;
  slots.push(slot);
}

function flushSlots(){
  //todo here we could sort the slots in document order.
  for (let slot of slots) {
    let shadowRoot = slot.getRootNode();
    if (shadowRoot){
      let host = shadowRoot.host;
      host && host.slotCallback(slot);
    }
  }
}
let callSlotCallback;

//First, block flushing of the que until DCL, and on DCL, open the que and try to flush it
if (document.readyState === "loading"){
  callSlotCallback = delayCallSlotCallback;
  window.addEventListener("DOMContentLoaded", function () {
    callSlotCallback = doCallSlotCallback;
    flushSlots();
  });
} else {
  callSlotCallback = doCallSlotCallback;  
}

export function SlotCallbackMixin(base) {
  return class SlotCallbackMixin extends base {
    
    constructor(){
      super();
      this[slotchangeListener] = callSlotCallback.bind(this)
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

This mixin can be run against the 

## References

 * 