# Pattern: InvadeAndRetreat
Here is some really good news for you my reader. With the approach for handling
custom events in this book, this problem is really not that big. Actually, it is quite small.
Firstly, event listeners for touchmove are only added *after* the first touchdown is triggered. 
This means that the touchmove event listeners will not interfere with touchmove events outside of 
the element and scrolling, because they then *do not exist*.
Secondly, in the mixin it is simple to add custom behavior for both intercepting the original 
events. For example: when the event is first triggered, listen for the touchmove on the whole window, 
and not just the element itself or a specific parent. If the event listener was always attached,
this would not be possible as it would be far too invasive. But since the listener is only active
once a certain gesture has been initialized (by for example pressing on a particular element),
the invasiveness becomes only a strength. This "when relevant, invade" pattern, can also be 
applied to restricting other native gestures from starting, as well as capturering events for itself.

The pattern InvadeAndRetreat handles [conflicting gestures](Discussion_conflicting_gestures.md).


The pattern:
1) I have one start composed event that I listen for. The main events, the stiring, 
is not activated.
2) Only when the composed event starts do I add the event listener for the rest of the event.
Now, and only now, is the full scope of the composed event relevant.
3) When I know that my composed event has started, When relevant, I go full in, I invade. 
I listen for subsequent events on the window, so I am 100% sure I capture all of them.
At this time, I can also turn off other responses to these events, so that they cannot interfere 
with my composed event.
This maximum capturering of events and maximum block of events in subsequent event handling,
can be considered a temporary invasion.
4) Once the sequence of my composed event/gesture is complete, we do a full retreat.
We put everything back into place and go out, like we were never there.

## Native composed events and gestures                      

Some composed events you know already.
Click, drag to scroll on mobile, etc.
All these are composed events.


In our soup kitchen, "When Relevant, Invade!" would be equivalent to by default use the knife 
to stir the soup. Then, in short episodes, 
1. take the knife out, 
2. concentrate and quickly chop up one vegetable completely, and 
3. to back to stiring the soup with the knife.




