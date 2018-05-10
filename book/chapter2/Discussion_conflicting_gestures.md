# Discussion: Conflicting Gestures

## Different strategies to solve conflicts
How to deal with conflict? Should I avoid it, 
and just hope it goes away if I don't confront it?
Should I stand up for what is right, and go into each and every detail until 
I find the highly intricate solution that solves everyone's problem? 
Should I fight, and make sure that I get my needs met and leave the others to 
struggle for theirs? 
Or should I wait it out, and just hope that things will sort themselves out given time?
One conflict, so many choices.

The key to resolving conflicts is to identify and set proper boundaries.
What parties are involved in the conflict?
Which of the actors properties or functions are actually in conflict with each other?
When does this conflict occur? And when does it end?
The answer to these and similar questions all help to determine and contain the conflict.
This makes it easier to determine solutions that don't affect the parties of the conflict. 
Setting good boundaries both help individual agents to avoid conflicts with each other.
*But*, once a conflict occurs, setting good boundaries around the conflict itself 
also helps us find a good resolutions that do not produce unintended, unnecessary, bad side-effects.

In web development, different strategies or design patterns exists for resolving conflicts 
in general, and resolving conflicting gestures in particular. 
First, I will explain why gestures often conflict.
Second, I will give two examples of how the browsers traditionally has resolved these conflicts.

## Pointing fingers: who to blame for conflicting gestures?

We, the users, are lazy. We are used to just pointing at stuff and getting what we want.
Want to get a jacket? Sure, just tap on it in a webshop, and it is at your doorstep tomorrow.
Need a new girlfriend? No problem, swipe your finger to the right.
Text is too small? Doubletap to zoom.
Want some more? Drag your finger to scroll.
We are like a bunch of spoiled, ignorant magicians waving around our magic index-finger-wand.
The world should understand our unspoken intent, comply and give us exactly what we want. 
With no more than 20 millisecond delay.

But, it is not the users who are the magicians.
"No sir, the magicians are of course us, the web developers!"
And we know, making magic is not really that magical. 
It is just a series of very small steps, happening very fast. 
Once taken apart, these magical gestures are mundane.

But, even though they are mundane, they can still be problematic. 
We, the web developers, made the index-finger-magic wand and gave it to the users.
Now we, the users, are using the same finger for everything.
This creates conflict. For example, the double-tap to zoom can also be viewed as two taps. 
If you happen to double tap on the jacket in the webshop, does that mean that you want:
a) two jackets, b) to zoom in, or c) one jacket and zoom in? 
Or, on the dating site, you have zoomed in to take a closer look at the potential 
next special person in your life. with 
whom you are considering whether or not to spend the rest of your life. 
And then you swipe right. Now was that swipe a pan to simply move the viewport?
Or did you just say yes to something?

These are gesture conflicts. Problems for you the magician web developer to solve.
Next, we will look at the strategies/design patterns that you can use to solve these conflicts.

## Example 1: Delay that click for 300ms

This is a story about two conflicting native(!) gestures: `tap to click` and `doubletap to zoom`.
When smartphones with web browsers first appeared, 
the web had been around for more than a decade.
There were many sites and lots of content available. 
And all that content was designed to be read on 1024x768 screens. 
Not 320x480 screens like those on the smartphones. 

To make all that existing content accessible, mobile browsers therefore had to zoom a lot. 
And one guy, with his magic index-finger-magic-wand, 
decided that the best convention for zooming that content would be `double-tap to zoom`.
Tap on an element on the screen twice, and the mobile browser will zoom in to fit that 
element on its smaller screen. Double-tap again and zoom out.

However, this new gesture wasn't fully thought through. 
The double-tap is just two taps in quick, but not immediate concession. 
In fact, you can wait as long as 300ms after you have finished the first tap 
before you start your second tap and still get it registered as a double-tap. 
Furthermore. The concept of "double-tap to zoom" is applied to the whole screen. 
The concept implies that the user can tap anywhere to zoom.
And this convention gave a rise to a conflict. With another native gesture: `tap to click`.

In short, the conflict is:
1. You have a website designed for larger screens that the mobile browsers need to zoom by default.
2. This websites have clickable elements.
3. In a mobile browser you tap once with one finger on an element to click it.
4. In a mobile browser you tap twice on an element with one finger to zoom into it.
5. Now, after you have clicked once on an element, but before the 300ms has passed, 
how can the browser tell if you intended that tap as a click, or as the first of two taps of a zoom?

### Strategic attempt 1a: Patience

To solve this conflict, browsers used a well known strategy for resolving conflict: patience.
If you after the first tap wait for 300ms to see if the user taps on the same element again,
then you can know if the first tap should be interpreted as a zoom or a click.
The solution would then be to delay triggering any `click`-event until 300ms had passed.
If, by that time, the user had not tapped that element again, a delayed `click`-event is dispatched;
If, by that time, the user had tapped that element again, no `click`-event is dispatched and the zoom 
function invoked.

And, technically, in the browser, that works. However, the problem is that with this strategy,
the browser is trying to implement patience in... us, the users. And that simply doesn't work.
Sure, we users might be lazy. But we are not(!) patient. Nor slow. 
Our subconscious is actually faster than 300ms. And so, we users didn't like it. We more or less 
rejected it. And the browsers, who made and gave us the two conflicting native gestures were given 
the task of resolving them.

### Strategic attempt 1b: How to cut, card, and spin wool into yarn, and then best put it back on the sheep?

If you are thinking "weave it into a sheep sweater", you are definitively not a web developer. 
The obvious answer is of course glue, ductape and tying it into knots. 

The glue is called `<meta name="viewport" width="device-width">`.
This `<meta>`-tag is added to the `<head>` of the html document, and 
it basically tells the browser that a) the website has a responsive designed that handles different device-widths 
so that b) `double-tap to zoom` is no longer needed.
Those who cannot see the beauty of such tags do definitively 
not understand the wonderful magic of native web development.

The ductape is CSS and called `touch-action: none`. Or, `touch-action: manipulation`.
Or, `touch-action: pan-y`. Actually `touch-action: whatever` as long as it is not
`touch-action: auto`. The CSS `touch-action`-property basically tells the browser which of its
native gestures are to be allowed, muting all others. And, being such a loved creation,
`double-tap to zoom` is first in line of the native gesture to be muted.

The tying of knots is JS and known as `event.preventDefault()`.        
If you call `event.preventDefault()` on the `touchend`-events (todo verify that it is enough 
to preventDefault() on `touchend`), 
you alert the browser that no native `double-tap to zoom` gesture is needed nor wanted. 
This frees the mobile browser from having to wait and see if such a zoom might be intended,
enabling the mobile browser to skip the obligatory 300ms grace period and dispatch the click 
immediately.                          

But, if you thought the complexities ended here, you would be.. an optimist. The web being web,
nothing is as simple as just a list of alternative solutions. You have to moderate this list to
take into account that no browser supports all the alternatives. In this case, Safari does not
support CSS `touch-action`. And Chrome has started to execute some native event handlers such as
scroll *before* the app's own event handlers, thus seriously disturbing the JS approach of 
`e.preventDefault()`. 

Here, in the case of removing `double-tap to zoom`, the remaining solution seems obvious.
Add `<meta name="viewport" width="device-width">` to you html header, thus removing the native 
`double-tap to zoom` gesture, and glue the yarn back on the sheep. But, as the next example will 
show us, when it comes to `drag to pan to scroll`, it is better to just throw as much glue, ductape 
and knots as you possibly can so that no matter where your poor sheep web app happens to be opened,
the yarn sticks.

After reading this, you might ask yourself: what just happened? Did you just tell me that
the conflict between two native gestures that happened when mobile browsers added 
`double-tap to zoom` can be fixed by me only by removing said native gesture? 
Yup, that is basically it. The browsers fixed the conflict of 
content-defined-for-large-desktop-screens+small-smartphone-screens by requiring the users to
be patient. And we fix the problem of impatient users by removing the same `double-tap to zoom` 
gesture. You cut the wool of the sheep, but now the sheep is cold. 
Solution: Use glue and ductape and tie the yarn back on the sheep.


## Conflicts between native gestures and custom gestures

The previous example was a conflict between two native gestures.
You were totally blameless for that.
This next conflict you need provoke yourself.
This one will be all yours, and everyone will point their finger at you.
It is time to look at conflicts between custom gestures and native gestures.

By themselves, gestures and composed events are simple and straight forward to produce:
1. You listen for a couple of primitive events. 
2. You cache and/or calculate some data from these events.
3. And finally you dispatch a new custom event with these data.

It is not magic. And, if you wrap them up in an isolated functional mixin for HTMLElement,
it's even encapsulated, easy to demonstrate and testable.
By themselves, custom gestures are simple to compose. So, what's the problem?

## Example 2: Everybody wants a drag!
You want to move a `div` on the page with a `drag'n'drop` gesture. The user should:
1. press down on the `div` with one of his finger, 
2. then move his finger in any direction to move it, and
3. then raise his finger to leave it in the new position.

But. Here we go waving our magic-index-finger-wand again. 
This time to `drag'n'drop`. And we forgot that this magic wand is already programmed to: 
* scroll up when we drag down,
* scroll down when we drag up, 
* go to previous page when we drag left, 
* go to next page when we drag right, 
* sometimes even reload when drag down beyond the screen, and
* select text, when there is text on the element.

All these native drag gestures now conflict with our custom `drag'n'drop` gesture.
But why didn't anybody warn us?! Why didn't somebody raise their index-finger and wave it at us?!
Ahh, now I see.. They were of course already using that same index-finger to navigate their 
mobile browser.. It was already busy.. Silly me..

So, we got no warning. Conflicting events don't give warnings. Ok. Fine. 
But at least tell me how do to fix it? Sure! I'll just run in the back real quick and 
get the ductape and 'the sailor's guide to tying knots'. 
Glue or `<meta name="viewport">` is, as I'm sure you would also intuitively understand,
does not apply to native drag gestures.

The CSS `touch-action` property (ie. the ductape) allows us to control both the 
native `double-tap to zoom` and the native `pan` gestures on any element.
Add `touch-action: none` to your `drag'n'drop` element, and 
your dragging gestures will not trigger any of the conflicts listed above.
If you only need to drag the element horisontally, you could add
`touch-action: pan-y` which would enable the browser to still listen for the horisontal pan events. 

The JS `event.preventDefault()` method (ie. the tying of knots) allows us to 
turn off the native events when we handle the primitive touch-events to ensure that no 
native `pan`-based gestures will be dispatched by the browser. And, finally, 
we must also listen for the `selectstart` event and call `e.preventDefault()` on it too
to stop text selection interfering with our desired `drag'n'drop` behavior.

But, as described above, the web being web, we cannot choose just one solution.
Safari does not support the CSS `touch-action` property.
And, in order to speed up native scroll behavior on the web, Chrome has muted 
the effect of `event.preventDefault()`.
Therefore, we must *both* add CSS `touch-action` *and* call `event.preventDefault()`. 

### Jerky panning and laggy scroll and the reason for all the complexity? 
In principle, things were actually pretty simple when it came to conflicting events.
Call `event.preventDefault()` to stop the native events in your custom events.
The problem was not in the ergonomics of event.preventDefault(): the problem was in 
its negative impact on the performance of the native gestures.

Let's use our example of `drag'n'drop` a `div`. 
When the finger moves across the page, a new drag event can occur at 60fps.
However, the browser is either so slow or has so much to do, that it does not manage to complete 
all its tasks at 60fps, and sometimes need to drop a frame or two or three to catch up.
During normal operations such as clicking, such dropped frames might not matter all that much.
Only a few things are moving, and neither the delay nor the visual response of a clicking 
button is big enough to disturb the users experience. However, if the entire screen is changing 
as is the case with scrolling and panning, such dropped frames disturbs our users accustomed to
similar, but smoother scrolling and panning from native apps.

If there are no event listeners for touchevents, the mobile browser can easily see that it 
can take a shortcut passed the normal JS event handling. This bypass enables the browser to 
update the view when scrolling and panning, even when it did not have time to complete all its 
JS operations and must skip a frame. *The browser can not skip the scroll operation for this 
frame, even though it is still skipping the normal JS event handling for the same frame*. 
But, if `event.preventDefault()` can be used to block the native scroll gesture, 
and the application registers one (or even more) event listeners for `touchmove`, then 
this bypass strategy is blocked and the browser must wait for the JS to complete in order for 
it to process its scroll. The result is: If you add event listeners for `touchmove`, and to a lesser degree `touchstart`, 
you will like get jerky and laggy scrolling behavior for your mobile web app.

Ok, new problem, how to fix that one. 
Well, the only browser to really venture into this territory is Chrome. 
Chrome has unilaterally decided to run native event listeners for scrolling and panning 
behavior *before* custom event listeners. This is counter to the standard, 
where native event listeners for scrolling and panning behavior should run *after* 
custom event listeners, and this is necessary for event.preventDefault() to actually mean 
something so as to prevent conflict. In this instance, Chrome actually [broke the web]().

There are clear benefits of this approach. When you can use CSS `touch-action` properties
to block native scrolling and panning, then e.preventDefault is no longer strictly needed.
And then relying on this breaking change in Chrome, you get both the means to avoid conflict 
and smooth scrolling and panning behavior.
However, this only solves the issue of lagging scrolling when your web app is opened in Chrome,
and so to fix lagging and scrolling behavior in your other important browsers as well, 
you need to rely on another pattern: InvadeAndRetreat! And this we will discuss in the next 
chapter.



<!--
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

## What the h*¤#% is CSS "touch-action: none" and "user-select: none"?

-->

## References                                                                   
* https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md