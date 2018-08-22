# Discussion: Conflicting Gestures

## Conflict resolution 101
How to deal with conflict? Should I avoid it, wait it out, and hope it just goes away?
Should I confront it, and go into each and every detail until 
I find the highly intricate solution that solves everyone's problem? 
Should I fight, and make sure that I get my needs met and leave the others to 
struggle for theirs? 

The key to resolving conflicts is to identify and set proper boundaries.
What parties are involved in the conflict?
Which of the actors properties or functions are actually in conflict with each other?
When does this conflict occur? And when does it end?
The questions all help to clarify and constrain the conflict.

Setting good boundaries *around the conflict itself* makes it easier to find solutions 
that don't have unintended, unnecessary consequences.
The clearer the boundaries around the conflict becomes, 
the easier it becomes to develop solutions that don't inflict bad side-effects on the parties or third parties.
And setting good boundaries *around parties that might get into conflict*
help avoid conflicts happening in the first place.
Resolving conflict is clarifying boundaries.

## Pointing fingers: assigning blame for conflicting gestures?
One frequent source of conflicts on the mobile web is gestures.
Mobile web browsers are limited. The have one touch-screen that must serve as both the input 
and output between the user and the browser.
It is possible to open up a keyboard, but that is small and slow, and it makes the 
output screen even smaller. Therefore, we mainly use one finger gestures to control the browser.

So. On the mobile web we are used to just pointing at stuff and getting what we want.
Want a warm jacket? Sure, just tap on it in a webshop, and it is at your doorstep tomorrow.
Need a new girlfriend? No problem, swipe your finger to the right.
Text is too small? Doubletap to zoom.
Want some more? Drag your finger to scroll.
We are like a bunch of ignorant magicians waving around a magic index-finger-wand.
When we wave this wand, we expect the world to understand exactly what we want,
instantly.

But, to use one finger for everything creates conflict. 
For example, the `double-tap to zoom` is made up of two taps, 
while a `click` on mobile is made with a single tap.
If you then tap twice on a jacket in a webshop, does that mean that you want:
a) two jackets, b) to zoom in, or c) two jackets and zoom in? 
Or, you zoom in to take a closer look at your potential soul-mate at the datingsite.
And then you swipe right. Now was that swipe a pan to view her right side?
Or did you just agree to go on a date?
You have a conflict on your hands (or in your index-finger to be more precise).

## Example 1: Delay that click for 300ms

When smartphones and mobile browsers first appeared, 
the web had been around for more than a decade.
There were many sites and lots of content available. 
And all that content was designed to be read on 1024x768 screens. 
Not 320x480 screens like those on the smartphones. 

To make all that existing content accessible, mobile browsers therefore had to zoom a lot. 
One guy decided that the best convention for zooming that content would be `double-tap to zoom`.
Tap on an element on the screen twice, and the mobile browser will zoom in to fit that 
element on its smaller screen. Double-tap again and zoom out.

At first, and in demos, it looked great. However, this new gesture wasn't fully thought through. 
The double-tap is just two taps in quick, but not immediate concession. 
In fact, you can wait as long as 300ms after you have finished the first tap 
before you start your second tap and still get it registered as a double-tap. 
Furthermore. The gesture of `double-tap to zoom` is applied to the whole screen, 
the user can tap anywhere to zoom.
These rather wide boundaries gave a rise to a conflict with another native gesture: 
`tap to click`.

To summarize:
1. You have many website designed for big screens.
2. These websites also have clickable elements.
3. Mobile browser decide on `tap to click` on elements.
4. But mobile browsers have small screens and therefore need to zoom often.
5. Mobile browser decide on `double-tap to zoom` to an element.
6. The conflict: after you have tapped once on an element, but before 300ms has passed, 
how can the browser know if you at this point intend the gesture as a `click` or have just started to zoom?

### Resolving the conflict, act 1: Patience

To resolve this conflict, browsers used a well known strategy: patience.
If you just wait 300ms after the first tap, 
then you will know for sure if the user has tapped once or double-tapped.
And so the mobile browsers did. 
They added a 300ms delay *after* the tap ended and *before* the click event was dispatched.

Technically, that works. 
The problem is that the browser had a dependency for its `PatiencePattern`: us, its users. 
And, we are both impatient and have a subconscious that works faster than 300ms. 
We do not like waiting 300ms for a click. So, we reject it. 
And so now, the browsers must find a new way to resolve the conflict they just made.

### Resolving the conflict, act 2: Putting wool back on a sheep
Ever since the Romans, man has faced a conundrum:
How best to put wool back on a sheep after we have cut, carded and spun it?
You might be thinking "weave it into a sheep sweater". 
That is a clever answer, but not one that shows aptitude for web development. 
In web development, the answer is of course superglue, duct tape and knots. 

The superglue is called `<meta name="viewport" width="device-width">`.
This viewport tag is added to the `<head>` of the html document.
It basically tells the browser that 
a) the website has a responsive design that handles different device-widths so that 
b) the browser can safely ignore `double-tap to zoom` if any click has been picked up.

The duct tape is CSS `touch-action: none`. 
Or `touch-action: manipulation` or `touch-action: pan-y`. 
Actually any `touch-action` except `touch-action: auto`. 
The CSS `touch-action`-property basically tells the browser which of its
native gestures are to be allowed, muting all others. And, being such a loved creation,
`double-tap to zoom` is always the first native gesture to be muted.

The tying of knots is JS `event.preventDefault()`.        
If you call `event.preventDefault()` on the `touchend`-events, 
you tell the browser that no native `double-tap to zoom` gesture is called for. 
When so told, the mobile browser do not have to wait 300ms to see if a `double-tap to zoom` 
is coming and can therefore dispatch the `click` right away.                          

If you thought the complexities ended here, you would be.. an optimist. 
The web being web, nothing is as simple as just a list of alternative solutions. 
As no browser supports all the alternative standards, you the web developer must. 
In this case, Safari does not support CSS `touch-action`. 
And in this case, you often have no need to listen for `touchend`-events and 
therefore no obvious place to put your `event.preventDefault()` in your web app code.

Thankfully, in the case of resolving the conflict around `double-tap to zoom`, the remaining solution is good:
1. make a responsive design and 
2. add `<meta name="viewport" width="device-width">` to the html header. 
This makes the native `double-tap to zoom` gesture secondary to `tap to click`
and is supported in all the mobile browsers. 

## Conflicts between native gestures and custom gestures

The previous example was a conflict between two native gestures.
You were totally blameless for that.
Next we will look at conflicts between custom gestures and native gestures.
These conflicts you need provoke yourself.

By themselves, gestures and composed events are simple enough:
1. You listen for a couple of primitive events. 
2. You cache and/or calculate some data from these events.
3. And finally you dispatch a new custom event with these data.

If you then wrap them up in an isolated functional mixin for HTMLElement,
it's even encapsulated, easy to demo and testable.
However, it is not the gesture itself that is the problem, it is how the gesture *interacts*
with other gestures that is the problem.

## Example 2: Everybody wants a drag!
You want to move a `div` on the page with a `drag'n'drop` gesture. The user should:
1. press down on the `div` with one of his finger, 
2. then move his finger in any direction to move it, and
3. then raise his finger to leave it in the new position.

The problem is that this `drag'n'drop` gesture relies on the magic-index-finger-wand. 
And the magic-index-finger-wand has already been charged with: 
* scroll up when we drag down,
* scroll down when we drag up, 
* go to previous page when we drag left, 
* go to next page when we drag right, 
* sometimes even reload when drag down beyond the screen, and
* select text, when there is text on the element.

Our custom `drag'n'drop` gesture conflicts with all of these native drag gestures.
We get no warnings from the browser about gesture conflicts. 
And gestures are hard to automatically test.
But they can be fixed, using duct tape and tying of knots.
(Superglue or `<meta name="viewport">` does not apply to native drag gestures, 
as I'm sure you would also intuitively guessed ;).)

The CSS `touch-action` property (duct tape) allows us to control both the 
native `double-tap to zoom` and the native `pan` gestures on any element.
Add `touch-action: none` to your `drag'n'drop` element, and 
your dragging gestures will not trigger any of the conflicts listed above.
If you only need to drag the element horisontally, you could add
`touch-action: pan-y` which would enable the browser to still scroll smoothly on 
vertical drag. 

The JS `event.preventDefault()` method (ie. the tying of knots) allows us to 
turn off the native events when we handle the primitive touch-events. 
Calling `event.preventDefault()` on a touchmove event should in principle ensure that no 
native `pan`-based gestures will be dispatched by the browser. 

And, finally, we must tie an extra knot around the `selectstart` event.
`selectstart` controls ao. text selection and by calling `e.preventDefault()` 
on this method it too, we stop this native behavior interfering with our custom `drag'n'drop`.
And, just to be on the safe side, you can add the CSS property `user-selection: none` 
on the element (a little extra glue never hurt, right?).

But, as I mentioned before, we cannot just choose the solution we like on the web.
Safari does not support the CSS `touch-action` property.
And, in order to speed up native scroll behavior on the web, 
Chrome has in general muted the effect of `event.preventDefault()`.
Therefore, we must *both* add CSS `touch-action` *and* call `event.preventDefault()`
*and* `user-selection: none` and the selectstart events `.preventDefault()`.
Glue it, tape it, bind it! 
Just make sure the yarn sticks on that sheep whatever the situation.

## Example 3: Jerky panning and laggy scroll and some more complexity? 
In principle, things could be pretty simple when handling conflicting events.
Just call `event.preventDefault()` in your event listeners and stop any native event or functionality.
In principle this works fine. 
In practice however, this implies always processing your custom event listener before processing 
native event handlers for scrolling and panning, and that is the final conflict we will talk about here.

In this example we create a custom drag gesture that should *not* prevent native scroll and pan gestures. 
This custom drag gesture is only used to meassure how fast we are scrolling the page.
When the finger moves across the page, a new drag event is dispatched at 60fps.
However, in most instances, the browser is either too weak or too overworked to complete all of its tasks at 60fps.
When the browser does not manage to keep up, it simply drops a couple of frames.
However, this only applies to the JS-controlled frames. 
The CSS controlled frames such as animations and transitions are handled independently. 
This means that CSS animations and transitions pass unhindered at 60fps, giving a smooth user experience.
During normal operations such as clicking, such dropped frames in the JS world does not matter all that much.
JS only affects a few elements on the screen.
However, if many elements on the screen are changing frequently, 
such dropped frames cause great disruption to our subconscious and hence the user experience.
And when we scroll and pan, that is exactly what happens.
Enter laggy scrolling and jerky panning.

Ok, yet another conflict. Now what is it this time and how do we fix it? 
The first solution is to make the browser process scrolling and panning independently from the
rest of the JS operations, like it does with CSS animations and transitions. 
If there are no registered event listeners for touch and scroll events, 
this is straightforward.
In such a case, the mobile browsers can easily:
1. separate all the touch and scroll events and 
2. update the view when scrolling and panning independently,
3. even when the browser did not have time to complete all its JS operations and must skip JS frames. 
 
But, what if there are event listeners registered for `touchmove` and `scroll` events? 
And what if these event listeners are not intended to block the native gestures, 
but rather let them pass unhindered?
In such instances, the web standard says that the mobile browser must:
1. Wait to see if `event.preventDefault()` is called to block the native gesture.
2. This means waiting for all the JS process to complete or partially complete.
3. And this means that if the JS process takes long to complete and misses a couple of frames,
then the native scroll and pan will also miss a couple of frames.
4. And this produces the jerky pan and laggy scroll.

Ok, so that is the solution? If you don't want jerky pan and laggy scroll,
don't add event listener for `touchmove`, `scroll` and (to a lesser degree) `touchstart`?
Yes, but only partially. Because this story has a twist.

In 2017, Chrome decided to unilaterally run native scrolling and panning events
*before* custom event listeners. This runs counter to the web standard([broke the web]()), 
and creates big problems for `event.preventDefault()`. 
But. It makes scrolling and panning much smoother.
And since native gestures can be turned off using CSS `touch-action` in Chrome, 
who really wants `event.preventDefault()` in the first place, right?

Chrome likely has a point, and their move to push EventListenerOptions and passive event listener by default 
seems justifiable, if not yet justified. But, my trusty reader. The real twist and good news is yet to come. 
There is namely another pattern to fix this and similar problems. 
A pattern that is not only isolated to Chrome, but that can be applied to all mobile browsers.
A pattern that simultaneously promises to fix laggy scroll and jerky pan. 
It is time to InvadeAndRetreat! - our next design pattern for web components.

((
todo I have some research that needs to be done in this chapter:
* add the demos
* make demo of laggy scroll and jerky pan. 
Show how it can be turned off and on.
(todo verify that it is enough to preventDefault() on `touchend` to prevent `double-tap to zoom`)
))



<!--

When it comes to `drag to pan to scroll`, it is better to just throw as much glue, ductape 
and knots as you possibly can so that no matter where your poor sheep web app happens to be opened,
the yarn sticks.
-->

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


-->

## References                                                                   
* https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md