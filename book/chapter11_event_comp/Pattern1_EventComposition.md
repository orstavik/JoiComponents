# Pattern: EventComposition

EventComposition is the act of making a new event from one or more other events.
EventComposition is implemented as a single js function added as a global, capture event listener.
Events can be composed using several different patterns. Composed events can be:

1. propagate *trailing* its triggering event(s),
2. propagate *prior to* its triggering event(s),
3. *record* and use the relationship between several triggering events,
4. *synthesize* several different types of triggering events into one,
5. *filter* a single triggering event into another,
6. be *preventable* via the triggering event, or
7. be ***un**preventable* and dispatch inevitably regardless of preventDefault(),

As a rule, composed events do not require any state information outside of the event itself.
However, there are a couple of noteworthy exceptions to this rule.
1. State is stored and used when events are recorded. When composed events are created from a sequence of
   several other events, the PreTriggering events are stored locally in the Triggering function (cf. Pattern: DeepState). 
2. `<base href="" target="">` is used to store state information regarding the interpretation of
   `submit` and `click` events in the DOM. This Pattern is called EventHelper, and it is not recommended.

Some names:
 * Triggering event: an event that will initiate the dispatch a composed event.
 * Composed event: an event that is triggered by another event.
 * PreTriggering event: an event that itself does not dispatch a composed event, 
   but that *can* a) trigger the listening for another trigger event and/or b) be recorded.
 * Preceding event: an event that propagates before another event.
 * Trailing event: an event that propagates after another event.
 * Recorded event: an event that is initiate the dispatch of a composed event for *preceding* events.
 * (Event) Triggering function: a (set of) functions that capture an event.
   Th triggering function is added globally (ie. to `window`), so as to be capture'd as early as possible, 
   even for events that do *not* bubble such as focus, since these events still capture. 

Some principles applies to native HTML events.
1. Calling `stopPropagation()` or to `cancelBubbling` only applies to the current event. 
   These event methods never affect the propagation of other events.
2. Calling `.preventDefault()` will only affect the triggering of trailing composed events 
   (such as `focus` and `submit`) or triggering tasks (ie. tasks added to the event que when an event is triggered,
   ie. the browsing task that is queued when events are ). 
   `preventDefault()` does not affect the propagation of the current event. 
