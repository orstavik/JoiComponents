# Problem: StopPropagationTorpedo

## Native events' propagation sequence

The platform makes two important strategic choices about event propagation:
 
 * All native events *propagate completely and in isolation, one by one*.
   The browser will never trigger an event listener for a native, trailing event before *all* 
   the event listeners for a native, preceding event has been executed.
   This is true for all phases of event propagation (capture, target, and bubble).
   And it is true natively composed events such as `submit` and `doubleclick`.
   
 * Stopping the *propagation* of a native event *will not* affect the propagation and execution of
   any other trailing native event. (Trailing, composed events can be stopped from the triggering
   event, via `preventDefault()`. We will return to that later.)

Combined, these two platform practices have an important consequence for custom events:
**the propagation of a triggering event *should never affect/stop* the propagation of a composed event**. 
This affects *both* native atomic and composed events. 
And this principle of isolated propagation should also follow our custom, composed events.

Thus. We need to see how and when stopping the propagation of a trigger event can torpedo and sink
the dispatch and propagation of a composed event. We call such situations for StopPropagationTorpedo problems.
Below is a simplified demonstration of such scenarios.

## Demo: StopPropagationTorpedo

```html
<h1>hello <a href="#oOo__ps">world</a></h1>
<p>
To test this out, you can comment out all the three torpedo listeners. 
Only then will you get the composed h1-click event.
</p>

<script>
document.querySelector("h1").addEventListener("click", function(e){
  e.stopImmediatePropagation();
  alert("StopPropagationTorpedo 1");
});
</script>

<script>
document.querySelector("h1").addEventListener("click", function(e){
  e.target.dispatchEvent(new CustomEvent("h1-click", {composed: true, bubbles: true}));
});

window.addEventListener("h1-click", function(e){alert("h1-click");}, true);
</script>

<script>
document.querySelector("a").addEventListener("click", function(e){
  e.stopPropagation();
  alert("StopPropagationTorpedo 2");
});
</script>

<script>
window.addEventListener("click", function(e){
  e.stopPropagation();
  alert("StopPropagationTorpedo 3");
}, true);
</script>
```
As this demo illustrate, a custom, composed event can be exposed to manipulations of the
triggering event's propagation: if an event listener happens to call `stopPropagation()` *before*
the triggering function has been called, then the composed event will not trigger (as it should).

Our first obstacle when making custom, composed events is to isolate it from the trigger event's
propagation, and to do so, we will use the EarlyBird pattern.
Later, we will return to how custom, composed events *can be* controlled in coordination with the
triggering event's `.preventDefault()` method.

## References

 * tores
