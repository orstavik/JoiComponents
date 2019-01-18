# Pattern: AfterthoughtEvent

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

## References

 * [stackoverflow: `setTimeout(..., 0)`](https://stackoverflow.com/questions/33955650/what-is-settimeout-doing-when-set-to-0-milliseconds/33955673)