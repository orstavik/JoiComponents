# Problem: Sloppy fingers

> TLDR:  
Sloppy fingers is the problem accidentally touching the screen with an additional finger.
You solve this problem by triggering gestures using both `touchstart` and `touchend` events.

Many of the muscles and nerves that control finger movement are not isolated to one finger, but 
affect multiple fingers at the same time.
The muscles controlling the ring finger in particular are bound to both the pinky and middle finger.
Adjacent fingers can therefore move unintentionally.

Furthermore, users often use their devices sloppily and under less than ideal conditions.
They might try to perform gestures at strange angles or with one hand or partially out of sight.

Thus, both human biology, human psychology and life in general should indicate that
users often will touch the screen accidentally with an extra finger.
When this occurs, most will simply try to remove the extra, erroneous finger again to correct the mistake.

## Anti-pattern: IgnoreExtraFingers

One way to solve extra fingers touching the screen is simply to "ignore extra fingers".
If the gesture has been activated, any extra `touchstart` events *and* 
any `touchend` events that does not remove any of the triggering fingers are simply ignored.
However, this solution will conflict with other multifinger gestures.
For example, if a two finger gesture employs this strategy, this gesture will come into conflict with
any three finger gestures connected to same parent and/or child element.
This solution is therefore an anti-pattern.

## Pattern: TouchEndAlsoStartGesture

Another way to solve the problem of "sloppy fingers" is to stop the gesture while any extra finger is 
touching the screen, but to enable the gesture to restart when the extra finger is removed.
This method stops the gesture whenever an accidental touch/extra finger gets into contact with the screen,
but as soon as the extra finger is removed, ie. a `touchend` event is triggered, the multifinger gesture reactivates.
This pattern we call `TouchEndAlsoStartGesture`, and
it works by checking and activating/deactiving the gesture from all `touchstart` and `touchend` events.
This simple, general solution both avoids conflict with other events *and* allows users to correct it, 
thus maximizing gesture ergonomics at minimal cost. 

## References