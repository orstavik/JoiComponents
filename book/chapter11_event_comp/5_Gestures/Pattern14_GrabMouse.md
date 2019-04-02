## Pattern: GrabMouse

> You know I'm automatically attracted to beautiful—I just start kissing them. 
> It's like a magnet. Just kiss. I don't even wait. And when you're a star, they let you do it. 
> You can do anything. Grab 'em by the pussy. You can do anything.
> 
>   From ["Donald Trump *Access Hollywood* tape"](https://en.wikipedia.org/wiki/Donald_Trump_Access_Hollywood_tape)

Sometimes, in the midst of an EventSequence, it can seem as if the mouse has got a will of its own.
Its own behavior or default action that seem to come out of nowhere.
It doesn't happen all the time.
But near some elements, the mouse does something completely unexpected: it selects text. 

When you make an EventSequence, this behavior is often unwanted. You have a completely different agenda,
you are doing something else. So, what do you do? You GrabMouse.

## GrabMouse's defaultAction

To control the defaultAction of text selection by mouse, there is currently one main alternative:
CSS property [`user-select`](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select).

You might have expected that this event would be controlled from JS via `.preventDefault()`
on `mousedown` or `mousemove`, or from HTML as an attribute. But no. The default action of the mouse 
is far harder to both read and understand than that.

First, there are no HTML attributes that directly control mouse events. 
From HTML you must set the `user-select` in the `style` attribute to control mouse events.
                                            
Second, JS controls text selection via `select` events. These events are
composed events triggered by `mousedown`, `mousemove` and `mousemove`. 
But from mouse events they are *unpreventable*, same as `click`: 
Calling `.preventDefault()` on mouse events stops neither their `click` nor `select` native 
composed events.

This could spell trouble. What if the browser already reads, captures, and locks the 
`user-select` CSS property *before* the `mousedown` event is dispatched? Thankfully, it doesn't. 
If you set the `user-select` property during `mousedown` propagation, it *will* control the 
`select` event and text selection behavior.

To dynamically control the actions of mouse events during an EventSequence, we therefore need to:
1. set `user-select: none` on the `<html>` element when the sequence starts (ie. on `mousedown`) and
2. restore the the `<html>` element's original `user-select` value when the sequence ends 
   (ie. on `mouseup` and/or `mouseout`, cf. the ListenUp pattern). 

## IE9: GrabMouse with both hands

`user-select` is only supported by IE10. Thus, if you want to GrabMouse, and you need to include IE9,
you need to "GrabMouse with both hands". First, you specify the `user-select` property as described above.
Second, you add a secondary event trigger for the `selectstart` event and call `.preventDefault()` on 
this event. Grabbing the mouse with both hands like this will ensure that no text selection will occur 
during your mouse-oriented EventSequence.

```javascript
var onSelectstart = function (trigger){                           
  trigger.preventDefault();
}
```

## GrabMouse jailbreak

Sometimes, when handling mouse events, the mouse will breakout from your control. 
When the mouse makes a getaway during one of your EventSequences, you should not attempt to stop it.
When the mouse wants to break free, you should let it. Instead of trying to impose control on it,
which is futile, your EventSequence should simply observe the situation and abort.

To illustrate how mouse events get away from your control in the midst of your EventSequence with it,
we will make a safe `long-press`.

## Example: Safe `long-press`

To make a safe `long-press` we need to GrabMouse first. GrabMouse will prevent native text selection 
behavior from interfering with our custom composed DOM EventSequence. We grab the mouse by adding
the `user-select: none` attribute to the `<html>` element while the EventSequence is active and 
resetting the `<html>` element's `user-select` style property afterwards.
To make extra certain that no text selection will occur, we add an extra event listener on the 
`startselect` event and only call `preventDefault()` on it.

In addition, we do damagecontrol on three potential mouse jailbreaks:

1. The mouse pointer is moved out of bounds (outside of the scope of the window object). 
   An undetected `mouseup` that occurs if the mouse cursor is removed from the viewport of browser window
   when the user "unclicks". To prevent this accident, an extra secondary trigger event listener is added 
   for `mouseout`. If the `mouseout` is taken outside of the viewport of the window, this will cancel the `long-press`.

2. The user triggers the primary trigger function twice, before ending the EventSequence.
   This can happen if the user presses in a second mouse button, after the EventSequence have started. 

3. A script triggers `alert("bad")` while the EventSequence is running.

The resulting composed event trigger function looks like this:

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

var primaryEvent;                                               //[1]
var userSelectCache;                                            //[1]

function startSequenceState(e){                                 //[1]
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup);             
  window.addEventListener("mouseout", onMouseout);           
  window.addEventListener("focus", onFocus);           
  window.addEventListener("startselect", onStartselect);           
  userSelectCache = document.children[0].style.userSelect;
  document.children[0].style.userSelect = "none";
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup);             
  window.removeEventListener("mouseout", onMouseout);           
  window.removeEventListener("focus", onFocus);           
  window.removeEventListener("selectstart", onSelectstart);           
  document.children[0].style.userSelect = userSelectCache;
}

function onMousedown(e){                                        
  if (primaryEvent)                                             //[2]
    resetSequenceState();                                       
  if (e.button !== 0)                                           
    return;
  startSequenceState(e);                                        //[1]     
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    e.target.dispatchEvent(new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         
}

var onMouseout = function (trigger){                            //[3]
  //filter to only trigger on the mouse leaving the window
  if (trigger.clientY > 0 && trigger.clientX > 0 && trigger.clientX < window.innerWidth && trigger.clientY < window.innerHeight)
    return;                                                     
  primaryEvent.target.dispatchEvent(new CustomEvent("long-press-cancel", {bubbles: true, composed: true}));
  resetSequenceState();                                         
}

var onFocus = function (trigger){                           //[4]
  trigger.target.dispatchEvent(new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         
}

var onSelectstart = function (trigger){                           //[5]
  trigger.preventDefault();
  return false;
}

window.addEventListener("mousedown", onMousedown);              
```
1. As the sequence configuration grows in complexity, we create a separate method `startSequenceState(e)`.
   The `startSequenceState(e)` has the responsibility of both ListenUp and TakeNote: 
   setting up listeners and initializing the EventSequence state.
 
2. If the user presses down two mouse buttons at the same time, the `long-press` EventSequence might
   try to initialize itself again while it is already running. 
   This would cause confusion, and so the `long-press` event will cancel itself in such instances.
   
3. If the `mouse` cursor moves out of the `window`, this would likely cause confusion, and so will
   instead also simply cancel the event.
   
4. If an `alert(...)` was triggered during the EventSequence, this would trigger a change of the focus event. 
   Any `focus` event would be considered a disturbance and cancel the EventSequence.
   
5. Extra eventlistener that calls `preventDefault()` on `selectstart` events in case CSS property 
   `user-select` is not supported.

```html
<div id="one">press me</div>
<div id="two">press me too</div>

<script>
document.querySelector("#two").addEventListener("mousedown", function(){
  setTimeout(function(){
    alert("I'm trying to trip things up");
  }, 10);
});

window.addEventListener("long-press", function(e){
  console.log("long-press", e);
});
window.addEventListener("long-press-cancel", function(e){
  console.log("long-press", e);
});
</script>
```

## References

 * [MDN: `focus` event](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event)
 * [MDN: `selectstart` event](https://developer.mozilla.org/en-US/docs/Web/Events/selectstart)
