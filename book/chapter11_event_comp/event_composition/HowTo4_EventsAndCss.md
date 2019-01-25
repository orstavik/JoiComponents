## HowTo: compose with DOM Events and CSS

At first sight, it seems strange to direct DOM Events from CSS, or direct CSS from DOM Events. 
Why add that complexity? Why not stick with just controlling DOM Events using HTML attributes? Or JS?
Surely, to mix CSS with DOM Events just seems like asking for trouble (complexity) for no good reason.

But. Again. Its not. There are reasons. In this chapter I will present some reasons why and when CSS 
can be directed from DOM Events, and some reasons why and when DOM Events should be directed from CSS.

## HowTo: control CSS from DOM Events

Just `:hover`. And `:active`, `:link`, `:visited`, `:focus`, `:focus-within`, `:indeterminate`, etc.
These are all CSS pseudo-class selectors. These pseudo-class selectors enable CSS properties to 
react to state changes in the DOM. But, these state changes in the DOM are not necessarily controllable
from HTML (cf. `:hover`) nor reflected in the DOM (as some kind of HTML attribute). 
Furthermore, these state changes are driven by DOM Events. They may be "faked" by JS, but 
JS do so indirectly by itself triggering a DOM Event or via a parallel platform function.
The CSS rules are directed directly via DOM Events.

Unfortunately, there is no ability to register new CSS pseudo-class selectors.
Or no grammar that bound an event directly to CSS pseudo-class selectors. This is a loss.
Hypothetically, one might imagine that the CSS pseudo-class selector `:hover` instead was named 
`:mouseenter`. And that there was a global JS function 
`registerCSSPseudoEvents("mouseenter", "mouseout");` that essentially would register DOM Events
as CSS pseudo selectors. This would be a nice addition to the platform. 

But. The lack of such DOM Events to CSS grammatical means is not a critical loss. 
The boilerplate overhead of achieving the same via JS and HTML is small: Add an event listener 
JS function to a pair of DOM Events; in the event listeners respectively add and remove a class 
to the target element; and then add a CSS rule that rely on this class.

```html
<style>
.my-hover {
  background: red;
}
</style>
<script>
window.addEventListener("mouseenter", function(e){e.target.classList.add("my-hover")});
window.addEventListener("mouseout", function(e){e.target.classList.remove("my-hover")});
</script>

<div>hover me to bloody me</div>
```

## Why control COM Events from CSS?

First, if you are asking yourself this question, you are looking at the problem from the perspective 
of an HMTL or JS developer. If you only had the perspective of the CSS designer, you would not ask 
yourself this question. Lets look at an example. 

Let us say that you are working as a CSS designer in a team
with other people doing the HTML or JS. Your responsibility *includes* UIX behavior such as controlling
swipe-to-scroll and tap-to-zoom: after all, *you* are the designer in charge of pretty. 
But, you are (wrongfully?) considered as not-so-technically-savvy as the JS developers that controls 
the JS scripts (and therefore the HTML template). So, your access to alter or play around with the HTML
and JS files has been restricted, so as to hinder you from "breaking anything important". You can drop 
in CSS files in the project folder, and that is it. 

The only way the browser can allow:
1. you the CSS designer 
2. to be in control of UIX behavior of DOM Events and 
3. at the same time be restricted from messing up the HTML template is to 
4. implement control of UIX DOM Events via CSS properties.                                   
                                                  
Second, CSS allows you to write selectors that capture many elements at the same time. 
After all, it was to get such extra selector powers that HTML style was moved to CSS in the first place.
Thus, CSS selectors allows us to restrict different defaultActions in more complex ways.
More complex restrictions can also be accomplished in the same way with HTML attributes, but 
to add a true declerative, query language against the DOM to control DOM Events, CSS is the only game 
in town. 

## Why not control DOM Events from CSS?

However. There is a catch. When the DOM Event comes flying in, if CSS properties are to control
the DOM Events, then the browser *must* know which CSS rules apply to which HTML target element 
*before* the event listeners are queued. This means that for CSS to control a DOM Event, the 
CSSOM must be in order before the DOM Event is dispatched.

Ok, I know you didn't quite catch that. It was so technical and boring and full of words, that it went
in one ear and out the other. I get it. I do. But this is sooooo important, even though it is difficult
to understand that I will help you understand it better. So I will just YELL it to you once more.
**IN ORDER FOR css PROPERTIES TO CONTROL dom eVENTS, THE CSSOM MUST BE PROCESSED *BEFORE* THE AFFECTED
dom eVENTS ARE DISPATCHED**. There. I hope that helped :)

One way to ensure that the CSSOM is processed before an affected DOM Event is dispatched, 
so that the relevant DOM Event-controlling CSS property can be checked beforehand, 
is to process the events that need access to such CSSOM values at the very beginning of the frame, 
right after the previous frame was painted. At the very beginning of the frame, 
the CSSOM is in order as it was at the end of last frame processed in order to present an updated view.

But. Wait a minute. What if another DOM Event was processed before it. What if you had two different DOM
Events that were both controlled by a CSS property that is supposed to be dispatched within the same frame?
And an event listener attached to the first one, or both for that matter, altered the state of the CSS
properties of each other? What if all DOM Events were controlled by CSS properties? Ohh.. Shit.

It seems clear that this approach doesn't scale. If CSS properties control DOM Events, then this means 
that either: 
1. the CSSOM must be processed *between* each DOM Event added to the event loop, 
2. only one DOM Event (controlled by CSS properties) can be dispatched each frame at the beginning
   of the frame, or
3. that CSS properties cannot be programmatically altered during the execution of event listeners.

No thanks! I don't like those options! At least not with the current frame cycle in modern browsers.
Currently, several DOM Events can be dispatched in sequence in the same frame *before* the browser needs 
to recalculate its CSSOM. Sure, you can manually trigger a CSSOM recalculation by calling 
`getComputedStyle(onAnElement)`. But, if we avoid that, CSSOM calculation can be delayed until the
end of the frame, and we can process dozens of events fast, each frame. If every DOM Event dispatch 
*required* an updated CSSOM, the numbers of events processed would likely be halfed or cut down even 
worse.

## HowTo: control DOM Events from CSS

Currently, only `mousedown`, `touchstart`, or `pointerdown` are controllable via the CSS properties 
`touch-action`, `pointer-action` and `user-select`. Because there are so few DOM Events affected that
should only appear once per frame, the browsers can fake processing the CCSOM before these DOM Events
by simply dispatching these DOM Events *first* each frame. This throws the CSS-only
developers a bone: As the poor, second-class citizens of web app developers they are, they can still
direct UIX, ie. the defaultActions of touch and mouse.

But, such CSS direction of DOM Events do not scale. At least not with the current frame cycle.
If the frame cycle changes were to change, then this could change. 
If the CSSOM was updated more frequently and at least *between* each DOM Event dispatch, 
then CSS properties could become a viable alternative for directing DOM Events.
But, that is a BIG "if", maybe the biggest "if" on the web. 

Therefore, custom CSS properties should not be able to neither create, direct, nor stop custom, composed 
DOM Events. To do so would require the processing of the CSSOM before DOM Event dispatch, and 
although great CSS developer ergonomics, that would be far too heavy programmatically to be viable.
   
## References

 * 

## Old drafts

But using CSS properties to regulate events require an up-to-date CSSOM *before* every event.
With the current frame cycle architecture of one CSS calculation per frame, this is either only possible
for a select few event types (ie. the ones currently regulated), or needs to limit the frame to process 
only one event per frame, or needs to add one CSSOM calculation prior to every event with such a property.
