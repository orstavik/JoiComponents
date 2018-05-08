# Problem: Conflicting Gestures

How to deal with conflict? Should I try to avoid it, 
and hope that if I don't confront it, it will go away?
Or should I stand up for what is right? And don't leave any stone unturned in my efforts to
find _the one_ solution that solves everyone's problem? Or should I fight? 
Make sure that I get my due and leave the rest to struggle for theirs?
One conflict, so many choices.

The key to resolving conflicts is to identify and set proper boundaries.
What properties are actually in conflict with each other?
And what are the actors in this conflict?
When does this conflict occur? And when does it end?
All important questions to determine. All questions that mainly determine the boundaries 
of the conflict.

## Example "Waaaait for it": A famous story about conflicts between composed events told in 300ms
Todo give the story about the 300ms pause for the click event.

## Pointing the finger to find someone to blame for conflicting gestures

We, the users, are lazy. We are used to just pointing at stuff, 
and the browsers does all the work for us. Want something in a webshop?
Just point on it with a finger, and it is in your mailbox the next day.
Want to get a new girlfriend? Drag your finger to the right.
Tired of squinting at the screen? Doubletap to zoom.
We are like a bunch of spoiled, ignorant magicians:
waving our magic index-finger-wand around like crazy and expecting the world to just understand
our unspoken intent, comply and give us exactly what we want. Poooff! With not a millisecond of delay.

But, it is not the users who are the magicians.
"No sir, the magicians are of course us, the web developers!"
And we know, making magic is not all that magical at all. 
It is just a series of very small steps, happening very fast, 
that once you slow them down has more in common with 
cooking a bowl of soup than a bottle of magic potion.

There is, however, one problem. 
We, the web developers, made the index-finger-magic wand and gave it to the users.
Now we, the users, are using the same wand for all operations.
It is like you have to make vegetable soup with only one utensil, a knife.
You have to use the knife often to chop vegetables to put in the pot, but 
at the same time you have to use the same knife to continuously stir the soup 
to avoid it burning itself in the pot.
If you don't stir, the soup burns. And you have only this one knife 
And if all you do is stir, then you put too big vegetables pieces in the soup and they end up hard and raw.
There is a conflict. You are using the same tool for all the jobs, and sometimes two jobs need to be done at the same time.

Now, how to solve this problem?
One solution would be to use a different tool to stir the soup.
But, you don't have any other tools at your disposal, and if you try to be creative and 
say, stir the soup with your index finger instead, you end up with a bad, unexpected result, 
like saugage soup instead of vegetable soup.

## What the h*¤#% is CSS "touch-action: none" and "user-select: none"?
The browsers have of course encountered conflicting gestures before. Heck, they made them!
And therefore they have also tried to resolve these conflicts.
The story of these solutions is both good news, and bad news. 
Let's start with some the good news first.

By themselves, gestures and composed events are simple and straight forward to make.
You listen for a couple of events. Then you maybe cache some data and/or make some calculations.
And then finally you dipatch a custom event based on these data and calculations.
It is not magic, not at all.
When you make them as (mixins for) web components, 
this is both naturally and functionally well encapsulated, 
simple to demonstrate and easy to test.
So, by themselves, custom gestures are simple to make. This is good news.

But. When multiple events are composed over time, the response of these events 
might interfere with each other. For example, a drag gesture might have been intended by the user
to move a block on the screen, but it is by default interpreted to also be a page scroll by the browser.
In addition, different browsers implement different native behavior for certain type of gestures/
composed events. For example, some browsers implement double-tap to zoom.
The bad news is that gestures and composed events might conflict with each other and 
with native, gesture based functionality in the browser such as doubletap to zoom and drag to scroll.

The really bad news is that the browsers have made a mess of the mechanisms the developer needs to 
do to resolve such conflicts with the native browser gestures.
The browsers primary means to resolve conflicts between custom composed gestures defined by you 
the developer was to call `.preventDefault()` on  `touch`, `scroll`, and `pointer` events.
Calling `.preventDefault()` enabled the browser to for example stop scrolling 
(the default behavior) when a touchmove event (drag) was handled in a custom 
gesture that conflicted with the scroll behavior. However, this lead to another problem:
When eventListeners was added to process gestures that might interfere with the native scroll 
behavior, the native scroll behavior became laggy and jerky. This needed to be fixed,
and so the CSS touch-action rule entered the browsers (except Safari). This enabled the developer
to specify that for example the browsers "touch-action: pan-y" (ie. vertical scrolling) should 
still be allowed, but that vertical scrolling should not be implemented by the browsers.
This gave some progress, in some browsers, but also divided the platform a little.

Then Chrome found that if they added a third argument EventListenerOptions to 
the .addEventListener function with {passive:true}, Chrome could reverse the order of 
execution and call the native scrolling on a pan *before* a custom eventListener for a touchmove 
was called. This made it possible for Chrome to make the scrolling work smoothly even with 
eventlisteners added for touchmove, because the scrolling was done first, thus avoiding the lag 
and jerks that otherwise might have occured if the browser had to wait to scroll until after 
the touchmove eventlistener was called. But.. That also meant that "hey, if the scroll is called 
before the custom eventlistener, then now I can't stop the default scrollbehavior by running preventDefault, 
because it has already happened". Wow.. That's bad. Really bad. Not only because of the confusion,
of how to fix it in Chrome, but also because of the difference in how different browsers resolve
conflicts between custom and native gesture management.

Basically, to resolve such conflicts, in Chrome you must use CSS properties restricting 
`touch-action` as their preventDefault no longer is guaranteed to run before the native 
gesture functions. In Safari, you must rely on the old fashioned way of calling 
`preventDefault()`. It is messy. Really messy.

However. And here is some really good news for you my reader. With the approach for handling
custom events in this book, this problem is really not that big. Actually, it is quite small.
Firstly, event listeners for touchmove are only added *after* the first touchdown is triggered. 
This means that the touchmove event listeners will not interfere with touchmove events outside of 
the element and scrolling, because they then *do not exist*.
Secondly, in the mixin it is simple to add custom behavior for both intercepting the original 
events. For example: when the event is first triggered, listen for the touchmove on the whole window, 
and not just the element itself or a specific parent. If the event listener was always attached,
this would not be possible as it would be far too invasive. But since the listener is only active
once a certain gesture has been initialized (by for example pressing on a particular element),
the invasiveness becomes only a strength. This "when relevant, invade" pattern, can also be 
applied to restricting other native gestures from starting, as well as capturering events for itself.

And that makes it very simple to make smart gestures that both disable native gestures and 
capture its own events without neither causing a lot of 


((Conflicts between custom composed events and natively implemented composed events))



## Pattern: Handle conflicting gestures: InvadeAndRetreat!
Another, more appropriate solution is to "When Relevant, Invade!".
In our soup kitchen, "When Relevant, Invade!" would be equivalent to by default use the knife 
to stir the soup. Then, in short episodes, 
1. take the knife out, 
2. concentrate and quickly chop up one vegetable completely, and 
3. to back to stiring the soup with the knife.


In the world of event composition, the pattern "When Relevant, Invade!" would mean to 
todo 
1) I have one start composed event that I listen for. The main events, the stiring, 
is not activated.
2) Only when the composed event starts do I add the event listener for the rest of the event.
Now, and only now, is the full scope of the composed event relevant.
3) When I know that my composed event has started, When relevant, I go full in, I invade. 
I listen for subsequent events on the window, so I am 100% sure I capture all of them.
At this time, I can also turn off other responses to these events, so that they cannot interfere 
with my composed event.
This maximum capturering of events and maximum block of events in subsequent event handling,
can be considered a temporary invasion.
4) Once the sequence of my composed event/gesture is complete, we do a full retreat.
We put everything back into place and go out, like we were never there.

## Native composed events and gestures                      

Some composed events you know already.
Click, drag to scroll on mobile, etc.
All these are composed events.



## References                                                                   
* https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md