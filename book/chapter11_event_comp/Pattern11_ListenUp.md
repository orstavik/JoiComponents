## Pattern: ListenUp

The ListenUp pattern limits your cost by adding event listeners as *late as possible*, and not upfront.
The pattern is simple. You have a composed event that listens for two or three different types of events.
These events must occur in a certain order. And therefore you would at first only listen for one primary 
trigger event, and only when this primary trigger event occurs add the event listeners for the secondary 
and final trigger events.

## Example 1: ListenUp `naive-long-press`

The most simple example of a ListenUp composed event is a mouse `naive-long-press`. 
The `naive-long-press` event is dispatched every time the user presses on a target for more than 300ms.
To make the example simple to read, the target pressed must be a leaf DOM element. 
The primary trigger event of the `naive-long-press` event is the `mousedown` event.
The `naive-long-press` only has a secondary trigger event, `mouseup`, and 
the `mouseup` is also the final trigger event that concludes a series.    

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
  primaryEvent = undefined;                                     //[8]
  window.removeEventListener("mouseup", onMouseup);             //[8]
}

function onMousedown(e){                                        //[1]
  if (e.button !== 0)                                           //[3]
    return;                                       
  primaryEvent = e;                                             //[4]
  window.addEventListener("mouseup", onMouseup);                //[4]
}

function onMouseup(e){                                          //[5]
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       //[6]
    e.target.dispatchEvent(new CustomEvent("naive-long-press", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         //[7]
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
   
6. In normal circumstances, the final trigger event function (`onMouseup(e)`) is triggered.
   The final trigger event function will check if the event sequence fits its criteria 
   (ie. press duration > 300ms and the same target), and if so dispatch the composed event.
   
7. Once the final trigger function of the composed event is finished, it resets the event sequence state.

8. Every time the composed event trigger functions reaches its end state, it always resets
    its deep, sequence state. Resetting the state both means clearing stored primary and secondary 
    trigger events, but also, and very importantly, ALWAYS removing the ListenUp secondary event trigger 
    listeners.



## References

 * 