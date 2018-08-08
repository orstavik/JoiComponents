# Pattern: DebounceCallbacks

## Problem 1: Too many callbacks

Often, gestures react to *high frequency* events such as `touchmove` and `mousemove`.
The gesture mixin records these events, processes them and then triggers the callback method.

The process of processing the callback method is designed to be as cheap as possible 
(todo but are they cheap enough in old or slow browsers??).
But the callback methods triggered by the gesture can be heavy.
If the callback is called very often, and the reactions triggered by the callback are too heavy,
this can overload the browser causing jerking and lagging behavior.
To avoid such problems, callbacks from gestures needs to be *debounced*,
ie. only processed at a fixed interval.

## Problem 2: The app still needs access to the debounced events after the fact.

But, even though the app might need to debounce processing of callbacks,
it still might need to access the data of the debounced events.

A good example of such a use-case is an app that uses a dragging gesture to draw a line.
The drawing app cannot afford to update the DOM based on every `touchmove` and `mousemove`
that drives the dragging gesture, as the task of updating the DOM is too expensive. 
The app therefore debounces the drag gesture to once every `animationFrame`.
However, the drawing app wants to preserve as much detail about the users dragging gesture so
as to create a curved line that as closely as possible matches the user's finger motion.
Therefore, the drawing app wants access the details about the `touchmove` and `mousemove`
events that were skipped (debounced).

Therefore, the data about the debounced events should therefore be cached by the gesture mixin in an array.
When the mixin method is triggered, these data can be made accessible as a parameter in the callback.
This parameter should include an array with all the event data since last callback
stored latest first.

## Solution: Debouncing callbacks once per n-th animationFrame

There are several different means to debounce a function call.
The primary means to do so would be to only process the function call once per `animationFrame`.
This would ensure that gestures that changes the DOM are only run once per DOM change.

To achieve this effect, the following steps are made:
1. when the callback is triggered, a private property `debounced` is checked.
2. if `debounced` is false, a call to a `callbackTriggerFunction` is queued
using `requestAnimationFrame` and `debounced` is set to true.
3. the data of the event is added to an array private to the mixin `debouncedData`.
No other processing is performed at this point.
4. when the `callbackTriggerFunction` runs, 
it completes the processing of the eventData, passes this data along with all the debounced event data to the callback
and then resets/empties the `debouncedData` array.

Debouncing callbacks using `requestAnimationFrame` can be performed every n-th requestAnimationFrame if needed.
This solution requires the `requestAnimationFrame` to be wrapped recursively like so:

```
const triggerCallback = function(n, cb){
  n > 0 ? requestAnimationFrame(function(){triggerCallback(n-1, cb);}) : cb();
}
```

## Alternative solution: Debouncing callbacks every setTimeout ms or every n-th time

Other strategies to debounce callbacks might be to rely on setTimeout or simply using the count of callbacks.
These strategies are more relevant in situations where you want to save/persist user actions on a server for example.
In such cases, you do not want to react to the callback very often, you might only wish to save only every 
10 changes and/or 3000ms after the last change.

However, although relevant, these debounce strategies should most often be performed at a different
level than in the gesture itself.
Therefore, the implementation of the gesture and gesture mixin does not provide such debounce facilities.

## References
 * dunno