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

## Pattern: AfterthoughtEvent

The AfterThoughtEvent is a custom, composed event that is dispatched *after* the triggering event.
The event triggering function is added as an EarlyBird event listener, and 
so the propagation of the AfterthoughtEvent must be postponed until *after* the propagation of the 
triggering event has completed. `Promise.resolve().then(...)` cannot be used to accomplish this,
as that micro tasks will be dispatched *before* the next event listener.
`requestAnimationFrame(...)` is also useless for this purpose. 
And so that leaves us with `setTimeout(..., 0)` as our main alternative.

In many ways, the `setTimeout(..., 0)` works as we intend. It will allow all the event listeners
on the triggering event to complete before the task of propagating the custom, composed event,
and as we are using the EarlyBird pattern that custom composed event propagation will be next in line
(most likely, but not surely). Below is an implementation of the `echo-click` using the AfterthoughtEvent pattern.

```javascript
function dispatchAfterthoughtEvent(target, composedEvent, trigger) {               
  composedEvent.trigger = trigger;
  return setTimeout(function(){!trigger.defaultPrevented && target.dispatchEvent(composedEvent)}, 0);
}

window.addEventListener(
  "click", 
  function(e) {
    dispatchAfterthoughtEvent(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
  }, 
  true
);
```

But. The `setTimeout(..., 0)` has one big drawback.
It not only completes the propagation of the triggering event *before* the composed event;
it also completes default action task *before* the composed event.
This gives the following event-and-task sequence: triggerEvent-defaultAction-composedEvent.
This is *not* intuitive, and can cause bugs as described below.

```html
<script>
function dispatchAfterthoughtEvent(target, composedEvent, trigger) {               
  composedEvent.trigger = trigger;
  return setTimeout(function(){!trigger.defaultPrevented && target.dispatchEvent(composedEvent)}, 0);
}

window.addEventListener(
  "click", 
  function(e) {
    dispatchAfterthoughtEvent(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
  }, 
  true
);
</script>

<p>
This demo below illustrate how the AfterthoughtEvent works and its problem relating to defaultActions. 
It uses only two event listeners on two elements to show how the defaultActions cannot be
controlled from custom, composed AfterthoughtEvents.
</p>
<ul>
  <li>click me, i will echo click</li>
  <li><a id="prevented" href="https://bbc.com">click me, i will prevent both the echo and the navigation</a></li>
  <li><a href="https://bbc.com">normal link, will navigate</a></li>
</ul>

<script>
window.addEventListener("click", function(e){alert("click event");});
window.addEventListener("echo-click", function(e){alert("echo-click event");});
window.addEventListener("echo-click", function(e){e.trigger.preventDefault();}, true);  //trying in vain to prevent browsing
document.querySelector("#prevented").addEventListener("click", function(e){
  e.preventDefault();
});
</script>
```

 * As the AfterthoughtEvent propagates, it is too late to `preventDefault` of the triggering event.
   The browser might sometimes que and run the `alert("echo-click event");` task, but 
   it will regardless and inevitably load the new page. 
   There is simply no way to que a composed event to propagate *after* the propagation of the trigger
   event, but still *before* the scheduling the defaultAction.

So, while the event sequence order between the trigger event and the composed event is intuitive,
the order of the defaultAction is scrambled. The AfterthoughtEvent is thus *not* suited when the 
trigger event has a defaultAction, and should only be used when *none* of the triggering events 
has a defaultAction.

> Old draft: The benefit of the AfterthoughtEvent is that it follows the intuitive, conventional event sequence
propagating the trigger event first, and the composed event second. 
But, this "intuitive" order does not apply to the triggering events default action.
In fact, to get the composed event to propagate after the triggering event, 
the default action will be executed *before* the composed event.
This can and will be confusing in many 

## Pattern: ReplaceDefaultAction

Another possibility is to *always block* the defaultAction of the triggering event.
This gives us the clear benefit of a consistent event sequence, but 
the clear benefit of always loosing the native composed events or the native default action.

```javascript
function replaceDefaultAction(target, composedEvent, trigger) {               
  composedEvent.trigger = trigger;
  trigger.stopTrailingEvent = function(){
    composedEvent.stopImmediatePropagation ? 
      composedEvent.stopImmediatePropagation() :
      composedEvent.stopPropagation();
  }
  trigger.preventDefault();
  return setTimeout(function(){target.dispatchEvent(composedEvent)}, 0);
}

window.addEventListener(
  "click", 
  function(e) {
    replaceDefaultAction(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
  }, 
  true
);
```

This pattern is safe, but limited. Use this pattern only when you desire to capture all the 
triggering events.

```html
<script>
function replaceDefaultAction(target, composedEvent, trigger) {               
  composedEvent.trigger = trigger;
  trigger.stopTrailingEvent = function(){
    composedEvent.stopImmediatePropagation ? 
      composedEvent.stopImmediatePropagation() :
      composedEvent.stopPropagation();
  }
  trigger.preventDefault();
  return setTimeout(function(){target.dispatchEvent(composedEvent)}, 0);
}

window.addEventListener(                                       
  "click", 
  function(e) {
    replaceDefaultAction(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
  }, 
  true
);
</script>

<p>
This demo below illustrate how the ReplaceDefaultAction works, and how it always blocks the defaultAction.
</p>
<ul>
  <li>click me, i will echo click</li>
  <li><a href="https://bbc.com">click me, i will echo, but not navigate</a></li>
  <li><a id="prevented" href="https://bbc.com">click me, I will neither echo nor navigate</a></li>
</ul>

<script>
window.addEventListener("click", function(e){alert("click event");});
window.addEventListener("echo-click", function(e){alert("echo-click event");});
document.querySelector("#prevented").addEventListener("click", function(e){
  e.stopTrailingEvent();
});
</script>
```

## References

 * 

13. **TrailingEvent**. Go back to the long-press example. 
   Show how it might seem more "natural" that the order is trailing:
   (mouseup, click, long-press), rather than prior: (mouseup, long-press, click). 
   Then show how this can only be done via setTimeout. 

14. **TrailingEventProblem**
   Show how TrailingEvents have a problem with default actions. 
   Default actions will either always run before the trailingEvent, or must always be blocked. 
   This gives two patterns: 
   **SubstituteEvent**, a trailing event that completely replaces the default actions of another event,
   in a way so that they cannot be called.
   **AfterthoughtEvent**, a trailing event that comes after both the trigger event and its default actions.

   Both of these patterns are problematic.
   Many events have "highly disturbing" default actions: 
   click (navigate), mouse (text selection), touch (scrolling). 
   Make a complete list of all important defaultActions. 
   SubstituteEvent can be used in some cases here; 
   AfterthoughtEvent pattern is rarely suited for these events.
   Composed events often need to controll so as to block the default actions of its trigger events.
   The benefit of "natural" event order thus often gets ecplised by the drawbacks of 
   the problems and complexity controlling the default actions of the trigger events.
   Thus, our own opinion is that the simplicity and control of default action that PriorEvents give
   always outweigh the "natural" order that TrailingEvents provide. Thus, we don't use TrailingEvents. 
 
## old drafts
the sequence when it comes to 
custom composed events must either:
 * propagate *before* their triggering event, or
 * be delayed asynchronously in order to propagate *after* their triggering event.

The "natural" order of the event propagation in the DOM is the natively established order:
`mouseup` then `click`; trigger event then composed event.
However, there is *no* way to delay the triggering of an event 
until both:
1. *after* the triggering event has finished its propagation, but also 
2. *before* the default action of the triggering event has been executed.

The consequence of this dilemma means that custom, composed events that are made to propagate *after*
a triggering event needs to either:
1. prevent the default behavior of the native, triggering event, thus resulting in a DOM sequence like this:
   triggerEvent->composedEvent->butNoTriggerDefaultAction, or
2. allow the default behavior of the native, triggering event to conclude before the custom, composed 
   event's propagation: triggerEvent->triggerDefaultAction->composedEvent.           
   
This both limits the possibilities and complicates all aspects of custom, composed events.
And therefore, this chapter therefore advocate using the PriorEvent strategy:
composedEvent->triggerEvent->triggerDefaultAction.
The PriorEvent strategy yields an unnatural event sequence in the DOM:
it is as if `click` propagates before `mouseup`. 
However, as the complexity of the creation, use, and debuggability for custom, composed events
greatly lessen using this strategy, our opinion and advice is therefore to adhere to the
PriorEvent pattern always and consistently. The answer to our second strategic choicepoint is therefore:
**I dispatch the composed event so that it propagates the DOM *prior to* the triggering event.**

