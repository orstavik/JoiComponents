# Problems: Sloppy fingers, accidental touches and coarse sensors

Users can make small mistakes and variations when using multiple fingers to make gestures.
The first problem is the small mistake of accidentally touching the screen with an additional finger while
 making a gesture.
The second problem is the variations that can occur as a user places his/her fingers on the screen
in quick succession instead of all at the same time.
In addition, a third problem is that sensors of touch devices can be too coarse to 
distinguish between individual touches in some situations.

This chapter presents these problems and how to address them.

## Problem 1: Sloppy fingers

Often, when a user initiates a multifinger gesture, he will place all the necessary fingers on the screen at the same time.
However, sometimes, instead of putting several fingers down on the screen at the exact same time,
a user might place his fingers on the screen in rapid succession (Problem 1: sloppy fingers).

For example, a user intends to perform a two-finger drag.
When he places his two fingers on the screen,
he might put one finger down slightly before the other finger.
This will therefore trigger *two* sequential initiating `touchstart` events, one for each finger.
The next time, the user's fingers might be more in sync, and both fingers will be registered at the same time.
This will only trigger *one* single initiating `touchstart` event.

The **basic solution** to this problem is to listen for all `touchstart` events and simply ignore any 
such event that does not list *only* the required touches. 
But, this solution has two consequences:
1. The start of the gesture is registered when the second finger touches the sensor, and not the first.
2. The application might wish to ignore and/or differentiate between sequential `touchstart` events 
depending on the delay between the initiating `touchstart` events.

When implementing a multi-finger gesture in a mixin, the basic solution provides enough detail.
If the element/app needs more precise timing,
then the element can simply listen for the latest (or all) `touchstart` (or `touchend`) event directly. 
This will provide the necessary timestamps needed as data or as input to filter gesture 
based on the delay between initiating events.

## Problem 2: Accidental touches

While making a gesture, a user might accidentally touch the screen with an additional finger.
Many of the muscles and nerves that control finger movement are not isolated to one finger, but 
actually affect multiple fingers at the same time.
The muscles controlling the ring finger in particular are bound to both the pinky and middle finger.
Furthermore, users often use their devices under less than ideal conditions.
They might try to perform gestures at strange angles or with one hand or partially out of sight.
Therefore, developers should anticipate that users often will touch the screen accidentally with 
an extra finger, and then try to correct this error by simply removing the extra finger.

To tackle the scenarios where a user accidentally touches the screen with an extra finger,
there are two basic solutions.
1. If the gesture has been activated past some threshold, ignore any future `touchstart` and `touchend` 
event that does not displace any of the original fingers that initiated the gesture.
However, this solution can cause conflict with other multifinger gestures and 
also require a customized threshold.
2. Activate the gesture using both `touchstart` and `touchend` events.
This solution will stop the gesture while the accidental touch/extra finger is in contact with the screen,
but as soon as the extra finger is removed, ie. a `touchend` event is triggered, 
the multifinger gesture reactivates.
This provides a simple, general solution that both indirectly informs the user of their accidental touch 
and allows the user to simply correct it. 

## Problem 3: Sloppy sensors

When users place two or more fingers too close, 
touch devices can and will struggle to differentiate between the individual touch points.
You can experience this problem yourself by closing your eyes and ask another individual try to press one or two fingers
in your palm and try to trick you.
The sensors' problem gets bigger when:
* the sensors are fewer and wider apart (worse, older, cheaper),
* the finger gets smaller, and
* the harder/closer the fingers are pressed together.

This is a hardware issue. This problem cannot be solved in JS alone.
But, when you use multifinger gestures in your app, 
you can still guide your user and inform them of the system state.
A good idea might be to signal to the user *how many* fingers are active in a gesture using for example
*gradually* thicker borders, darker colors and/or deeper shades that correspond to the number of fingers active.

