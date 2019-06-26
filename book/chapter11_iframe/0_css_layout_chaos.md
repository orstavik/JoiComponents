# Strategy: DeathToCss

Ok. You have heard it before. "CSS sucks". "Please kill CSS". And hell yes, this article is going to be one of those articles. It is going to be opinionated and negative and dismissive of CSS. And it is going to make yet another argument about *why* you should remove the complexity monster that is CSS from your web app architecture, and *how* to accomplish such a feat with web components.

To accomplish this, I will try to use this "rant" productively. This "rant" is not simply an outburst of frustration. This rant is not meant to comfort myself. This rant is meant to change things, to *fix* the problem once and for all. This rant explains *why* CSS is intrinsically an error of judgment with the urgency the scale of the problem warrants and *how* this problem can and should be fixed.

This article only advocate for the abolishment of CSS layout *in the main HTML document*.  CSS layout, in the main html document, should be replaced with reusable web component pairs that solve one particular layout problem, for all relevant displays. CSS layout must still be used to make the resuable layout web components (low level). After I am done today, there may still be multiple CSS documents on the top-most lightDOM level which control `colors`, `fonts`, `border` and `padding`. But, neither beginner nor expert developers should manage *layout* in general CSS scripts, CSS layout should be *moved* into special web components that *only* solve a layout use case. This is were the CSS grid will shine. As the low level means by which "a thousand different HTML `<table>` elements arise. **All layout should be controlled by web components**.

## Why not CSS? the false hope of separating style and content

First, style and content can be split. At least it appears so. For example, you can make an HTML template that mainly fill with the "content" aspects of your web page, and then style the color and graphics of this template with a set of CSS rules. In fact, you can change a fixed HTML template's appearance quite a lot using CSS. Add `halo.css` to your HTML template, and that heavenly piece of HTML template is made to look like the son of God; add `horns.css`, and you are looking at the devil.
 
But. What such First, a premise. Style and content *cannot* be split. They are intrinsically bound together. You might successfully divide and conquer them on the surface, but as soon as you start to scratch the surface, you always find more bindings and grey areas than you thought of to begin with. I will let others argue this point (todo add refs here, both technical html+css stuff and theoretical). Since content and style cannot be easily separated, this mutes the "raison d'etre" of CSS.

But. This is *not* in itself a good argument that style and content exist separately. It is just
an argument that you can make something look like its opposite using CSS. To make the html template 
look like means first adding two black horns, with such a thick border that they grow into each other
and turn into a hat, and then add the glory too, except pull it down and widen it to make it look like
the brim on the hat which makes... a fireman hat. And there are a million other faces and hats and 
stuff you might need to turn the head into. The fact that the separation of style and content facilitate
turning the son of God into the devil and vice versa using only CSS, and that these are at the opposite
ends of the scale, really doesn't prevent the counter argument that for all the 999.999.999 other 
alternatives *a minor* change of template would accomplish something *far more* appropriate than 
*a grand, super-complex, hacky* change of *only CSS* accomplishes.

Thus, content and style should be developed in coordination. Always. Don't chase the dream of a CSS 
universe separate from HTML, and an HTML template that can be fixed regardless of style. Don't try to
divide labour into design (CSS) and programming (HTML). It is false hope! It will only cause complexity
to grow (by having a CSS developers try to hack out a super complex structure because the "HTML 
template is fixed" or having a programmer trying to produce a wishywashy, super-generic HTML template 
needlessly, in a futile attempt to make it more maleable to the designers wishes).

## Why not CSS? The lie of declarative languages

HTML is a declarative programming language. Given a document with HTML, the browser first
interprets the HTML commands into a DOM. As HTML is not super flexible, the end result is at first
fairly predictable. 

But, JS and server side scripts run against this interpreted structure. Pieces of HTML are embedded. 
DOM nodes and attributes are added and removed. And presto, the DOM is suddenly not so static and 
predictable as you anticipated.

And into this dynamics steps CSS. CSS is a also declarative programming language. But, unlike HTML
which in principal is interpreted against itself only, at least if you exclude a) elements slotted 
into web components and b) embedded HTML fragments, CSS is interpreted against the dynamic DOM.
The rules of CSS don't apply to each other, they apply to the DOM.

This is very complex. To "declare" CSS is in principle to write a program that is to
run against the result of another program, the HTML+script mix.

But, declarative structure of CSS makes you think otherwise. An aspect of declarative programming 
languages is that they lure you into thinking about the state of the app as static (ie. the concept
that linguists call "synchronic", timeless). If you manage to program against a purely static data 
model, this is great. Super. The data *is* always the same. But. This is not the case for most
programmers. The "state" their programs interact with is "mutable and dirty", not "static and pure".
CSS lures you into the false sense of app state; CSS lures you into *feeling* that the state of the
app that you are writing your rule against is somehow static, that it will not be mutated.
As developer experience grows, the insight and awareness that this is a lie grows, it is not normal
for an experienced web developer to think that the DOM will be static. But, the declarative grammar 
of CSS still "talks" as if it is. The experienced web developer simply knows not to listen to it.

As HTML is only interpreted against itself, the idea of a "static and pure state" can be maintained. 
In the context of HTML, a declarative language is fairly unproblematic.
But, CSS is not run in a static and pure context. It runs in a dynamic, mutating and dirty context.
Here, the declarative pull towards seeing this context as static and pure is counter productive.
And it produces unintended results.

The best way to understand these unintended results is a parallel to the myth of Chamberlain.
The myth of Chamberlain is the English prime minister that desperately wants peace. As Hitler invaded
Czechoslovakia, Chamberlain made an exception to the rule, let the nazis keep their spoils and declared
"peace in our time". CSS does the same. As the dynamic DOM produces yet more exceptions, invades and
include yet more new territory in its model, the developer is forced to add yet more CSS rules to try
to keep "stillness in our time". There are no if's, no handling of exceptions, only complete rules 
of all the lands that must constantly be updated.
 
## Why not CSS? declarative programming is hard

There are many myths about programming languages. And one frequent flyer is the myth of the simplicity
of declarative programming.

I will not here make a full account of when, how and why declarative programming is hard. I will only
a) declare that it is not so and b) force you to trust me on it. Only in the comments will I add a note: 
declarative programming languages has been around us for a loooong time, and people have widely chosen 
not to adopt them beyond simple data structures such as HTML.

CSS is a declarative programming language. Some aspects of declarative CSS programming should be 
considered simple: using a simple query selector to attach a property on a group of elements is 
straight forward (enough). Simple CSS inheritance of properties such as `color` can also be considered
foreseeable. 

But, the declarative rules of CSS quickly become tricky. Some CSS properties, and thus some CSS rules
are affected by HTML semantics. For example, if you set `list-style-type` above an `<ul>` in the DOM, will the 
`<li>` elements still inherit the specified `list-style-type`? I don't exactly know. `list-style-type` 
is inherited, but I am not sure if the semantics of `<ol>` and `<ul>` elements break this chain of 
inheritance, or if they only do so in case the inherited `list-style-type` is incompatible. Also, 
reading the "hit-zone" of any complex CSS query can be incredibly hard to foresee, especially in a 
dynamic that includes other HTML fragments, either server-side or client-side.

But, by far the most complex feature of CSS is layout. CSS layout require the interplay of two dynamics,
positioning and sizing. That affect each other. And which is dependent on the element itself, its 
outer context (the parent and sibling elements) and the inner context (the size and elements inside).
Because of the inherent complexities of the task CSS is trying to solve with controlling layout in 
the DOM, the smartest and brightest engineers and programmers behind CSS has *failed(!)* again and again
in solving this problem. In the list of notoriety we can include CSS `float`, `flex`. The latest and 
greatest and trendiest CSS layout solution is CSS Grid, in *no doubt* the very best solution so far,
but also in no doubt a solution that falls short as soon as the web will evolve to its next dimensions
(don't forget, the `grid` is only 2D. Are you sure that a 2D web site will be "good enough" in 2 years
time?)

Programming CSS layout, ensuring that *at least* the following dimensions are in sync:
1. the position system of the element, its inner elements, its sibling elements and the outer elements.
2. the sizing mode of the outer, inner, sibling and self elements.
3. the scaling of the length units. What is `1%` for this element? What is the current `em`? 
   What is the `viewport` context for the elements? How can and should I change and maintain the 
   scaling context for the element?
4. The `box-sizing` context. How do margins and borders affect size?
5. And what else have I forgotten here? What else "can go wrong" when you declare the CSS layout? What
else might be affected?

When you program CSS layout, the rules regulating all of these dimensions must be in sync. And they must
be in sync *when the DOM mutates*. If you add, remove, or move an element, the mutation *must declaratively* 
be written in sync with both its inner and outer and sibling context. To say that this is "automatic"
is a lie. No more nor less. It is false hope. All these dimensions must be in sync, even if sync-ing them
simply means to specify nothing, the default, empty rule. CSS `color` is (almost) technically context 
free (although it needs *active design*, someone with a good, trained eye needs to make them match).
Font-size is as good as context free. But such "pure, single element-context" CSS declarations (read: 
properties) are the outliers. Most CSS declarations operate in a multi-element context. And the DOM, 
the data model, which CSS operate against *is* impure. It *dynamically* mutates all the time. CSS is
a dream. For it to be a good dream, its rules should be *more* independent from each other. For it to
be a good dream, its data model should be "purer, less dynamic". Program CSS layout, and you feel it.
Look at all the history of failed attempts of finding the *right way* to declare layout across elements.
 
There is no way to fix these underlying problems *with* CSS. You cannot separate the semantics of layout
from the semantics of HTML elements. You cannot isolate CSS rules to a single layer of elements. You 
cannot isolate layout from other behavior such as event management. There is only one way to truly fix
these problems. And that is *without* CSS. The semantics of multi-element layout must be moved back 
into the HTML element and merged with its other semantics. It cannot be avoided. And there is one way
to actually do so: web components.

## How? layout web components

When you need a custom lay out of one or two or three or four levels of elements, make custom web 
component patterns. The best example of what this looks like is the good'old `<table>` element.
Omg, wtf, did you say `<table>`?!?! Is `<table>` the thing that is going to fix CSS? CSS was meant to
fix the horror that was `<table>`?

Yes, you are not going to *use* `<table>`, you are going to *make your own* `<table>`-like elements.
One new set of `<table>` and `<tr>` and `<td>` that does the thing you need, and not much more. And
that are responsive, that incorporate their own CSS media query strategy. There will be thousands of 
them. Some super small, some super elaborate. And it *is* faster for you to make your own such elements
if you can't find other good ones to reuse than it is to try to *avoid* such encapsulation and mix the
low level CSS layout in your other HTML documents.

Now, you might think that it might be a good idea to have just *one* CSS grid in the main document.
After all, that is not so complicated. But. No. That one grid is likely connected to CSS media queries
and custom event interaction. That means that a set of event listeners, CSS styles and CSS media queries
and maybe some DOM elements, that can successfully be encapsulated in a web component is poured into 
the main document. And once that bowl of spaghetti is boiled, these conceptually isolated threads are 
much harder to get out.

`<table>` is not the only relevant role model for you layout web components. `<ul>`, `<ol>`, `<li>`
is another. `<select>` and `<option>` a third. `<form>` and `<input>` yet another. The list goes on.
Making such resuable elements *saves* time. And *removes* layout from the CSS in the main document.

## Content model and category

currently the content model (ie. inline elements can only nest inside itself other inline elements, 
not block elements) is based on the element type. In web components, there is no such model to specify
which other type of elements *can be* slotted into what `<slot>` element. To declaratively specify
a `<slot>` and/or `<slot>`-filter based on element type, is something that is lacking in the web 
component standard.

How and when to specify such element type "categories" and content models, that is something that needs
to be worked through. However, I believe this can be simply taken out. I also believe that ARIA roles
should consume the content model. And, I finally believe that ARIA roles should be setable via CSS.