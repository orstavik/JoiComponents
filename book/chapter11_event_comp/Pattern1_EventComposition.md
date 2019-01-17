# Pattern: EventComposition

> It was surprising to see how rarely event composition is used. It made me second guess my self.
> And, while pursuing these second guesses, I became even more surprised. 
> Firstly, native events all follow the EventComposition pattern. 
> Through its actions, the platform implicitly, but still quite strongly advocates using this pattern. 
> Second, pursuing this pattern reveals several flaws in other approaches and several large benefits 
> for EventComposition: 
> extreme ease of reuse, both across apps and within apps; 
> extremely low coupling to other parts of the code,
> super clear interfaces yielding less confusion, misuse and general anxiety,
> and lightDOM composeability, ie. you can combine events from the same vantage point as you can HTML elements. 
> Yet, almost no one uses this approach! Why is that? 
> I really don't know. ¯\\\_(ツ)\_/¯

EventComposition is the act of making a new event from one or more other events.
EventComposition is implemented as a single JS function added as a global, capture event listener.
When composing events, one relies on a series of strategic choices, that put together form different
design patterns for EventCompositions. But, before we look at these strategies, we need to define a
vocabulary.

 * **Composed event**: an event that is triggered by one or more other events.
 * **Triggering event**: an event that will initiate the dispatch a new composed event.
 * **Atomic event**: an event that is not triggered by any other events.
 * **Event sequence**: a series of triggering events that when following a specific order 
   will dispatch a composed event.
 * **Preceding event**: an event that propagates before another event.
 * **Trailing event**: an event that propagates after another event.
 * **Event Triggering function**: a (set of) functions that capture an event and dispatch composed events.
   The triggering function is at the very start of a triggering events propagation, 
   ie. added a) globally (ie. to `window`) and b) in the capture phase of the propagation.
 * **Native events**: events triggered by the browser.
 * **Custom events**: events triggered by a script.
      
## EventComposition strategies
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
   
## Question 3: What state information should composed events rely on?
Furthermore, and as a general rule, composed events should not require any state information 
outside the scope of its triggering event and the DOM elements it directly propagates to.
However, there is one exception to this rule: `<base href="" target="">` and the EventHelper pattern.
But, this pattern is confusing, hard to decipher, and hard to control in a living codebase.
Thus, my advice is strongly, strive hard to only rely on data from the triggering events itself and
from the DOM elements the triggering events directly propagates to.

## EventComposition patterns

In this book, we will present the following EventComposition patterns:

1. **FilteredPriorEvent**: This pattern uses a pure function to filter out a composed event
   from a single event of a single event type. The chapter uses the `link-click` event as example
   (ie. `click` events on DOM elements within an `<a>` or `<area>` element that will trigger browsing).

2. **MergedEvents**(UnitedEvents) : This pattern also uses a pure function to 
   compose a single event from single events of two or more event types.
   This chapter uses the `navigate` event as an example to illustrate how all events which eventually
   will yield in the browser browsing can simply be united into a single event to control routing.

3. **EventSequence**: This pattern illustrate how gestures can be implemented as ComposedEvents.
   EventSequence pattern listens for a sequence of events from one or more different types, and
   it uses the state from this collection of event in its event composition.
   The chapter uses a `long-press` event as its example.

4. **AttributableEvent**: This pattern illustrate how HTML attributes can be used to turn on or off
   a composed event per individual elements.
   The chapter uses a `tripple-click` event as its example.

5. **CapturedTarget**. This pattern illustrate how EventSequences can control the targets in its events,
   very much replicating the `setPointerCapture()` functionality.
   The example is a `mouse-dragging` event.

6. **CapturedEventType**. This pattern illustrate how subsequent events of a certain type can be captured.
   This opens up both the discussion about what `preventDefault()` is all about, and
   how CSS-properties such as `userSelect` provide a modern alternative to `preventDefault()` 
   to control native, composed events and actions.
   The chapter extends the `mouse-dragging` example from chapter 5. 

7. **CaptureTouch**. This pattern is principally the same as CapturedEventType.
   However, since touch-based gestures is a mayor player in the composed events game, 
   a separate chapter is devoted to capturering touch events.
   This chapter uses a single-finger `touch-dragging` example, and discuss how the potential 
   and limitations of the `touchAction` CSS-property.

8. **InvadeAndRetreat** and the 5 problem descriptions from the gesture chapter.
   Behind the CaptureEventType patterns, a more generalized pattern about conflict management. 
   Go all in hard at the beginning. 

9. **TrailingEvent**. Go back to the long-press example. 
   Show how it might seem more "natural" that the order is trailing:
   (mouseup, click, long-press), rather than prior: (mouseup, long-press, click). 
   Then show how this can only be done via setTimeout. 

10. **TrailingEventProblem**
   Show how TrailingEvents have a problem with default actions. 
   Default actions will either always run before the trailingEvent, or must always be blocked. 
   This gives two patterns: 
   **SubstituteEvent**, a trailing event that completely replaces the default actions of another event,
   in a way so that they cannot be called.
   **AfterthoughtEvent**, a trailing event that comes after both the trigger event and its default actions.

   Both of these patterns are problematic.
   Many events have "highly disturbing" default actions: 
   click (navigate), mouse (text selection), touch (scrolling). 
   Make a complete list of all important defaultActions. 
   SubstituteEvent can be used in some cases here; 
   AfterthoughtEvent pattern is rarely suited for these events.
   Composed events often need to controll so as to block the default actions of its trigger events.
   The benefit of "natural" event order thus often gets ecplised by the drawbacks of 
   the problems and complexity controlling the default actions of the trigger events.
   Thus, our own opinion is that the simplicity and control of default action that PriorEvents give
   always outweigh the "natural" order that TrailingEvents provide. Thus, we don't use TrailingEvents.
       
11. **BubbleEventTorpedo** Show how a) you can turn off the triggering and propagation of a composed event 
    by simply b) adding an event listener to trigger it later on in the propagation order and then 
    c) stop the propagation of the trigger event prior to the composed event trigger function in the 
    trigger event's propagation.