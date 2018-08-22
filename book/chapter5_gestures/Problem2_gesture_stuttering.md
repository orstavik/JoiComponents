# Problem: GestureStuttering

> TLDR: GestureStuttering occurs because users can place multiple fingers on the screen 
either simultaneously or in quick succession.
To tackle this problem gestures relying on `touch` events need to listen for `touchstart` and 
`touchend` events, and gestures need a `cancelGesture()` method.

Often, when a user initiates a multifinger gesture, 
he will place all the necessary fingers on the screen at the same time.
However, sometimes, instead of putting several fingers down on the screen at the exact same time,
a user might place his fingers on the screen in rapid succession.

For example, a user intends to perform a two-finger drag.
When the user places two fingers on the screen,
he might put one finger down slightly before the other finger.
This triggers *two* sequential initiating `touchstart` events, one for each finger.
However, next time the user's fingers might be more in sync, and both fingers are registered simultaneously.
This triggers only *one* single initiating `touchstart` event.

## Solution: IgnoreThenDoubleCheckAndCancel 

To solve this problem we simply ignore any irrelevant stutters. 
This means to simply not start recording any gesture actions 
if the potential trigger event (ie. `touchstart` or `touchend`)
does not correspond with the required number of active fingers/touches.

However, this solution has two consequences:
 1. The start of the gesture is registered when the last required trigger event occurs.
 2. The app might need to differentiate between gestures or cancel gestures
 depending on the delay between the triggering events.

In most cases, these consequences are not relevant.
Thus, to simply ignore irrelevant stutter is works fine, and 
for mixins and other generalized gesture implementation, 
gesture stuttering should therefore simply be ignored.

But, a few use-cases need more precise timing.
In such cases, additional event listeners for the gesture triggering events (ie.  `touchstart` and `touchend`)
can be added that records the time for other trigger events.
And, if this information about the triggering conditions is used to filter out the gesture,
a generalized implementation for gesture mixin should therefore provide a `cancelGesture()` method.

As both the gesture and the timing method listen to the same trigger event,
the function that cancels the gesture might be invoked before the function that starts the gesture.
It would be too fragile to base such a mechanism on the order of these event listeners.
Therefore, `cancelGesture()` needs to pass the trigger event as a parameter to the
gesture implementation: `cancelGesture(triggerEvent)`.
This triggerEvent is then cached by the gesture so that later trigger events can be filtered out against it.

## References

* dunno