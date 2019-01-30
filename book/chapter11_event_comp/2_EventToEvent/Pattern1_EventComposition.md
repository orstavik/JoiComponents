# Pattern: EventToEventComposition

> It was surprising to see how rarely EventToEventComposition is used. 
> It made me second guess my self.
> And, while pursuing these second guesses, I became even more surprised. 
> Firstly, many native events follow the EventToEventComposition pattern. 
> Through its actions, the platform implicitly, but still quite strongly, advocates using this pattern. 
> Second, pursuing this pattern reveals several flaws in other approaches and several large benefits 
> for EventToEventComposition: 
> extreme ease of reuse, both across apps and within apps; 
> extremely low coupling to other parts of the code;
> super clear interfaces yielding less confusion, misuse and general anxiety;
> and lightDOM composeability, ie. you can combine events from the same vantage point as you can native elements. 
> Yet, almost no one uses this approach! Why is that? 
> I really don't know. ¯\\\_(ツ)\_/¯

EventToEventComposition is the act of making a new event from one or more other events.
EventToEventComposition is implemented as a single JS function added as a global, capture event listener.
When composing events, one relies on a series of strategic choices, that put together form different
design patterns for EventToEventCompositions. But, before we look at these strategies, 
we need to define a vocabulary.

 * **event**: something happening in the browser. DOM Events being dispatched is an event, of course,
   but a callback triggered or native system task executed are also generally speaking an event.
 * **DOM Event**: an event that is triggered by one or more other events. Some native system tasks
   such as browser navigation, (cf. defaultAction or native behavior) can often be considered an
   invisible DOM Event.
 * **Composed event**: a DOM Event that is triggered by one or more other DOM Events.
 * **Triggering event**: a DOM Event that will initiate the dispatch a new composed event.
 * **Atomic event**: a DOM event that is not triggered by any other DOM events.
 * **Event sequence**: a series of triggering events that when following a specific order 
   will dispatch a composed event.
 * **Preceding event**: a DOM Event that propagates before another DOM Event.
 * **Trailing event**: a DOM Event that propagates after another DOM Event.
 * **Event Triggering function**: a (set of) functions that capture DOM events and dispatch composed events.
   The triggering function is at the very start of a triggering event's propagation: 
   added a) globally (ie. to `window`) and b) in the capture phase of the propagation.
 * **Native events**: DOM Events created by the browser.
 * **Custom events**: DOM Events created by a script.
 * **Global events**: DOM Events that can apply to HTML elements in the entire DOM.
      
## EventToEventComposition strategies
The strategic choices the developer needs to consider when composing events are:

1. Should the composed event propagate independently of other events, 
   and if so, how can this be achieved?
   [The EarlyBird pattern](Pattern2_EarlyBird.md).

2. Should I dispatch the composed event so that it propagates the DOM *prior to* the triggering event; or 
   should I dispatch the composed event so that it propagates *after* (trailing) the triggering event?
   [The PriorEvent pattern](Pattern3_PriorEvent.md). 

3. Do I need to access any state information outside of the events that trigger the composed event; or
   do I need to store any state information when I listen for a sequence of events; or
   is the function that compose the new event pure?
   
4. Do I need to listen to only a single event; 
   do I need to listen for several events; or 
   do I need to listen to a sequence of events?
   
5. When I need to listen for a sequence of events, how can I do so most efficiently?

6. Do the composed event need to be able to prevent the default behavior of the triggering event;
   do the composed event need to prevent the default behavior of the triggering event always; or
   do the composed event never need to prevent the default behavior of the triggering event?
   

## EventToEventComposition patterns

In this book, we will present the following EventToEventComposition patterns:

0. Problem: **StopPropagationTorpedo**. (BubbleEventTorpedo)
   Show how a) you can turn off the triggering and propagation of a composed event 
   by simply b) adding an event listener to trigger it later on in the propagation order and then 
   c) stop the propagation of the trigger event prior to the composed event trigger function in the 
   trigger event's propagation.
    
1. Pattern: **EarlyBird**: 
   The chapter uses an `echo-click` event as its example.
   
2. Pattern: **PriorEvent**: 
   The chapter uses an `echo-click` event as its example.
   
3. Pattern: **AfterthoughtEvent**: 
   The chapter uses an `echo-click` event as its example.
   
4. Pattern: **ReplaceDefaultAction**: 
   The chapter uses an `echo-click` event as its example.
   
 
5. **AttributableEvent**: This pattern illustrate how HTML attributes can be used to turn on or off
   a composed event per individual elements.
   The chapter uses a `tripple-click` event as its example.

6. **FilteredPriorEvent**: This pattern uses a pure function to filter out a composed event
   from a single event of a single event type. The chapter uses the `link-click` event as example
   (ie. `click` events on DOM elements within an `<a>` or `<area>` element that will trigger browsing).
   [cf. "What is a pure function?"](https://medium.com/javascript-scene/master-the-javascript-interview-what-is-a-pure-function-d1c076bec976)

7. **MergedEvents**(UnitedEvents) : This pattern also uses a pure function to 
   compose a single event from single events of two or more event types.
   This chapter uses the `navigate` event as an example to illustrate how all events which eventually
   will yield in the browser browsing can simply be united into a single event to control routing.



8. **EventSequence**: This pattern illustrate how gestures can be implemented as ComposedEvents.
   EventSequence pattern listens for a sequence of events from one or more different types, and
   it uses the state from this collection of event in its event composition.
   The chapter uses a `long-press` event as its example.

   1. tripple-click. Illustrate how state for the event is stored and then used in the filter and 
      makeEvent phases.
      
   2. naive mouse dragging. Illustrate how additional trigger functions are added once the start of a
      sequence has occurred. Discuss the performance of global trigger functions, and how best to keep 
      things efficient.
      
   3. setTargetCapture, ie. use the start of the event as the target for the later composed events in the sequence.

   4. setEventTypeCapture, ie. use the replaceDefaultAction pattern + add css properties such as
      touch-action and user-select.
      
Discuss how it is important not to have the trigger event listeners on high frequent events, and 
to add event trigger functions on a need-to-know basis.


   Question 3: What state information should composed events rely on?
Furthermore, and as a general rule, composed events should not require any state information 
outside the scope of its triggering event and the DOM elements it directly propagates to.
However, there is one exception to this rule: `<base href="" target="">` and the EventHelper pattern.
But, this pattern is confusing, hard to decipher, and hard to control in a living codebase.
Thus, my advice is strongly, strive hard to only rely on data from the triggering events itself and
from the DOM elements the triggering events directly propagates to.


9. **CapturedTarget**. This pattern illustrate how EventSequences can control the targets in its events,
   very much replicating the `setPointerCapture()` functionality.
   The example is a `mouse-dragging` event.

10. **CapturedEventType**. This pattern illustrate how subsequent events of a certain type can be captured.
   This opens up both the discussion about what `preventDefault()` is all about, and
   how CSS-properties such as `userSelect` provide a modern alternative to `preventDefault()` 
   to control native, composed events and actions.
   The chapter extends the `mouse-dragging` example from chapter 5. Name MouseGrab? ref D J Trump?

11. **CaptureTouch**. This pattern is principally the same as CapturedEventType.
   However, since touch-based gestures is a mayor player in the composed events game, 
   a separate chapter is devoted to capturering touch events.
   This chapter uses a single-finger `touch-dragging` example, and discuss how the potential 
   and limitations of the `touchAction` CSS-property.

12. **InvadeAndRetreat** and the 5 problem descriptions from the gesture chapter.
   Behind the CaptureEventType patterns, a more generalized pattern about conflict management. 
   Go all in hard at the beginning. 


## References

 * [Bubbling and capturing](https://javascript.info/bubbling-and-capturing)
 * [Event Bubbling and Event Capturing in JavaScript](https://medium.com/@vsvaibhav2016/event-bubbling-and-event-capturing-in-javascript-6ff38bec30e)
 * [MDN: `addEventListener()` with capture](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Example_of_options_usage)