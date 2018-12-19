# Pattern: CoyCallback and SluttyEvents

## Dilemma: Dress like a prude or dress like a slot

Clothes communicate. The clothes you wear will become part of your interaction with others. 
Girls know this. They dress up. They dress down. And they are masters of sculpting their 
visual handshake and first impression in cotton, lipstick and fake fur. Stereotypically speaking.

When people look at a girl in her clothes, they try to interpret her message.
Is the girl cold? Where does she come from? Who are her friends? Does she have children? 
Her choice of clothing and the way in which she wears them is a veritable fountain of possible clues.

Some of these clues cause a dilemma for the girl. Her encapsulation is not only covering her 
delicate skin from the cold, wind, rain and sun; her encapsulation also function as an invitation 
and manual for how other boys and girls should interact with her. As mammals. And, therein lies the rub. 

On the one hand, if she covers up tight, buttoning up all the way, she will be well protected 
from the elements. But, by "dressing like a prude" and encapsulating her private inner properties too well, 
other elements will interpret her clothes as a signal to stay away. 
Even though this signal might only be meant sexually, even thought the woman would like to interact
intellectually, the mammalian subtext of stay away might be perceived subconsciously to repel all
approaches.
So, if she wear a prudish dress with no hint of openings in the encapsulation, she gets no play. 
In no domain, not only mammalian. And she ends up in a corner by herself.

On the other hand, if she covers up too loosely, she is approachable. Other elements can more easily 
read her, find an opening and start interacting with her. The problem is that "dressing like a slut" 
also will cause some anxiety on the part of the boys. If she is so quick to interact with me, 
if I can read and maybe even manipulate her private properties so easily, will not other boys
be able to do so too? Sure, being easily approachable can be good for both the girl and boy short term. 
But long term, how can the boy be sure that she will remain in control of her inner state? 
How can the boy be sure that her responses will be a product of his input only, 
and not a side-effect of her simultaneous interaction with one or more other boys.
If the boy finds the girl too frivolous with access to her privates, 
he gets worried about future side-effects, race conditions and state conflicts. And leaves her. 
Again, the girl is left alone in the corner in the long term.

## Where's the middle ground between slut and prude?

Girls have to balance this. Sway too far in either direction and they loose. 
But, this is hard. The same dress that might be just right at one party,
might make you look like a slut or prude or both at another. Its all about context:
1. Every girl has her own definition about what properties should be private and public.
2. The other girls at the party help establish expectations about which properties should be
   private, hidden and shown.
3. It depends on the connecting elements interpretation. What is their agenda? 
   Are they only interested in a short term connection? Or are they thinking long term, 
   sharing intimate secrets with zero-tolerance for side-effects?

There are no absolute answers to what is the right encapsulation.
However, there are tricks of the trade. A proven strategy: be coy.

A coy person desire social interaction, but plays it shy. A girl being coy is not truly 
insecure and inhibited, as a shy girl would be, but smartly acts more reserved.
She thinks before she speaks. The coy girl examines her context. She considers her own state.
And she might for example enter the party in a blouse, a bit prudishly buttoned up.
But, *while at the party* she assess the situation. She calculates that *here, now* she should
open up a bit more. She goes to the bathroom, unbuttons her blouse slightly, ruffles her hair and 
re-enter.

## CoyCallbacks

Encapsulation can also play it coy. To be coy, the encapsulation must work in two steps:
1. The element must first process the stimuli given privately, underneath the encapsulation. 
   This process evaluates different reaction patterns based on the elements own perception of the
   situation, its own state.
2. From this internal thinking process, the coyly encapsulated element will react.
   The reaction might only result in an introverted response, or the element might speak out,
   make an extrovert the response. The key is that it is *the element itself that control
   whether or not an external reaction is deemed appropriate during the initial private processing*.

Custom elements use this strategy. Lifecycle callbacks are coy: 
1. Lifecycle callbacks are private functions for custom elements. 
   They should be kept within the element's encapsulation, defined in the elements definition only.
   To define lifecycle callbacks from outside or after the elements definition would be to manhandle
   the custom element, a form of web component domestic violence.
2. The lifecycle callbacks are internal processes. In the callback function, the 
   `this` keyword gives easy access to the custom element's inner state, its shadowDOM 
   and its lightDOM context.
3. Lifecycle callbacks can be triggered by mostly external stimuli such as 
   being constructed, connecting to the DOM or changing attributes. However, the lifecycle callbacks
   *can also* be triggered by the element itself, such as via internally driven attribute changes and
   asynchronically delayed reactions.
4. Custom elements can in lifecycle callbacks both introvert and extrovert their reaction.
   A custom element can for example alter its inner shadowDom and dispatch events in a lifecycle callback.
 
## ThinkOutLoudEvents

Events are not coy. On the contrary, events is an element thinking out loud. 
When an element reacts via an event, that reaction starts out in the open in that element's lightDOM. 
Both the element itself and surrounding elements can listen for the event on the origin element.
Events often propagate. They bubble up and spread so as to affect other elements in 
the origin element's surrounding.

The good thing about events thinking-out-loud policy is that you know where they stand. 
If an event is to occur, if you listen for it, you can expect to hear about it.
This can be blunted if other sources cancel the events bubbling, but in general, if the stimuli is cast
as an event, you can expect to hear about it if you listen for it.

On the other hand, CoyCallbacks can hide stimuli. As CoyCallbacks process their stimuli in private, 
within their encapsulation, then if the custom element chooses not to react to the event, no external
element will ever know that event occurred. 
If the stimuli might be meant for the whole group, that can be bad.
    
The bad thing about events always speaking their mind, is two things:
1. there might be too many events being dispatched all cackling at the same time and craving attention.
2. stimuli that might should be kept private might end up being revealed to others, 
   potentially causing social confusion.
   
## `slotchange` event vs. `slotCallback()`

In chapter 4 we discuss the `<slot>` element and the `slotchange` event.
The chapter presents a callback alternative to the `slotchange` event: `slotCallback()`.
But why? Why should a CoyCallback be used instead of a ThinkOutLoudEvent for slot changes?

In chapter 4.X Problem: SlotchangeNipSlip (SlotchangeEavesdropping) the problem of elements
inadvertently intercepting `slotchange` events is illustrated. The out-in-the-open-first 
approach of events, quickly leads to a situation where `slotchange` events accidentally becomes too open.

Furthermore, the changes of slotted content is a change of the internal state of the custom element
in which the slot resides. Even though the `slotchange` event is not composed and 
therefore does not bubble past the shadowDOM document border, there are really no reason for the event
to bubble past the other elements in the custom elements shadowDOM on its way to the custom element.
The `slotchange` event is relevant for the custom element and it needs to signify which slot name it concerns,
and which elements are being slotted. But, as long as the `slotCallback()` fulfills these requirements,
there is no benefit from having the `slotchange` event bubble past other elements in the shadowDOM.

ThinkOutLoudEvents should reserved for stimuli that can be relevant for other unspecified elements 
in the lightDOM in which it propagates. If not, a CoyCallback should be used. 
Simple solutions such as directly dispatching the `slotchange` event on the shadowDOM document that 
holds the `<slot>` element could be used, this would close the SlotchangeNipSlip gap.
But this would basically be just a small step requiring the developer to make his own lifecycle callback
based on the event. And as lifecycle callback's are implemented for attribute changes, 
it would definitively be more streamlined both conceptually and in apps with a `slotCallback()` lifecycle method.

## References

 * dunno