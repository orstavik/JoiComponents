write chapter on:

1. FilteredPriorEvent. Use the link-click as example.

2. MergedEvents (or UnitedEvents). Use the browse and link-click / submit together.

3. EventSequence. Use the long-press as example.

4. CapturedTarget. Use dragging as example. reference setPointerCapture. 

5. CapturedEventType mouse. Extend the dragging example. 
Illustrate how both the preventDefault might be necessary.
Discuss how userSelect none, css properties controlling events. 

5b. CapturedEventType touch. Extend the dragging example to touch. 
Discuss how touchAction none is used. 

6. Add the pattern about conflict management. Go all in hard at the beginning. 
To capture the event type is useful.

7. TrailingEvent. Go back to the long-press example. 
Show how it might seem more "natural" that the order is trailing:
(mouseup, click, long-press), rather than prior: (mouseup, long-press, click). 
Then show how this can only be done via setTimeout. 

7b. Show how TrailingEvents have a problem with default actions. 
Default actions will either always run before the trailingEvent, or must always be blocked. 
This gives two patterns: 
SubstituteEvent, a trailing event that completely replaces the default actions of another event,
in a way so that they cannot be called.
AfterthoughtEvent, a trailing event that comes after both the trigger event and its default actions.

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


demo/test of drag and fling (m)
touch version of drag and fling (m)
demo and test both (m)
make pinchSpin (m) 
make pinchSpin demo (m)
make swipe with demo (m)