# Pattern: EarlyBird

## Native events' propagation

The platform makes two important strategic choices about event propagation:
 
 * All native events *propagate completely and in isolation, one by one*.
   The browser will never trigger an event listener for a native, trailing event before *all* 
   the event listeners for a native, preceding event has been executed.
   This is true for all phases of event propagation (capture, target, and bubble).
   And it is true natively composed events such as `submit` and `doubleclick`.
   
 * Stopping the *propagation* of a native event *will not* affect the propagation and execution of
   any other trailing native event; to stop the propagation of trailing composed events, 
   the method `preventDefault()` must be called.

Combined, these two platform practices have an important consequence for custom events:
**the propagation of a triggering event *should never affect/stop* the propagation of a composed event**. 
This affects *both* native atomic events and native composed events alike. 
And, to block a composed event by stopping the propagation of its triggering event is an anti-pattern
that we call the StopPropagationTorpedo;
trailing, composed events *should only be* blocked using the `.preventDefault()` method on the triggering event.

## Pattern: EarlyBird gets the event

But, to make a custom, composed event, you *must* listen for a triggering event during its propagation.
You simply have no choice: how else can you be alerted about its occurrence?
This means that if some event listener in your app happens to a) be triggered 
before your event trigger function and b) call `.stopPropagation()` on the triggering event, 
then your composed event will never propagate. 
This breaks with established protocol that triggering event propagation should not stop composed event,
creates a StopPropagationTorpedo that can cause great confusion and hard to discover bugs in your code.

The only way to ensure that your composed event triggering function is not torpedoed, 
is to make sure that your triggering function captures the triggering event *before* 
any other event listener that might inadvertently call `stopPropagation()`.
As you never with certainty know exactly where and when that might happen,
your best bet is to get there *first*:

```javascript
window.addEventListener("trigger-event", function(e){eventTriggerFunction(e)}, true);
//window.addEventListener("trigger-event", e => eventTriggerFunction(e), true); //works, but not everywhere
//window.addEventListener("trigger-event", eventTriggerFunction, true); does not work!!
```

The above example adds an event listener to the window object for a certain trigger event.
The first trick here is the third argument, `true`.
This `true` specifies that the event listener will be executed during the little-known "capture phase"
(when events propagate *down* the DOM), as opposed to the "normal, bubble phase" 
(when events propagate *up* the DOM).
This means that the `eventTriggerFunction` will be executed during the first stage of 
the trigger event's propagation.

## Example: StopPropagationTorpedo

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
function h1Click(e){                                                
  e.target.dispatchEvent(new CustomEvent("h1-click", {composed: true, bubbles: true}));
}
document.querySelector("h1").addEventListener("click", function(e){h1Click(e);});

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

## Pattern: CallShotgun

In almost all cases, the EarlyBird pattern is enough in itself. 
But, *if* for some mysterious reason:
 * another EarlyBird event listener that 
 * also calls `stopImmediatePropagation()` 
 * is added *before* your event trigger function and
 * you do not want to move your event listener scripts up top as it will delay first meaningful paint,
 
then you can employ another pattern: CallShotgun.

```html
<script>
window.addEventListener("click", function(e){clickEcho(e);}, true);    //1. calling shotgun
</script>
<script >/*Here is the bad, but unavoidable library with an EarlyBirdStopPropagationTorpedo*/
window.addEventListener("click", function(e){e.stopImmediatePropagation();}, true);
</script>

<h1>hello world</h1>

<script >/*Here is your composed event that you would like to load as late as possible.*/
function clickEcho(e){                                                //2. taking a seat
  e.target.dispatchEvent(new CustomEvent("click-echo", {composed: true, bubbles: true}));
}
window.addEventListener("click-echo", function(e){alert("click-echo");}, true);
</script>
```

In the above example the EarlyBird listener function is added *before*
the function is loaded. It calls shotgun. Later, when it is good and ready, 
the app loads and defines the actual function and takes a seat.
Now, if the shotgun happens to be triggered before the event listener function is loaded, 
it would still only result in a silent error / nothing happening.
And as soon as the function is defined, the trigger function would work as intended.
Thus, to CallShotgun with the EarlyBird, the app gracefully avoids the EarlyBird-StopPropagationTorpedo.

> A custom, composed event should be created using the EarlyBird event listener.
> The EarlyBird pattern avoids StopPropagationTorpedoes.
> If you really need, you can CallShotgun also.

## References

 * tores
