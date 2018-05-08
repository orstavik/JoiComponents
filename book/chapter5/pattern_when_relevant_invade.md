# Pattern: When relevant, invade!
## Native composed events and gestures

Some composed events you know already.
Click, drag to scroll on mobile, etc.
All these are composed events.

## What the h*¤#% is CSS "touch-action: none" and "user-select: none"?
I have some good news, some bad news, some really bad news, and then finally 
some really, really good news. Let's start with the good news.

By themselves, gestures and composed events are simple and straight forward to make.
You listen for a couple of events. Then you maybe cache some data and/or make some calculations.
And then finally you dipatch a custom event based on these data and calculations.
When you make them as (mixins for) web components, 
this is both naturally and functionally well encapsulated, simple to demonstrate and easy to test.
This is good news.

But, what is the bad news? When multiple events are composed over time, the response of these events 
might interfere with each other. For example might a drag might have been intended 
to move a block on the screen by wrongly interpreted as a page scroll.
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


(())Conflicts between custom composed events and natively implemented composed events


## References                                                                   
* https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md