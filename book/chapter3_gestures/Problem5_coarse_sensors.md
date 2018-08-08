# Problem: Coarse sensors

> TLDR: When touch devices struggle to distinguish between individual and multiple touches,
 users are confused. To avoid this problem in multifinger gestures, users can be signaled the state of touch sensors.

When users place two or more fingers too close, 
touch devices can and will struggle to differentiate between the individual touch points.
You can experience this problem yourself by closing your eyes and ask another individual try to press one or two fingers
in your palm and try to trick you.
The sensors' problem gets bigger when:
* the sensors are fewer and wider apart (worse, older, cheaper),
* the finger gets smaller, and
* the harder/closer the fingers are pressed together.

## Pattern 3: SignalTouchSensorStatus

Coarse sensors is a hardware problem. It cannot be solved in JS.
But, when you use multifinger gestures in your app, 
you can still inform your users of the state of the touch sensors.
By signalling to the user *how many* fingers have been pressed on an element
you can subtly guide them to suit their behavior to their current hardware.

## Implementation 3: 

To signal to the user requires 2 things. First, we require the state of the sensors, last number of touches.
This number we add as an attribute to the element.
Then we need to signal this number to the user, either as direct information, or indirectly as 
* *gradually* thicker borders, 
* darker colors and/or 
* deeper shades 

that corresponds to the number of active fingers.

Adding the sensor state as an attribute can and should be done in a mixin. 
Signaling the sensor state to the user can then simply be done using css rules like this

```css
:host([active-fingers="1"]) {
  border-size: 3px;
}
:host([active-fingers="2"]) {
  border-size: 6px;
}
:host([active-fingers="3"]) {
  border-size: 0;
}
```

## Example/Demo

## References

* Add good reference to the analogue and multiplexed nature of finger muscles and controlling nerves.