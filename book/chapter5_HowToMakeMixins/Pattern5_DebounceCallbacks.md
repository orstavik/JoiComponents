# Pattern: DebounceCallbacks

To "debounce" means to:
1. take several trailing events that by themselves all would trigger one function and 
2. coordinate and collapse these events/triggers so that 
3. they in total only trigger the function once.

Custom elements have several types of events/function triggers that commonly needs to be debounced:

1. **high frequency UI triggers**
2. **render triggers**
3. **network and storage triggers**

This chapter focus on 1. debouncing **high frequency UI triggers**.
Chapter 3.x [Mixin: Render](../../trash/book/chapter3_element_lifecycle/Mixin_render.md)
describes why and how element altering triggers from lifecycle callbacks can be debounced.
Debouncing network and storage triggers is best done via global state observers [Todo write that chapter](). 

## Problem: high frequency UI triggers cause jank

**UI events** such as `touchmove` and `mousemove` can often be triggered at a 
**high frequency** (interval less than 10ms).
Functions triggered by such UI events often trigger changes to the view/DOM.

### Example: JankDraw

JankDraw implements a block is moved around the screen using a dragging gesture based on `touchmove`.
This is implemented by adding an event listener function to every `touchmove` event that 
updates the css properties of the block.
This repositions the block on the screen. Fairly light and simple.

But, JankDraw is a drawing app.
Therefore, the function that reacts to `touchmove` also
adds a non-moving grey boxes for every new position.
As the block moves, this leaves a trail of grey boxes as if the original block was drawing on the screen.
The function is both a little more complex and heavier for the browser to process.

The problem with this extra visual effect is that it becomes heavier for the browser to process.
And, as the `touchmove` events are fired at high frequency, 
the browser now does not manage to complete the setup of a new grey box before the next
`touchmove` is queued and triggers it to make another.
As the browser gets overloaded with work from `touchmove`, 
other tasks and events such as updating, handling user clicks and other actions gets cancelled or 
swamped by a big pile of `touchmove` events.
Our nice visual effect is therefore causing jank.

```html



```
In order to be brief, this example is naive.
A.o. event listeners are not properly managed on connection and disconnection to the DOM. 

## Solution: debounce high frequency UI triggers

Lets say that the `touchmove` events are fired at the browser every 5ms.
But the screen only needs to update every ~16ms (at 60fps).
This means that we only need to call the function that updates the view *once*:
 * approximately every third `touchmove` or 
 * approximately every 16ms or 
 * every time the view updates (a.k.a. "animation frame").

This would mean that we need to:
 * *skip* triggering the update view function two out of three times or 
 * *skip* triggering the update view function if it has been less than 16ms since the last time or 
 * *skip* triggering the function that updates the view directly, but instead:
   1. *place* the trigger to that function in the `requestAnimationFrame` que,
   2. ensure that the trigger is only placed in that que once, 
   3. which essentially means to skip all subsequent triggers as long as a trigger is queued, and
   4. run that function when `requestAnimationFrame` time comes.

"Skipping function calls" is basically what *debouncing* entails.

When the impetus to debounce is due to DOM updates, 
debouncing by queing function triggers using `requestAnimationFrame` is the best strategy.
Using `requestAnimationFrame` is highly efficient, it gives an even flow and exact match to view updates,
and is simple, conventional and familiar to most.

### Example: NaiveDebounceDrag

todo remake the example that illustrate the janking drag with white box shadow with debouncing. 

## Debounce render triggers


## Render time
render time = requestAnimationFrame time.

render time should as far as possible try to avoid triggering functions that:
1. changes the global state of the app
2. triggers network or persistence activity.
if such triggers cannot be avoided, try to ensure that they are triggered indirectly 
so to be run *after* the next page has been rendered.

render time should work DOM tree order, top to bottom, first child to last child(left to right).

render time, shadow dom children should be processed before light dom children.

render time, parents should not react to changes of children if can be avoided.
This is fairly simple in regards to attributes and child elements, but 
it problematic scenarios can arise when elements react to size changes.
Rule of thumb here is changing the dom based on the size of children is a can of worms.


## Debounce network and persistence triggers
triggers that produce network traffic or work against local storage. Or similar.


## Problem 1: Too many callbacks

Often, gestures react to .
The gesture mixin records these events, processes them and then triggers the callback method.

The process of processing the callback method is designed to be as cheap as possible 
(todo but are they cheap enough in old or slow browsers??).
But the callback methods triggered by the gesture can be heavy.
If the callback is called very often, and the reactions triggered by the callback are too heavy,
this can overload the browser causing jerking and lagging behavior.
To avoid such problems, callbacks from gestures needs to be *debounced*,
ie. only processed at a fixed interval.

Another problem is that often several changes to an element might 
trigger the process of rendering that element.
The "render" process is for example populating a shadow dom or
styling either the element itself or its content.

Example you have an element that you create in the template with 3 attributes.
This triggers the constructor + 3 attributeChangedCallback.
And all these four reactive callback methods in turn trigger the render function.
In this case, you want to que the rendering function of the element in rAF the first time,
and in the render function check all the attributes and state of the element and render accordingly.

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

Once debouncing is activated, all callbacks must be debounced (including gestureStart and gestureEnd). 
If not, the order of the callbacks will not be ensured.

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