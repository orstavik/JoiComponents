# Pattern: ShyCallback

## Dilemma: Dress like a prude or dress like a slot

Clothes communicate. The clothes you wear will become part of your interaction with others. 
Girls know this. They dress up. They dress down. And they are masters of sculpting their 
visual handshake and first impression in cotton, lipstick and fake fur. Stereotypically speaking.

Thus, when people look at a girl in her clothes, they try to interpret her message.
Is the girl cold? Where does she come from? Who are her friends? Does she have a boyfriend, children? 
Her choice of clothing and the way in which she wears them is a veritable fountain of possible clues.

Some of these clues cause a dilemma for the girl. Her encapsulation is not only covering her 
delicate skin from the cold, wind, rain and sun; her encapsulation also function as an invitation 
and manual for how other boys and girls should interact with her. As mammals. And, therein lies the rub. 

On the one hand, if she covers up tight, buttoning up all the way, she will be well protected 
from the elements. But, by "dressing like a prude" and encapsulating her private inner properties too well, 
other elements will not know how to approach and interact with her. 
Other elements will interpret her clothes as a signal to stay away.
Unfortunately for women, other elements may read these encapsulation signals even when they are totally
irrelevant in the current context.
If you wear a prudish dress with no hint of openings in the encapsulation, you get no play. 
You end up in a corner by yourself.*

On the other hand, if she covers up too loosely, she is approachable. Other elements can more easily 
read her, find an opening and start interacting with her. The problem is that "dressing like a slut" 
also will cause some anxiety on the part of the boys. If this element is so quick to interact with me, 
if I can read and maybe even manipulate her private properties so easily, will not other elements
be able to do so too? Sure, being easily approachable can be good for both the girl and boy element short term. 
But long term, how can the boy element be sure that she will remain in control of her inner state? 
How can the boy element be sure that her responses will be a product of his input only, 
and not a side-effect of her simultaneously interacting with one or more other elements on the side.
If the boy element finds the girl element too frivolous with access to her inner state, 
he gets anxious about side-effects, race conditions and state conflicts and shy away. 
This time, it is the slutty girl that is left alone in the corner long term.

## Where's the middle ground between slut and prude?

Girls have to balance this. Sway too far in either direction and they loose. 
But, this is hard. The same dress that might be just right at one party,
might make you look like a slut or prude or both at another. Its all about context:
1. Every girl has her own definition about what properties should be private and public.
2. The other girls at the party help establish expectations about which properties are 
   private, hidden and shown.
3. It depends on the connecting elements interpretation. What is their agenda? 
   Are they only interested in a short term connection? Or are they thinking long term, 
   sharing intimate secrets and zero-tolerance for side-effects?

There are no absolute answers to what is the right encapsulation.
However, there are tricks of the trade. A proven strategy: ShyEncapsulation.

Being shy means to desire social interaction, while at the same time being afraid of getting socially bruised.
A girl might enter the party in a blouse, a bit prudishly buttoned up. She is a bit shy.
But, *while at the party* she gets comfortable. She feels safer and becomes more outgoing.
She goes to the bathroom, unbuttons her blouse slightly, ruffles her hair and re-enter. No longer shy.

Shy encapsulation means:
1. process the situation privately, 
2. make a custom response, 
3. extrovert the response, if deemed appropriately.

Custom elements use this strategy. Lifecycle callbacks are shy: 
1. Lifecycle callbacks are triggered by an external (or internal) stimuli such as connecting to the DOM 
or an attribute change.
But, the processing of the stimuli is private, hidden under the encapsulation of the element.
(And, while possible, it is a breach of civility to manhandle lifecycle callbacks from outside 
the element's definition). The callbacks are internal processes. 
2. In the lifecycle callback, the custom elements can use their internal state to react independently. 
Depending on the stimuli and the elements context, the custom element dictates its response from within.
3. Custom elements can in lifecycle callbacks both introvert and extrovert their reaction.
A custom element can for example alter its inner shadowDom and dispatch events in a lifecycle callback.

## Appropriately ShyCallbacks

ShyCallbacks thus start as a private process that may or may not trigger cascading extroverted events.
They are particularly suited when an element needs to react to a changes in their internal state.
Although it might sometimes be appropriate, changes in internal state may often not warrant an external
response. Thus, internal state changes is best processed privately first, and then depending on context
might trigger an extrovert reaction. Internal state changes are best handled shyly.

In chapter 4 we discuss the `<slot>` element and the `slotchange` event.
The chapter presents a callback alternative to the `slotchange` event: `slotCallback()`.
The model of the ShyCallback clearly argue that a `slotCallback()` would be a better fit 
than the `slotchange` event for this particular purpose.