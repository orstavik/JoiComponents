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

You might have expected that this event would be controlled from JS via the [`.preventDefault()`]() 
of `mousedown` or `mousemove`, or from HTML as an attribute. But no. The default action of the mouse is
far harder to both read and understand than that.

First, there are no HTML attributes to control mouse events, you can only control it from HTML via 
adding the CSS property `user-select` to the `style` attribute.
                                            
Second, from JS you can control text selection via a separate event `select`. This event could be
understood as a composed event that should be preventable from its preceding `mousedown` and `mousemove` event,
but it isn't. The `select` event is unpreventable and will in the same way as `click` is dispatched 
regardless of any `.preventDefault()` calls on its preceding `mouseup` event.

This could spell trouble. If the `user-select` CSS property was read, captured, and locked *before* 
the `mousedown` event was dispatched. However, it is not. If you set the `user-select` property during
the trigger event function for `mousedown`, you will control the text selection behavior.

To control the actions of mouse events during an EventSequence, we therefore need to:
1. set `user-select: none` on the `<html>` element when the sequence starts (ie. on `mousedown`) and
2. restore the the `<html>` element's original `user-select` value when the sequence ends 
   (ie. on `mouseup` and/or `mouseout`, cf. the ListenUp pattern). 

However. `user-select` is an experimental technology and not supported by old IE.
And the `select` event is. To ensure maximum control, adding a secondary event trigger for the `selectstart`
event and calling `.preventDefault()` on this event will ensure that no text selection will occur 
during your mouse-oriented EventSequence.

## GrabMouse's getaways

Sometimes, when handling mouse events, the mouse will breakout from your control. 
When the mouse tries to getaway from your control, you should not attempt to stop it.
When that happens, you need to abort your current EventSequence and reset the situation.
But, you must detect when the mouse escapes you, so that you asap can politely excuse yourself and 
restore normality.

To illustrate how mouse events get away from your control in the midst of your EventSequence with it,
we will make a safe `long-press`:

## Example: Safe `long-press`

There is three "accidents waiting to happen" that likely can trip up our `naive-long-press` from the 
previous chapter.:

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

var primaryEvent;

function resetSequenceState(){
  primaryEvent = undefined;                                     //[10]
  window.removeEventListener("mouseup", onMouseup);             //[10]
  window.removeEventListener("mouseout", onMouseout);           //[10]
}

function onMousedown(e){                                        //[1]
  if (primaryEvent)                                             //[8]
    resetSequenceState();                                       
  if (e.button !== 0)                                           //[3]
    return;                                       
  primaryEvent = e;                                             //[4]
  window.addEventListener("mouseup", onMouseup);                //[4]
  window.addEventListener("mouseout", onMouseout);              //[4]
}

function onMouseup(e){                                          //[5] (a)
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       //[6]
    e.target.dispatchEvent(new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         //[7]
}

var onMouseout = function (e){                                  //[5] (b)
  //filter to only trigger on the mouse leaving the window
  if (trigger.clientY > 0 && trigger.clientX > 0 && trigger.clientX < window.innerWidth && trigger.clientY < window.innerHeight)
    return;                                                     //[9]
  primaryEvent.target.dispatchEvent(new CustomEvent("long-press-cancel", {bubbles: true, composed: true}));
  resetSequenceState();                                         
}

window.addEventListener("mousedown", onMousedown);              //[2]
```
1. The event trigger function for the primary event is set up.
 
2. The event trigger function for the primary event is registered. This subscription will always run.
   Every time there is a `mousedown`, there will be a cost for processing the long-press event.
   
3. As its first check, the primary event trigger function (`onMousedown(e)`) will filter out
   `mousedown` events that are not left-clicks.
   
4. In normal circumstances, the primary event trigger function (`onMousedown(e)`) will store the
   trigger event and then add the trigger event functions for the secondary trigger events.
   
5. The secondary trigger event functions are defined as function objects, as all JS functions are.
   To highlight that there is no difference between explicitly and implicitly assigning the functions 
   objects to variables: (a) does so explicitly and (b) does so implicitly.
   
6. In normal circumstances, the final trigger event function (`onMouseup(e)`) is triggered.
   The final trigger event function will check if the event sequence fits its criteria 
   (ie. press duration > 300ms and the same target), and if so dispatch the composed event.
   
7. Once the final trigger function of the composed event is finished, it resets the event sequence state.

8. The first measure to prevent an accident, is to check that no existing event sequence state 
   is active when the first click is registered. For the simplicity of the example, this check does not
   dispatch an error event, but just resets the event state.
   This is done primarily to avoid leaving extra event listeners active.
   
9. The second measure to prevent an accident, is to check and cancel the long-press event whenever
   the mouse leaves the viewport of the window.
   
10. Every time the composed event trigger functions reaches its end state, it always resets
    its deep, sequence state. Resetting the state both means clearing stored primary and secondary 
    trigger events, but also, and very importantly, ALWAYS removing the ListenUp secondary event trigger 
    listeners.

## References

 * 