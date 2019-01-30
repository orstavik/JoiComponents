# Pattern: ReplaceDefaultAction

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

## References

 * [stackoverflow: `setTimeout(..., 0)`](https://stackoverflow.com/questions/33955650/what-is-settimeout-doing-when-set-to-0-milliseconds/33955673)