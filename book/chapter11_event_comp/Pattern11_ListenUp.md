## Pattern: ListenUp

The ListenUp pattern limits your cost by adding event listeners as *late as possible*, and not upfront.
The pattern is simple. You have a composed event that listens for two or three different types of events.
These events must occur in a certain order. And therefore you would at first only listen for one primary 
trigger event, and only when this primary trigger event occurs add the event listeners for the secondary 
and final trigger events.

## Example 1: ListenUp `long-press`

The most simple example of a ListenUp composed event is a mouse `long-press`. 
The `long-press` event is dispatched every time the user presses on a target for more than 300ms.
To make the example simple to read, the target pressed must be a leaf DOM element. 
The primary trigger event of the `long-press` event is the `mousedown` event.
The `long-press` only has a secondary trigger event, `mouseup`, and 
the `mouseup` is also the final trigger event that concludes a series.

There is one "accident waiting to happen" that likely can trip up the `long-press`: 
an undetected `mouseup` that occurs if the mouse cursor is removed from the viewport of browser window
when the user "unclicks". To prevent this accident, an extra secondary trigger event listener is added 
for `mouseout`. If the `mouseout` is taken outside of the viewport of the window, 
this will cancel the `long-press`. 

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
  if (trigger.button !== 0)                                     //[3]
    return;                                       
  if (primaryEvent)                                             //[8]
    resetSequenceState();                                       
  primaryEvent = e;                                             //[4]
  window.addEventListener("mouseup", onMouseup);                //[4]
  window.addEventListener("mouseout", onMouseout);              //[4]
}

function onMouseup(e){                                         //[5] (a)
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       //[6]
    e.target.dispatchEvent(new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         //[7]
}

var onMouseout = function (e){                                   //[5] (b)
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