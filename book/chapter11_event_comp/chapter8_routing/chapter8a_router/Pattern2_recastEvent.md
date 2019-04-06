# Pattern: RecastEvent

Something is happening. You can feel it. You can't put your finger on it exactly, but you know it to be so.
The problem is that it is not exactly clear what *it* is. 

This happens with events. Especially with all the myriad of events that are involved in navigation.
You can see that the browser loads new pages and scrolls to different locations. 
And you roughly know how it is happening. But, there are so many different HTML elements and DOM events 
that trigger navigation. And a so many JS functions.

Navigation is happening. You can feel it and see it. But you feel you can't pin it down.

## 1:1 vs. n:1^2

With navigation events, there are two sources of the unwanted diversity.
On the one hand, several different events can all be a navigation event: `click`, `keypress` and `submit`.
On the other hand, only a select few of the `click` and `keypress` events are meant as navigation events.
Why this diversity? Why could there not be *one* event that would *always* mean navigation?

Why indeed! When you think about it, there really is no principle reason why there should *not* be
one dedicated navigation event. An event that carried the signal from the DOM to the native browser 
to navigate. The problem is not really *if* there should be such an event. 
The problem is:
 * *How* can we create such a navigation event?
 * *What* should such a navigation event look like?

## How to turn n:1^2 into 1:1?

First, we have an original event such as `click` that sometimes can be a navigation event.
If the user clicks on (a child of) an `<a href="...">` element, the `click` will cause navigation.
But when the user `click` on non-link elements, the `click` event is *not* a navigation event.
Our first order of business is therefore to *filter* the `click` events to identify the navigation events 
among them. This will turn **n click events** into **click navigation event**.
Second, the three events `click`, `keypress` and `submit` can all be a navigation event.
To capture all of these events as one, we need to recast them under a common name.
This will turn **3 different events** into **1 event**.

By first *capturing* and *filtering* a myriad of different `click`, `keypress` and `submit` events,
and then *rename* and *wrap* them as a new, unary navigation event we can turn an event complex 
with **n:1^2** diversity into an atomic **1:1** event. This is the RecastEvent pattern.

## What should a RecastEvent look like?
There are several issues concerning how a RecastEvent should look:

### RecastEvent.target
What should be its target? Should the recast event be dispatched top level, on the 'window', 
on the original event's `target`, or on some other element?

The answer is that the target of the RecastEvent should be the element from where the RecastEvent
originates. For example, a `click` event that originates from a `<div>` inside a `<a href="...">`,
will have its `target` the `<div>`. However, if this `click` event is recast as a navigate event, 
then that navigation event originates from the `<a href="...">`.
 
Why? Why change the target? Or why not just dispatch the recast event on the top `window` object, 
if you only intend to listen for it there?
The reason is that the principle that "events should be dispatched on the element from where they 
originate" is a core concept of the DOM and events. And there are good reasons for this.

First, why not dispatch as low as possible? When a `click` on the `<div>` triggers the 
parent `<a href="...">` element that in turn dispatch a new navigation event. 
It is the `<a>`, and not the `<div>`, that brings the linking behavior into the HTML template.
When a parent element receives a navigation event, they will likely need to get a hold of the `<a>`,
and not the `<div>`. It is the responsibility of the element with the linking behavior to interpret
the underlying, driving event, and process the relevant data as event detail information.
This makes for a clean division of responsibility: the *navigation element* processes all internal
*navigation-triggering events* and dispatches the external *navigation event*.

Second, by dispatching events down in the DOM, events (and event interpretation) can be *composed*
using HTML, not only JS.
Events that bubble up the DOM can be stopped, filtered, altered, and recast by parent elements.
Composing HTML elements in a certain order can thus influence this two-sided coin:
* what final event that reaches the top level and native browser looks like and
* how the app interprets a primitive event.

The target of a RecastEvent is therefore the DOM element that specify the recast behavior in the DOM.
For recast navigation events, this is the `<a href="...">`, `<area href="...">`, and `<form action="...">`
elements. 

### RecastEvents should wrap the original event

The RecastEvent pattern filters and collocate other events. Other patterns such as EventRecording
does similar things, but in addition to pure filtering and renaming, they use (deep) state data or 
dispatch several different events from a single originating event. 
RecastEvents are unary, 1:1. 

The unary relationship between original and recast event, also gives the RecastEvent a clearer 
*wrapping* or *tail* function: the recast event either replaces or directly follows the original event.
This means that many properties and methods of the original event can be masked by the RecastEvent. 
The unary relationship will cause no conflict nor confusion if the RecastEvent calls `preventDefault()`
or `stopPropagation()` on the masked, original event, if appropriate.

### Events are immutable

Events are immutable. If you need to change them, you should stop it propagating, wrap it, and 
recast the wrapper event.
