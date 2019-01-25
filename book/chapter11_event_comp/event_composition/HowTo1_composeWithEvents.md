# HowTo: Event composition

## What does it mean "to compose" HTML, JS, and CSS?

> "It's a beautiful thing, the Destruction of words. Of course the great wastage is in the verbs and 
> adjectives, but there are hundreds of nouns that can be got rid of as well. It isn't only the 
> synonyms; there are also the antonyms. After all, what justification is there for a word, which is 
> simply the opposite of some other word? A word contains its opposite in itself. Take ‘good,’ for 
> instance. If you have a word like ‘good,’ what need is there for a word like ‘bad’? ‘Ungood’ will 
> do just as well – better, because it's an exact opposite, which the other is not. Or again, if you 
> want a stronger version of ‘good,’ what sense is there in having a whole string of vague useless 
> words like ‘excellent’ and ‘splendid’ and all the rest of them? ‘Plusgood’ covers the meaning or 
> ‘doubleplusgood’ if you want something stronger still. Of course we use those forms already, but in 
> the final version of Newspeak there'll be nothing else."
>
> 1984, by George Orwell

In web-speak, "to compose" means to combine stuff to make a web page. When you "compose" your web page, 
you must use a little HTML. And you do not *have to* use neither JS nor CSS nor any events to make a
web page. So, strictly speaking, you can "compose" a web page using only by writing HTML.

But, nowadays most web pages are small web apps. The web page include both JS and CSS and have events 
flying around like mad. So, when we "compose" a web page today, we think of it as combining HTML and
JS and CSS with a bunch of events. So, "to compose a web page" today means more "to combine stuff 
written in HTML with other stuff written in JS with more stuff written in CSS with DOM Events" to make 
a functioning app.

So, when you hear someone talk about "composing" something on the web today, think of it as the act
of "combining HTML with CSS, JS, and/or DOM Events" to make something. Try to avoid to use the term
"compose" about simply writing something in HTML, CSS or JS when you think of this text in isolation.
Use "compose" when you want to highlight that your HTML template, CSS rules or JS code is oriented 
towards each other.

## DOM Events: the fourth power

Exactly what role does DOM Events such as `click`, `offline`, and `mousemove` play in a web app?
Are they part of the DOM, like neurons that communicate messages between DOM elements?
Are they part of JS, a simple subdivision of the web programming language? 
And which role does CSS and DOM Events have for each other? Are they just friend of a friend? 
Bound together only through their shared friends HTML and JS, but themselves never in direct contact?

The answer to this question is that DOM Events is *independent of* and *directly bound to* both
HTML, JS, and CSS. DOM Events does not exist in isolation, as does neither HTML, JS, nor CSS. 
DOM Events exists on par with the other three and should be viewed as the fourth power in a web app.

At first, this perspective is a bit confusing. Why, DOM Events are not independent?! 
You have to have HTML elements to have a DOM, so no DOM Events without HTML elements. Right?!
Also, as developers, DOM Events are only useful if we listen and react to them with a JS functions.
After all, if a three falls in the forrest, and no one is there to try to catch it, 
it makes no squashing sound, right?!
And, come on, CSS and DOM Events are not directly connected. They are friends of friends.
Nah. This is bogus.

But. It's not. If we look closer at these ideas about DOM Events as being subjugated to HTML and JS, 
and only indirectly connected to CSS, several issues pop up.

First, DOM Events do make a squashing sound in the forrest, even if no event listener is there to catch it.
Link navigation, drop-down-selects, and swipe-to-scroll are very important DOM Events for our web apps
even though we might never touch them with JS. For many, many years, developers
proudly presented "interactive web sites" that contained no JS, only HTML elements and DOM events.
`<a href="...">` and `<select><option>` were oh-so-powerful indeed. 

Second, DOM Events originate on the platform independently of both JS functions and 
HTML elements. The user moves his finger, and something deep down in the OS and browser is then 
responsible for finding both the HTML target element and que JS event listener callbacks and 
defaultActions in the browser's event loop. DOM Events are born separate. 
And they are not only JS functions, they can be defaultActions too, which are not JS at all.

Third, we don't *always* mix HTML elements with DOM Events.
`window.addEventListener("offline", alert("Panic attack!"));` does not rely on any DOM elements to work
(if you can get over yourself and your profound insight into HTML and accept that I don't include 
the `<script>` tag that holds the JS function in this equation). 

Fourth, DOM Events are actually controlled from CSS. The CSS properties such as `touch-action` and 
`user-select` are events controlling directives from CSS. And. CSS can be controlled from DOM Events.
`:hover` is a CSS selector that is directly directed from DOM Events (cf. `mouseover`).
Sure, there is a shared HTML element friend in the mix here, but CSS and DOM Events are definitively
also in direct contact.

The conclusion is: DOM Events are both *independent of* and *directly bound to* both HTML, JS, and CSS.
When we "compose" our web apps, we are mixing four main ingredients: HTML, JS, CSS, and DOM Events.
The web is a chair with four legs.

## HowTo: compose with DOM Events?

Being a four legged chair, there are *obviously* seven ways to "compose" with DOM Events:

1. JsToEventComposition: JS functions are used to create, direct or stop DOM Events.
2. EventToJsComposition: DOM Events are used to direct JS functions.
3. HtmlToEventComposition: HTML elements are used to create, direct or stop DOM Events.
4. EventToHtmlComposition: DOM Events are used to alter HTML elements.
5. CssToEventComposition: CSS rules are used to direct or stop DOM Events.
6. EventToCssComposition: DOM Events are used to activate CSS rules.
7. EventToEventComposition: DOM Events are used to compose other custom DOM Events.

> If you are still searching for the eight way, you recommend that you look under the seat of the 
four legged chair you are sitting on. I promise, you will find it there;).)

This chapter will discuss how we can combine with DOM Events with JS, HTML, and/or CSS.
In the next chapter, we will dive deep into EventToEventComposition.
The patterns described in EventToEventComposition are the true value of this project.
However, in order to understand *how* a custom DOM Event should behave, we need also 
to understand *how* and *why* DOM Events can and do interact with HTML, JS, and CSS in certain ways.

## References

 * 