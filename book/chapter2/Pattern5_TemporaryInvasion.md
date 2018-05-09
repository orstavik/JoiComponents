# Pattern: InvadeAndRetreat
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




