# Pattern: CaptureTarget

## What choice?

Ahh! To make decisions early. How good it feels. You're the expert, and as you're
confronted with dilemma after dilemma you just instinctively make the right choice every time.
You can trust your gut. Where I go, there is food. Others should trust your gut instinct too! Follow me, 
I will lead us.

But you are not that guy. You're the guy watching that guy. That reckless idiot. That idiot 
who is just a serial decider that makes an endless array of choices based on his own pure gut instinct 
and without any forethought, experience, or rational deliberation. That reckless guy is gut instinct 
alright, a self deluding gut who dumps his decisions around on others. Right after he has made a choice, 
he just tells himself it was the correct one. Never mind how it actually turns out, that's irrelevant to him.
He is wilfully ignorant of the consequences of his decisions, all he craves is the dopamine rush he gets 
by pulling the lever. And all that decision dopamine just puffs up his ego even more which in turn prods 
him to make his next reckless decision as quickly and recklessly as he possibly can. Yeah, follow that guy, 
right! He is 99% likely just spiraling towards catastrophe. I just hope the others don't get fooled by
his imagined, chemically bolstered self confidence and mistake it for something rooted in reality..

> Questions to the reader: Where do you think my self-confidence comes from?
> Do I have any basis for these patterns? Do I believe in them myself? And if I do, do you 
> think that I am fooling myself? And if I don't, would you still be well served by believing in me?
> Am I for real?
                                                                  
## Early decisions in EventSequences

EventSequences often benefit from making early decisions:        

1. By making an early decision, the initial event trigger function can reduce its own workload and 
   perhaps avoid even registering a myriad of secondary trigger event functions that would greatly
   tax the system's resources.
    
2. Initial event trigger functions (such as `mousedown` event listeners) most often run only once.
   Secondary event trigger functions (such as `mousemove` event listeners) most often run many times.
   Making the decision in the initial event trigger function thus greatly reduces the burden of constantly
   computing and updating the decision in each secondary event trigger functions.
   
3. To make a decision early and then to stick to it makes the EventSequence as a whole predictable. 
   There will be no change of heart between the initial and secondary custom DOM Events.
   
4. There will be a clear entry-point from where to debug the decision.

The browser itself makes its decisions for its native EventSequences early.
The on `pointerdown` events, it will be too late to set the `pointer-action` CSS property to `none` for
ensuing `pointermove` events, as the browser will have already decided what the `pointer-action` CSS property
for those events would be *before* the event listener for `pointerdown` was dispatched.

## CaptureTarget (and EventSettings)

So, in EventSequences, the pattern is to decide early. But what do we need to decide?
 
1. `target`. The `target` of secondary composed events (custom composed events that trail the initial 
   composed event) is commonly "captured" in the initial trigger event function, then stored in the 
   EventSequence's internal state, and then reused as the `target` in subsequent, secondary composed DOM 
   Events. This pattern is called CaptureTarget.
   
   To lock the `target` element for all the composed events from an EventSequence in the initial
   trigger event function is the default approach. 
   For some types of EventSequences, having the target element dance around the DOM, is 
   at best confusing, at worst evil.

2. EventSettings are commonly read *once* in the initial trigger event function. This is not a hard rule. 
   Different custom composed DOM Events have different needs that could encourage a late decision.
   But, by default, anticipate that custom composed DOM Events reads the EventSettings *once* in the 
   initial event trigger function.

## `.setPointerCapture()`, a misconception?

[`Element.setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)
and its sibling [`Element.releasePointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/releasePointerCapture) 
is a set of builtin method for HTML elements to tie future `pointer` events (touch and mouse) to a particular 
target. They form a pattern: via JS global function, lock (cf. "capture") the target of certain type of
DOM Events ("pointer") to a given element.

A drawback of this pattern is that it is in JS, not HTML attribute. This makes it impossible to set and 
view the state of this attribute from the DOM, which is a loss.

However, when composing custom events using the EarlyBird pattern, the event listener is attached to the 
global `window` object. This means that we have no need to `setPointerCapture` for our trigger events.

Furthermore, the custom composed events should mostly use the CaptureTarget pattern for EventSequences.
That more or less covers the use-case for the pattern behind `.setPointerCapture()`. And, if you insisted 
on controlling the target of an EventSequence dynamically, you should still specify it as an 
EventSettings as an HTML attribute.

The conclusion is that the pattern behind `.setPointerCapture()` isn't really a good fit for custom 
composed DOM Events. Use CaptureTarget or EventSettings instead.

## References

 * [](https://www.dailymail.co.uk/sciencetech/article-4297698/Dopamine-brain-shape-decisions-make.html)
 * [](https://www.dailymail.co.uk/sciencetech/article-4297698/Dopamine-brain-shape-decisions-make.html)