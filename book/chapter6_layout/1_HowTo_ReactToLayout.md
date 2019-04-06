# HowTo: react to layout

Layout is the calculation of all the spatial dimensions for all the elements on a web page.
If you think of the elements in the CSSOM as little boxes, then layout is the process of finding out
their width, height, and position in the x, y, and z dimension.
A web page can benefit from knowing the layout of one or more elements in its content, and 
then reacting (changing its appearance) so to look better. So, when we developers think about layout,
we not only think about how the page will end up looking, but also on how we can observe and then use
these the dimensions and positions of these little boxes in our web app and/or web component.

## Native layout reactions in CSS

CSS is the obvious candidate for observing and reacting to a web page layout. 
And CSS therefore also have the power to do so in its @media queries.
In CSS media queries you can for example say that "if the screen is small, then use this CSS rules 
that specify a smaller font".

CSS media queries are great. They have an elaborate syntax for observing different aspects of the 
`window` object's layout, and once the media query trigger, it activates or deactivates a set of CSS 
rules.

But, there is a limit to the CSS layout observation and reaction powers. They only work on the `window` 
object. They only work on the level of the app as a whole. It provides zero framework support if you
wish to monitor the layout of an individual element (ie. the host element or shadowRoot of a web component).
CSS media queries are completely stuck in the old "the programmer develops an app, and therefore can
access the entire DOM"; CSS media queries provide no support for layout reactions in CSS if you limit
the scope of the developer of a web component to itself.

## Native layout reactions in JS

Chrome provides an observer called `ResizeObserver()` that enable the developer to observe the 
layout properties for each individual element and then trigger a callback function as a reaction in JS 
to each and every change of the elements layout size.

Other browsers do not provide such a facility for layout reactions, but a similar effect can be achieved 
by for example observing the layout changes of elements in the DOM once per animation frame and then
triggering callback functions when these attributes change between frames.
It takes little effort to make a crude `ResizeObserver()` in all browsers using: 

1. `requestAnimationFrame(...)` to que repeated observations of layout properties for a set of 
   observed elements,

2. `getBoundingClientRect(...)` to force the browser to calculate the layout properties of each 
   element,
   
3. and then wrap this all up in a batch process that caches a set of callback methods per observed 
   elements, and call these callback methods every time the layout dimensions on the element changes.
   
## What about native layout reactions in HTML?
 
Natively, the DOM can neither observe nor react to layout changes. 
The layout properties of the DOM element are hidden 
(ie. they must be called from JS and they do often not yet exist).
There is also no way to specify in HTML that layout properties should be visible in the DOM, 
that some attribute might reflect the current or past state of an elements layout.

Later in this chapter I will advocate for HTML and the DOM as the best place to:

1. reflect the layout state of individual DOM elements, so that

2. CSS rules can observe and react to layout changes not only for the `window` object/`<body>` element,
   but for individual elements as well, and also

3. trigger JS functions in `MutationObserver(...)`s and `attributeChangedCallback(...)`s, thus
   bypassing the `ResizeObserver(...)` completely.
   
I will argue that the problem of how to implement layout observation and reaction in CSS and JS is to:
1. ***directly** enable layout observation to be specified and reflected in HTML*,
2. ***indirectly** enable layout observation to be controlled from JS via HTML attributes*,
3. ***indirectly** enable layout reactions in CSS and JS via HTML attributes that both CSS and JS has 
   good support for directly observing and reacting to*.
   
The problem of layout reactions for web components is not best implementation strategy. 
The problem for layout reactions is the complexity that it entails, even when best strategy and practice
is followed.

## References

 * 
 
## old drafts

chapter 1: how to react to layout: 1
ResizeObserver inside a web component.
Layout reactions can be done using ResizeObserver.
This gives the element a way observe its own size.

chapter 2:  ResizeCallbackMixin.    NaiveLayoutMixin
Takes the reaction set up using ResizeObserver, and then wraps it in a Mixin. 
Very simple. Very short.

problem with this is that it can only be controlled from a) inside the web component
and b) from JS. Not from outside the component, not from CSS. Other problems are c)the order of 
the callbacks and d) the timing of the callback (before or after style (CSSOM mutation) reactions), 
but that we will return to later.

chapter 3: how to react to layout: 2
CSS media queries reacting to layout changes (of the window).
This could be VERY useful for a web component too.
It could select between styles depending on the component dimensions, or position.
If the component.width > 200px, the component is styled as big, if it is < 200px, it is styled as small.
If it is positioned to the right, it is rotated to the right. To the left, it is rotated left.

How to make a CSS media query for a web component?
How to make a layoutCallback() that can be a) overridden externally and b) controlled via HTML and CSS
too.