# HowTo: Direct events

## DOM Events: the forth power

By "composing events" we mean "to combine one or more events into one or more other events".
But, you can also use a ready-made events as part of your app composition.
In fact, when you compose an app, you are essentially combining HTML elements, JS functions, 
CSS rules, *and* DOM Events. 
This perspective is helpful. You should understand DOM Events on par with HTML, JS, and CSS.

This perspective is a bit confusing. DOM Events are not independent. 
You have to have HTML elements to have a DOM, so no DOM Events without HTML elements. Right?
Also, as developers, we primarily think about DOM Events when we listen and react to them in 
JS functions. Although, on closer inspection, it is clear that DOM Events
such as link navigation, drop-downs, and swipe-to-scroll are very important for our web apps
even though we do not process them in JS. And CSS. What has CSS got to do with DOM Events?
Nah. This sounds bogus.

But. Its not. First, DOM Events originate on the platform independently of both JS functions and 
HTML elements. The user moves his finger, and something deep down in the OS and browser is then 
responsible for finding both the HTML target element and que JS event listener callbacks and 
defaultActions in the browser's event loop. DOM Events are born separate. 
And they are not only JS functions, they can be defaultActions too, which are not JS at all.

Second, we don't *always* mix neither HTML elements nor JS functions with DOM Events.
`window.addEventListener("offline", alert("Panic attack!"));` does not rely on any DOM elements
(if you can get over yourself and your profound insight into HTML and accept that I don't include 
the `<script>` tag that holds the JS function in this equation). Also, for many, many years, developers
proudly presented "interactive web sites" that contained no JS, only HTML elements and DOM events.
`<a href="...">` and `<select><option>` were oh-so-powerful indeed. The conclusion is: you can and do
use DOM Events when you compose your web app, and although these DOM Events are mostly combined with 
*both* JS functions and HTML elements at the same time, they *can* also be used independently of either 
one.

Third, DOM Events actually can be controlled from CSS. The CSS properties `touch-action` and `user-select`
are event controlling directives from CSS. In addition, CSS can be controlled from DOM Events.
`:hover` is a CSS selector that is directly directed from DOM Events (cf. `mouseover`). 
DOM Events and CSS actually are combined to compose web apps.

Let's begin by making an overview of "how we can *direct* DOM Events from JS, HTML, CSS".

## HowTo: direct DOM Events from JS?

DOM Events are primarily directed from JS. And JS is the primary destination for most DOM 
Events. In JS we add event listener functions. In JS we can add and control our own custom events, 
as well as programmatically trigger and stop native events at will. From JS, there is no DOM Event
we cannot completely control.

Many DOM Event directives can *only* be given from JS. Try as you might, but DOM Event commands such as
`.stopPropagation()` and `.setPointerTarget()` can't be given from neither HTML template nor CSS rules.

## HowTo: direct DOM Events from HTML?
   
We have two vehicles for DOM Events directives in HTML: HTML attributes and HTML elements.
HTML attributes is the most common. Examples here include `autocomplete`, `autofocus`, 
`draggable`, `defer`, `download`, `href`, `action`, `rel`, `method`, and many more.
Add an attribute to an HTML element, and a new DOM Event will be enabled and/or an event will be 
routed or altered in a certain way. HTML attributes is the default way to direct DOM Events from HTML 
template, it would be considered normal and familiar for all DOM Events.

But, in the early beginning of HTML, another approach was used and locked itself deep in our web platform
and collective psyche: `<a href="...">`. `<a href="...">` represent the second approach to direct DOM 
Events from HTML, via HTML elements whose sole function is to either create or alter a DOM Event.
And `<a href="...">` is not alone. `<form action="...">` is a similar element who also create and 
shape DOM browsing events. And `<base>` is a third DOM element, whose sole function is to alter browse 
events that originate from `<a>`s and `<form>`s. Add to this group `<input>`, `<button>`, `<select>`, and 
`<option>` who both create visuals and direct browse events from `<form>`s, and you get a complete sense
of how HTML elements can be used to create and shape DOM Events.

However, HTML elements mainly direct *one* DOM Event type: browsing. Few other DOM Events are directed 
from HTML elements.                                          
Therefore, while we see `<a>`, `<form>` and `<base>` as familiar, it is likely that we would consider
other possible event creating elements for obtrusive and wrong. For example, imagine that you wrap a 
`<div>` in a `<draggable>` element would make the browser dispatch a drag event when you now dragged 
on the `<div>`, and at the same time give the `<div>` a grab hand mouse cursor when it hovered over it.
While certainly possible to create, such a choice of composition style would likely be considered both 
strange and deepen the DOM hierarchy incorrectly.

These HTML elements that are used in event composition can be divided into four patterns:

1. EventComposer (`<a href="...">`). When added to the DOM, this element will make something happen,
   ie. ensure that a DOM Event is dispatched (or at least that a defaultAction, the DOM Events ugly 
   cousin, is added to the task que). `<a href="...">` react to a native trigger event, `click`. 
   The EventComposer pattern is familiar, but archaic. It is used with `<a href="...">`s,
   but I would recommend against using this pattern in for example custom elements as being an 
   out-of-fashion HTML and DOM Event composition style.
   
2. The EventComposer pattern is restricted to only compose events from other events. But DOM Events
   can also be triggered by native or JS resources. Such DOM Event directing HTML elements can be called
   EventCreators. The EventCreator pattern describe HTML elements that dispatch atomic DOM events, 
   events that are not composed from other events. A good example of EventCreator pattern is the 
   `<img>` element and its `load` event. This pattern is both familiar and still-in-fashion, and
   to for example make a web component that dispatched an atomic event is very much recommended.

3. The `<base>` element's purpose is to *alter* the already created browse events from `<a>` and `<form>`.
   The `<base>` element follows the EventHelper anti-pattern. The reason the EventHelper is an 
   anti-pattern is that it breaks the anticipated scope for default event interpretation.
   The event itself, its properties, its target's direct properties and the direct properties of its 
   propagation chain should contain all the data necessary for its interpretation. The `<base>` element,
   by design(!), lies outside this chain.
   
   I don't know the reason why `<base>` was designed in this way, but I speculate that it has to do with
   pages being generated by server-side scripts where the developer needed to specify the base for 
   interpretation of links while not having already written and sent the `<body>` element to the client.
   To avoid confusion, one did not want to add a "base-uri" attribute on all elements, thus having to decide 
   which such property would win if several different "base-uri" attributes were available in the
   target chain. However, several different `<base>` elements could still be added spread around in 
   the document, and to guess that the first, top one of these 
   elements should be the active one, is confusing (it could have been either the nearest in the target 
   chain or the last specified as well). Furthermore, the `href` and `target` attributes
   of `<base>` can be described in different `<base>` elements, adding to the confusion.
   
   In any case, the `<base>` and EventHelper pattern does not scale well. Imagine having many such elements,
   each describing a different property of different events, elements that can affect events even though
   they are situated outside of the events' scope. It would be chaos. It breaks the concepts of the DOM 
   Event propagation chain and event's basic scope of interpretation. 
   It breaks with the concept of the DOM hierarchy itself. It is an anti-pattern.

4. EventOrchestra. Finally, we have the pattern were a group of elements come together to orchestrate 
   one or more DOM Events. `<form>`, `<input>`, `<button>`, `<select>`, and `<option>` is a great example
   of this pattern. The EventDirector, `<form>`, is triggered by an event coming from one of the orchestra's
   member, `<button>`, and then evokes data from other members of the orchestra, such as 
   `<input>`, `<select>`, and `<option>`, to process or construct an event. As with `<a>` and the 
   EventComposer pattern, the EventOrchestra composes its event from a trigger event. But, as opposed
   to the EventComposer, the EventOrchestra does so from a specialized member, `<button>`, not from
   a generic DOM Event.
   
   To evaluate the EventOrchestra pattern is more difficult than the other three patterns. 
   The EventOrchestra pattern is certainly more complex than the others. This is in itself a drawback. 
   But the EventOrchestra pattern is also far more powerful. 
   It can be used as framework for more complex and nuanced architecture. 
   In other words, certain "genres" of web apps and web pages can be made using this pattern:
   Web pages with "a slide-down menu on top with different pages" could use the EventOrchestra pattern
   (as an extension of the HelicopterParentChild pattern) to make a reusable set of components as
   basis for its implementation. 
   
You are at this point likely feeling less, and not more comfortable about directing DOM Events from HTML.
However, I will try to summarize some clearer guidelines from the above:

1. The default way to direct DOM Events from HTML is as HTML attributes.

2. The EventCreator pattern is good, you will not inadvertently cause any confusion for yourself nor 
   others if you make your custom elements dispatch atomic events. 

2. Do not use neither the EventComposer nor EventHelper patterns.
   If you need to compose an event from other events, do so as EventComposition and then direct them
   via HTML attributes if you need.

3. The EventOrchestra pattern is not as much about structuring DOM Events as it is about structuring
   everything (ie. the whole app or big chunks of it). Sure, it directs DOM Events,
   but it is much more about directing HTML elements, CSS rules *and* DOM Events together.

## HowTo: direct DOM Events from CSS?

### Rumble in the jungle: team CSS vs. the web chronotope

In the red corner, weighing in at a total of about 253kg, stands team CSS! Team CSS is made up
of Ada the Kick-Ass-Designer, BigMess Bob and Feeeeeeel-the-Pain Cloe! Behind them, their coach, 
Mr. Big Company, we already see is getting ready to simultaneously throw in the white towel and yell at
them furiously. How about this guy, ha?! He loves to give up early just so he can yell a little.

In the black corner, weighing nothing at all, stands the guy we love to hate, Miiiiiister Weeeeb Chronotope!
As always wearing he is wearing only a black mask to hide his true face and intentions, he literally
jitters in anticipation of digging his teeth into Ada's ass, Bob's man-boobs and Cloe's
forehead. Miiiiister Weeeeb Chronotope everybody, maybe this time somebody finally will understand what
that man is all about and TAKE... HIM... DOWN!!!

"Yeah!! Wooah!" The crowd roars, but before they can really let it all loose the bell rings and the 
fight starts.

In the red corner, Mr. Big Company is of course frantically both blindfolding *and*
tying the hands of team CSS. Having promised to deliver early, Mr. Big Company is behind on time.
And, as always, fighting for Mr. Big Company means that team CSS is only allowed access to *one* of their 
resources! As they seem to have chosen their feet (access to the CSS files), Mr. Big Company is tying 
their JS hands behind their back and blindfolding their HTML eyes. He is a funny guy, that Mr. Big Company. 
He just loves to pigeonhole his poor underlings and apply restrictions so that his teams only need to
talk to him directly and as little as possible with each other. How can we not love this guy?! 
This aaaaaalways leads to such chaos in the end and fights we gladly to pay to watch unfold! 

Out from the black corner, Mr. Web Chrontope formally storms out and immediately starts
circling the whole arena. He is a scary monster that one, black masked, inhumanly fast and with his
constant unpredictable motions in seemingly odd directions that just seem utterly impossible to predict. 
Mr. Web Chronotope sure now how to entertain.

Finally, team CSS is ready to move. Kick-Ass-Ada seems ignorant of the things that are about to happen
and confidently parades into the ring. BigMessBob is a happy man, and ready to run into whatever. 
Only Feel-the-pain-Cloe seems aware of what is going on. She is trying to sneak her way slowly into 
the arena as if she was standing on the edge of a swimming-pool filled with ice water and 
dipping only half her big toe into it. She hardly moves.

*BAM!!* And we have our first hit! BigMess Bob just got whacked down as he just ran out into the ring 
leaving behind CSS rules like they were rice-corns at the wedding steps of his best friend. 
From the right, and incredibly fast, came Web Chronotope hurdling. But Bob is getting up again! 
Completely unaffected about what just happens. He just continues to run and spread even more CSS rules
about. *BAM!!* Hit again, and up again. Wow, what perseverance! It is almost like he can just run around 
and add CSS rules infinitely, no matter what happens. *BAM!!* 

*SLAM, WOING-WOING!!* Wow, Kick-Ass-Ada just got curled up into the ropes! She accidentally tripped in one
of the CSS rules from BigMess Bob had left behind, and as she fell she got rammed by Web Chronotope 
again circling in from the right. Woooah. What a spin of that girls head! She never saw neither the CSS
rules nor Web Chronotope coming AT ALL, and just got thrown up straight into the ropes! 

But what is Feel-the-Pain Cloe doing?! Has she retreated to her corner? 
She is definitively leaning into the ropes, but now she lifts her left leg and stretches it out. 
Hey! She is kicking! What a development this is! What touch-action we see from Cloe! 
Or is it a user-select kick? Hard to see from this angle.
Anyway, doesn't matter, 'cause now Mr. Web Chronotope in coming in from the right again. 
And he runs *SMACK!* into Cloe's foot. Feeeeeel-the-paaaaaain Cloe!! Mr. Chronotope is down
for the first time in this match, with an exquisite pointer-action property/foot maneuver Cloe and
team CSS is wiping the floor with Mr. Web Chronotope.

Cloe is shouting out to Bob and Ada and they also start kicking all over the place. The match has 
completely turned around. What looked like a clear win for the inhumanly fast circling tactic of Mr. 
Web Chronotope has been literally tamed by team CSS. Poping "touch-action: none" and "user-select: none"
properties as if there is no tomorrow, they have slowed down and essentially beaten Mr. Web Chronotope.
He now runs maybe a third of his original speed around the arena, his movements being limited at every 
turn by the constant kicking of team CSS.

Running slower, it is now finally easier to see Mr. Web Chronotope's moves. He was not at all that 
erratic after all. First phase, he runs along the JS half of the arena. Both the DOM is here complete, but 
he only completes the JS tasks that require individual DOM nodes to be ready, and no slotchange tasks 
that require a branch of the DOM be ready. The second phase, he picks up all the tasks that required 
a branch of the DOM be ready, and the executes them, one by one.
Then, the third phase, he runs past the rAF corner, before he in the forth phase runs past CSS style calculations, 
and the fifth phase past layout calculations. Finally, the sixth phase, he runs past the ResizeObserver 
tasks to complete his circle.

What happens when Bob, Ada, and Cloe starts kicking is that they catch Mr. Web Chronotope by surprise while 
he passes his touch and mouse events in his first normal JS phase. And they literally kick him into the 
ropes next to CSS style calculations where he fumbles a bit before he bounces right back. 
What used to be a nice circular motion is now more like an awkward "B" where Mr. Web Chronotope must
run past CSS style calculation an extra time every time he tries to process an touch, mouse or other 
CSS kickable DOM Event.

Ahh.. That wasn't fun at all! Too slow.. Buuuu!! Make them stop kicking! Tie team CSS feet together with
a meter long rope so that they can still run, but not kick. Yes! Let's do that instead. That way, our
favorite enemy Mr. Web Chronotope can run just as fast as he used to and let it be that team CSS will 
have much less control of the DOM Events happening in the arena.



## References

 * 
                                                         -                  