# Pattern: EarlyBird

To make a custom, composed event, you *must* listen for a triggering event during its propagation.
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
//window.addEventListener("trigger-event", eventTriggerFunction, true); cannot be used with the CallShotgun pattern.
```

The above example adds an event listener to the window object for a certain trigger event.
The first trick here is the third argument, `true`.
This `true` specifies that the event listener will be executed during the little-known "capture phase"
(when events propagate *down* the DOM), as opposed to the "normal, bubble phase" 
(when events propagate *up* the DOM).
This means that the `eventTriggerFunction` will be executed during the first stage of 
the trigger event's propagation.

## Demo: `click-echo`

Below is a demo that echoes the demo in StopPropagationTorpedo. 
In this demo however, the `click-echo` event is added at the very beginning of the propagation chain.
This makes it precede and escape the StopPropagationTorpedos.

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
function clickEcho(e){
  e.target.dispatchEvent(new CustomEvent("click-echo", {composed: true, bubbles: true}));
}
document.querySelector("h1").addEventListener("click", clickEcho);

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
