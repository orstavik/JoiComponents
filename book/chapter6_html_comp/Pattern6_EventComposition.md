# Pattern: EventComposition

Events are messages that are passed from HTML (and inline SVG) elements in the DOM.
From the point of view of the element that sends it, event messages has no fixed receiver.
But, events are always sent directly upwards in the DOM, not downwards nor sideways,
and so when you "compose HTML elements", you are also "composing an ordered event reception chain".

When the developer composes his HTML document of HTML elements,
this event composition chains actually perhaps the most important thing on his mind (or subconsciousness).
The organisation of HTML elements in the code is also very important for how the resulting web page 
looks 1) from the outside for the user and 2) from the inside for the developer (logical code).
Sometimes, these requirements contradict eachother, and then the developer needs to:
1. use JS to manipulate the flow of events,
2. use CSS to manipulate the view, or
3. use his imagination to understand his app from a different perspective.

## Are events immutable?

The simple answer is no. Two main actions of events are intended to be mutated, namely:
1. `stopPropagation()`
2. `.preventDefault()`

In addition, most other attributes of event objects can be altered along the way.

Todo max:
The detail can be altered, but can the target be changed? can the type be changed? what parts of an event is immutable?

The advice is however: "yes". You *should* treat HTML events as immutable. And there are two reasons:

1. If the event also implies a default action by the browser, 
that default action will look to the content of the DOM, and *not* the content of the DOM
when executed. Thus, if you (look to) change the content of the event to influence the default action,
you will not be effective unless changes of the event by some unintended side-effect also 
at the same time altered one or more elements in the DOM.

2. When events are (considered) immutable, changing the content of the event will require you to
a) stop the original event and dispatch a new one (that either wraps the original events default action
or stops it).
This will give you the benefits of immutability, which can greatly aid both efficiency improvements via dirty checking
and added control during bug finding missions. Which is particularly important when objects are passed 
between different modules of code, exactly like events are.

Thus, events should be treated as if they were immutable.

## How to compose with immutable HTML events?

Ok, lets summarize. HTML elements travel upwards, step by step in the DOM.
HTML elements should be treated as immutable.
So, what does composition of HTML events imply?

When you put an element inside another element in the DOM, the inner element can dispatch an event.
However, as this event propagates upwards, you might wish to compose it, you might wish that the outer element
adds some kind of color to that event. In such a way, the inner and outer HTML elements would thus come together
to jointly make and shape the final event.
HTML composition thus means that HTML elements can add their own "color" to an event that bubbles up the DOM.

As the event object should be treated as immutable, this means that if the outer element wishes to change 
the event, it either must a) change the underlying DOM that the event object reference too or b)
stops, wraps, spawns, reduces, records or otherwise alter the incoming event without changing the original object.
a) is a bad solution, as it would create very tight coupling between the outer element that interprets the event
towards the inner element that dispatches it.
Thus, b) is the better option.

## How to alter immutable HTML events?

There are several ways to alter immutable events:

1. Single-stop-event. To single-stop an event is to only stop its propagation.
   The event will essentially be removed/deleted from your application, 
   but it will still let the browsers default behavior/action to execute.
   This is an antipattern DefaultActionTrojanHorse when used at a low point in the DOM.
   
2. Double-stop-event. Although an event object cannot be deleted per se, to both
   a) stopPropagation and b) preventDefault will ensure that it will no longer be used by anyone and thus
   become garbage collected. So, to double stop it is to delete it.

3. Pre-spawn-event. To pre-spawn an event is to dispatch another event as low as needed in the DOM.
   As the other event is dispatched, this spawned event will be processed *before* the processing of 
   the original event continues.
   
4. Post-spawn-event. To post-spawn an event is to dispatch another event as high as possible in the DOM,
   ie. on the window or on the iframe element.
   This can also be done using async `Promise.resolve().then(()=>{ logicalOrigin.dispatchEvent(new SpawnedEvent()})`,
   but async doesn't work if there is a default action, so best do it sync.
   The spawned event will be processed *after* the processing of the original event.

5. Wrapped-events is a post-spawned or pre-spawned event that single-stops the original event,
   and then wraps around the original event and makes its own `preventDefault()` and `defaultPrevented`
   point to that original events `preventDefault()` and `defaultPrevented`.
   
   1. Translated-event is a pre-spawned, wrapped-event.
   2. Tail-event is a post-spawn, wrapped-event.

6. Event-filtering is a pure function that only spawns a new event when certain conditions regarding the
   event itself is fulfilled.

7. Event-recording is to listen to many different events and then spawn either more or less events
   from that original event based on an inner state. 
   
## Suggestions for the spec

All events with default actions should be translated into a new event.
This event has no default action, but will be executed if it runs past the window or browsing context.
