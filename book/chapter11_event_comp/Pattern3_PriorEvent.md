# Pattern: PriorEvent

## WhatIs: `preventDefault()`

Events that occur in the DOM can often have a default action associated with them:
`touch` the screen to scroll down; and `click` inside a link to browse. 
To control and block these actions in the app, the browser has added a specialized method
on the events that precede these actions: `preventDefault()`.

However, the default action of browsers is often associated with their own specialized event.
Before the browser actually will scroll, it will dispatch a native, composed `scroll` event
*after* the `touchmove` event and *before* the task of actually scrolling the viewport.
The event order is touchmove (event) -> scroll (event) -> scroll (task).
To call `preventDefault()` on the `scroll` event will cancel the scroll task.
To call `preventDefault()` on the `touchmove` event will cancel the `scroll` event 
which in turn will cancel the scroll task.

> If you don't like the defaultAction of events, you're not alone. This is how the spec itself
> describes it:
> "\[Activation behavior\] exists because user agents perform certain actions for certain EventTarget 
> objects, e.g., the area element, in response to synthetic MouseEvent events whose type attribute is 
> click. Web compatibility prevented it from being removed and it is now the enshrined way of defining 
> an activation of something. "
> [spec](https://dom.spec.whatwg.org/#eventtarget-activation-behavior)

## Native event sequence

Native, composed events always propagate *after* the native triggering event:
`click` propagates *after* `mouseup`; `submit` propagates after `click`.
This order is also intuitive from the point of the developer and app, 
as the trigger event *must* have occured to cause the dispatch of the composed event.
We would therefore like to have the same sequence and causality for custom events.

But, the EarlyBird pattern illustrate how the event triggering functions for custom, composed events 
must be added *before* (as in at the very beginning of) the propagation of the triggering event
to avoid StopPropagationTorpedoes. This creates a tension in custom composed events:
 * how can we make sure that custom composed events propagate *after* their triggering event, 
   while still employing the EarlyBird pattern? 
 * how can we implement the functionality of `preventDefault()` to control
   both trailing, composed events *and* the browsers default actions?

The short answer is: we can't. Not fully. We have to compromise.

This chapter explains why we need to compromise, and what that compromise looks like.
To illustrate the alternatives' pros and cons, we will compose a `click-echo` event.
The `click` event is a good candidate for this discussion as its default action of 
navigating to a new page when a link is clicked, is hard to miss.
All these patterns build on the EarlyBird pattern.

## Pattern: PriorEvent

The PriorEvent pattern propagates the custom composed event *before* the triggering event.

The obvious drawback of this pattern is that it reverses the propagation order of the triggering 
and composed event. The benefit however is that this pattern allows full control of the defaultAction
from both the composed and trigger event. Below is the custom, composed event `echo-click` 
implemented as a PriorEvent and EarlyBird patterns.

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {   //1
  composedEvent.preventDefault = function () {                  //2
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              //3
  target.dispatchEvent(composedEvent);                   //4
}

window.addEventListener(
  "click", 
  function(e) {
    dispatchPriorEvent(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
  }, 
  true
);
```

1. To make the pattern easier to reuse, the `dispatchPriorEvent(target, composedEvent, trigger)` 
   function is split from the EarlyBird event listener.
2. The custom, composed event's `preventDefault()` is overridden with a new method that will 
   both stop both the trailing, triggering event and its `defaultAction`.
3. The `trigger` event is added as a property to the composed event, 
   so that it can be accessed if needed.
4. And the composed event is dispatched synchronously, 
   so that it will start propagating immediately and thus *precede* the triggering event.

```html
<script>
function dispatchPriorEvent(target, composedEvent, trigger) {   //1
  composedEvent.preventDefault = function () {                  //2
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              //3
  target.dispatchEvent(composedEvent);                   //4
}

window.addEventListener(
  "click", 
  function(e) {
    dispatchPriorEvent(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
  }, 
  true
);
</script>

<p>
The demo below illustrate how the PriorEvent works. 
It uses three different event listeners on different elements to control the behavior of 
the composed and triggering event and their default actions.
</p>
<ul>
  <li>you can click me</li>
  <li><a id="a" href="https://normal.com">normal link, will navigate</a></li>
  <li><a id="b" href="https://click-prevented.com">prevented on click, will not navigate</a></li>
  <li><a id="c" href="https://echo-click-prevented.com">prevented on echo-click, will not propagate "click" nor navigate</a></li>
  <li><a id="d" href="https://echo-click-prevented-via-trigger.com">prevented on echo-click via trigger property, propagates click but will not navigate</a></li>
</ul>

<script>
window.addEventListener("click", function(e){alert("click event")});
window.addEventListener("echo-click", function(e){alert("echo-click event")});

document.querySelector("#b").addEventListener("click", e => e.preventDefault());
document.querySelector("#c").addEventListener("echo-click", e => e.preventDefault());
document.querySelector("#d").addEventListener("echo-click", e => e.trigger.preventDefault());
</script>
```

This example illustrate how a fully functional composedEvent->triggerEvent->defaultAction 
sequence can be constructed. The benefit of this pattern is all the events can control the default action,
the drawback of this pattern is that event listeners on the triggerEvent cannot be called 
upon to cancel the composedEvent.

## References

 * [Default browser action](https://javascript.info/default-browser-action)