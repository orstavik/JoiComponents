# Problem: DOM Folding

> DOM folding is a new term I am now going to invent in order to describe the very old problem of 
organizing HTML, CSS and JS code in web apps. "Great!", you might think, ironically, "a new word is
exactly what we need to solve web problems!" But, stupid as I am, this irony is completely lost on
me. And so I just continue.

When you change something in the DOM, these **DOM mutations** can alter the screen image. 
For example, if you add or remove an `<img>` element to the DOM, then an image 
will (dis)appear on screen. Such DOM mutations can be done in *both* HTML template *and* via JS, and
it is because the DOM can be created and mutated from both HTML and JS we think of it as "the DOM", and
not simply "HTML".
 
All DOM mutations must not alter the screen image. For example: elements can be added to or 
removed from the DOM outside of the viewport; the web app might also load or alter styles or attributes 
or other data that for some reason or another does not affect the painted image.
However, the prototypical end-goal of DOM mutations is to alter the screen image, and 
so to think of *DOM mutations as the *first step* on a longer journey where changing the screen image is
the *last* step*, is quite alright.

**DOM folding** are all the steps that start with a DOM mutation and end with a screen image update.
But, what exactly happens on this journey? What are the obvious, well known steps in between a DOM
mutation and a screen image update? And what are the lesser known steps? Let's dive in!

## #1: CSS

The DOM contains a group of style elements (`<style>` and `<link rel="style">`).
These style elements adds a series of CSS rules to the web application. 
In order to know the style of an element in the DOM, 
these CSS rules must be matched with the other elements in the DOM to create a CSSOM. 
The CSSOM is the DOM, when all the CSS rules within it has been calculated and applied to 
all the other elements inside it according to CSS grammar and semantics.

Almost all DOM mutations, ie. adding, moving, removing or changing an element or an attribute,
require that the browser (re-)calculate CSSOM values. And this calculation is not a prickly task; on
the contrary, whenever an element in the DOM mutates, this will likely require the recalculation of not
only the mutated element, but also all its sibling and descendant elements that now might be found by 
new CSS selectors or inherit other inheritable or cascading properties. 
As CSS cascade, even a tiny DOM mutation can turn into a flood of CSSOM mutations.
And so every DOM mutations can potentially cause extensive recalculations of the CSSOM.

## #2: Layout

To turn the CSSOM into a screen image, the first thing the browser does is to calculate the size and position
of all the CSSOM images in stack of several two dimensional layers. This process is called "layout".

From a global perspective, layout is a simple function. You pass layout a finished CSSOM, and 
it spits out a new object that adds width, height and x-, y-, z-coordinates coordinates to every
element. I call this object the LayCSSOM, as it can be thought of as a CSSOM with layout added.

However, the inside of the layout calculation can be quite cumbersome and complex.
To calculate layout, the browser can first try to define the position and style of the elements top-down, 
left-to-right. But many CSSOM elements' size and position cannot be found in this way.
Many CSSOM elements have style properties that require the browser to look at the properties of their
parents, ancestor elements, siblings, children and a combination of such other elements.
This means that layout calculation might look both up, down, sideways and in and out while it process
the elements in the CSSOM. And this is important to keep in mind both when specifying the layout of 
elements in CSS, and especially when implementing layout reactions in JS.

## #3: Postponed CSSOM calculation

Every time you alter the DOM, this might affect the CSSOM. That means that if you mutate the DOM 
*twice* in a row, and neither of these operations need to know anything about the CSSOM, 
then you want to perform *both* of these operations *first, before* you calculate the CSSOM. 

Very few DOM mutations require CSSOM values. Therefore, the browsers by default *postpone* the 
calculate of the CSSOM until all HTML and JS operations have been completed. The browsers *only*
calculate the CSSOM before it paints a new screen image *or* if a script explicitly asks for a CSSOM
value via `.getComputedStyle()`. *Postponed CSSOM calculation* greatly improves
the browsers performance.

Because the browsers by default *postpone CSSOM calculation*, this has also reflexively influenced 
the strategies of web developers: DOM mutations that require CSSOM calculations are hundreds of times
heavier than DOM mutations that do not need CSSOM values, and therefore web developers will do almost
anything to avoid calling `.getComputedStyle()`.

## #4: Postponed Layout calculation

Every time you alter the CSSOM, this might affect the LayCSSOM. That means that if you mutate the CSSOM 
*twice* in a row, and neither of these operations need to know anything about the LayCSSOM, 
then you want to perform *both* of these operations *first, before* you calculate the LayCSSOM. 
Yes, exactly like CSSOM calculation.

Very few CSSOM mutations require LayCSSOM values. Therefore, the browsers by default *postpone* 
layout calculation until all HTML, JS *and* CSSOM calculations have been completed. By default, 
the browsers *only* calculate layout *after* CSSOM calculation and *before* it paints a new screen 
image, *or* if a script explicitly asks for a CSSOM value via `.getBoundClientRect()`, or similar. 
*Postponed layout calculation* greatly improves the browsers performance.
Yes, exactly like postponed CSSOM calculation.

Because the browsers by default *postpone layout calculation*, this has also had a reflexive influence 
on the strategies of web developers: DOM mutations that require layout calculations are thousands of 
times heavier than DOM mutations that do not need layout calculation, and therefore web developers will
bend over backwards to avoid calling `.getBoundingClientRect()`.
Yes, exactly like with `.getComputedStyle()`.

This, more or less, ends the state of the well-known, best practices in the browsers.
Now, let's start to look at the unknown aspects of DOM folding.

## #5: DOM NODE mutations vs. DOM TREE mutations

In the world of established web development, all DOM mutations that do not require CSSOM or LayCSSOM
data are synchronous in JS. The business logic of the app might require one DOM event to be processed 
before another DOM event or callbacks to be handled in a certain order. But,
from the perspective of DOM folding, there is no difference between DOM mutations and they can all
be done in the order the app needs.
Unfortunately. I am here to tell you that this is no longer true.

With web components came a new DOM event: `slotchange`. `slotchange` is triggered
when a DOM mutation causes one or more elements to be slotted into another element. 
Currently, this DOM event is processed at the same time as all the other DOM Events and callbacks, 
ie. synchronously in JS.

But, the `slotchange` event looks different from the perspective of HTML (predicative standpoint) and
from the perspective of JS (imperative standpoint). This becomes evident when you for example make and 
then add a branch with several web components to the DOM. From the perspective of JS, these elements
will then be created one by one (a series of `document.createElement` operations) and then the elements 
are organized in a tree structure (a series of `element.appendChild` operations). However, viewed from
the declarative standpoint of HTML, creating and adding this branch is just a single step, an atomic
operation. From the perspective of HTML, there will never exist a series of half-finished, temporary
HTML branches - these states does not exist in HTML. And therefore, an HTML developer will be very
surprised to learn that when a branch of HTML nodes are created and added to the DOM, this can trigger
*multiple* `slotchange` for *the same* `<slot>` elements.

This is truly advanced stuff. And to better understand it, I recommend (re)reading the chapter on
`slotCallback(...)`. A tip along the way is to understand that you can view the process of adding
an HTML branch *both* as a single operation in HTML (synchronous in the predicative sense => atomic) 
*and* as a series of several operations in JS (synchronous in the imperative sense => sequence).
But, the conclusion is never the less the same. There are *two* types of DOM mutations:
DOM NODE mutations and DOM TREE mutations.

## #6: DOM NODE mutations

**DOM NODE** mutations are mutations that can consider the DOM as just a bunch of nodes. 
Most JS driven DOM mutations fits within this step:

1. creating/deleting DOM nodes and adding/removing them to/from the bunch,

2. altering HTML attributes,

3. altering the text content of DOM nodes.

 * If you only adding, moving and removing DOM nodes in the DOM is *not* part of this stage, 
   although it is only the reactions of these DOM mutation operations that become problematic, 
   not the operations in themselves.

Some parts of what you do when you define the DOM in HTML template also fits in this view.
HTML attributes are for example a *single DOM NODE* property: you can add HTML attributes to an 
individual DOM node just as easily as you can adding the same attributes to a DOM node positioned
in a tree.

HTML elements are also created as single elements. However, in HTML, elements are declared directly 
*in place*. It is an alien concept to view the declaration of DOM NODES in HTML
template as a two step process (first making the element and then positioning it).
But, from the imperative view of JS and the DOM folding process, this *is* a two step process.

## #7: DOM TREE mutations
   
**DOM TREE** is the second stage of DOM mutations. The DOM TREE stage 'errects' all the DOM NODES 
in the bunch into a neatly ordered tree structure. This is the process of considering the order and 
hierarchy of the DOM nodes. While DOM NODE perspective somewhat fits with our JS perspective on DOM 
mutations, the DOM TREE perspective is very familiar to us from an HTML standpoint as it reflects 
the finished *result* DOM. To make HTML template *feels* very much like only specifying the 
organisation of DOM nodes, although from an imperative, JS standpoint it presupposes that the elements 
positioned are also first created.

In JS, the act of adding, moving and removing elements into positions as a child of another element
is part of this stage. However, purely positioning elements in the DOM is unproblematic, and can 
therefore be implemented together with the DOM NODE step.
However, the `slotchange` event (plus some `childlist` `MutationObserver` callbacks) are JS operations 
that conceptually require the DOM TREE to be completed before execution.

The end result is that DOM folding is a four step process:
1. DOM NODE
2. DOM TREE 
3. CSSOM 
4. LayCSSOM

## #8: DOM folding cascades

Imagine that your application has been running for a little while. Then, a user action triggers a 
DOM event listener that in turn mutates an HTML attribute on a DOM NODE. 
A *first* DOM NODE mutation occurs.

The DOM NODE attribute happens to be on a web component that observes it, and its changing value causes
this web component to add a new branch of elements to its shadowDOM.
This little DOM TREE branch contains a series of DOM NODES, thus causing 
a *second* and *third* DOM NODE mutation and a *forth* DOM TREE mutation.
One DOM NODE mutation has suddenly spawned to become four DOM NODE/TREE mutations.

Thankfully, none of these spawned DOM NODE/TREE mutations triggered a reaction that
mutated something in the DOM. No `slotchange`, `attributeChangedCallback(...)` or `MutationObserver`
were listening for these changes. The browser therefore completes the *second* and *third* DOM NODE,
then the *first* DOM NODE mutation, and then finally the *forth* DOM TREE mutation. 
(Using the `slotCallback(...)` ensures that DOM TREE mutations are delayed until all DOM NODE 
mutations are completed.)
This results in a correctly 'unfolded' DOM, and the browser can move on and calculate the CSSOM.

When the CSSOM is recalculated, the DOM NODE and TREE mutations causes a *fifth*, *sixth* and 
*seventh* CSSOM mutation. The fifth and sixth CSSOM mutations cause no effects, but the seventh 
CSSOM mutation triggers a JS function `styleCallback(...)`. The `styleCallback(...)`
uses the new CSSOM value to alter the composition of another web component's shadowDOM, thus 
spawning an *eighth* DOM NODE mutation, a *ninth* DOM TREE mutation, which in turn
causes a *tenth* CSSOM mutation.
To keep things simple, these mutations does not cause any additional JS reactions, 
thus after having been resolved leaves the browser with a correctly unfolded CSSOM.
And the browser passes this CSSOM into the layout process.

Again, the changes in the CSSOM since last layout calculation causes two elements to change dimensions,
ie. the *eleventh* and *twelfth* LayCSSOM mutation. 
The *twelfth* LayCSSOM mutation causes no JS reaction, but the *eleventh* LayCSSOM mutation is 
observed via a `ResizeObserver` or some other kind of layout observing callback. 
The `ResizeObserver` callback causes a *thirteenth* and *fourteenth* DOM NODE 
mutation. These DOM NODE mutations in turn causes a *fiftenth* mutation when the CSSOM is calculated 
next which in turn causes the browser to calculate yet another LayCSSOM object which contain a 
*sixteenth* LayCSSOM mutation. 

Neither of these DOM NODE, CSSOM, nor LayCSSOM mutations trigger any further JS reactions 
that would cause this process to be stretched out, which therefore leaves the browser with a 
correctly unfolded LayCSSOM that it can pass to the paint process to update the screen image.

#### DOM folding cascades

We can view DOM folding as a process of completing a change to either a DOM NODE, a 
DOM TREE, the CSSOM, or the LayCSSOM. However, these processes can cascade, in *two* dimensions(!).
1. DOM NODE mutations can cause DOM TREE mutations can cause CSSOM mutations can cause LayCSSOM 
   mutations.
2. JS functions observing a LayCSSOM(CSSOM(DOM TREE(DOM NODE))) mutation can in turn cause 
   mutations of other DOM TREE(DOM NODE) elements.

DOM folding cascades *both* between the different layers of the LayCSSOM *and* between different 
elements in the LayCSSOM. "OMG!", you might think for yourself. And you are absolutely right.

## #9: How to control DOM folding cascading.

If DOM folding operations cascaded in *all* directions, no OM would ever get to be resolved.
It is therefore important to *constrain* the directions in which DOM folding cascades. And, there
are three simple rules *all* DOM folding processes should conform to.

DOM folding always:
 * cascades from DOM NODE -> DOM TREE -> CSSOM -> LayCSSOM and in
 * cascades from one element to the next in TREE ORDER (top-down, left-to-right).
 * no DOM folding processes can *only* mutate any LayCSSOM property of contained elements.
 
As long as the above rules are kept, the hypothesis is that DOM folding can be managed.

## #10: Practical constraints on DOM folding 1

DOM folding is expensive. Due to the nature of CSS and established practices in the browser,
calling `.getComputedStyle(...)` and `.getBoundingClientRect(..)` takes a lot of time.
Therefore, it is better to cascade *between elements first* and *between DOM folding layers last*.
This means that all DOM NODE reactions should be processed first, 
then all DOM TREE reactions, then all CSSOM reactions, and then all LayCSSOM reactions.
It might look like this:

```
LayCSSOM reaction {
  DOM NODE mutation;
  DOM NODE reaction {  /*DOM NODE reactions are processed sync*/
    DOM TREE mutation;
  }
  DOM NODE mutation;                   
  CSSOM mutation;      /*affected, but not yet calculated*/
  LayCSSOM mutation;   /*affected, but not yet calculated*/
  DOM TREE mutation;   /*affected, reaction delayed using slotCallback(...)*/
  
  DOM TREE reaction {
    DOM NODE mutation;
    CSSOM mutations;
  }
  CSSOM reaction {
    DOM NODE mutation;
    DOM TREE mutation;
    DOM TREE reaction {
      DOM NODE mutation;
      DOM NODE reaction; {
        DOM NODE reaction;
      }
    }
  }
  CSSOM reaction {
    CSSOM mutation;
    LayCSSOM mutation
  }
}
LayCSSOM reaction {
  ...
}
```
When DOM folding processes 'unfold', they form a hierarchy. 

1. the DOM NODE and DOM TREE processes run. Here all the DOM NODE operations run and all the
   reactions to individual DOM NODE operations such as `attributeChangedCallback(...)` run
   synchronously in JS. 
   
2. Then DOM TREE reactions run. `slotCallback(...)` delays them using `async/await` (`Promises`). 
   These reactions can trigger DOM NODE mutation and DOM NODE reactions, and these 
   will be completed first before any other queued DOM TREE reaction can run. 
   In essence, a DOM TREE reaction will finish all pending DOM NODE reaction before it
   passes its control to the next DOM TREE reaction.
   
3. Then, when the DOM TREE is ready, the CSSOM is calculated. This will trigger potential CSSOM reactions.
   The CSSOM reaction will ensure that all DOM NODE and DOM TREE reactions will finish before 
   passing control to the next queued CSSOM reaction.
   
4. Finally, once the CSSOM is completely unfolded, the LayCSSOM is calculated.
   Any LayCSSOM reaction will complete all DOM NODE, DOM TREE and CSSOM calculations as described 
   in steps 1, 2 and 3 before passing control to the next LayCSSOM reaction. 

## #10: Practical constraints on DOM folding 2

To calculate CSSOM and LayCSSOM accurately is costly. However, these costs can be cut if one also
cuts in accuracy. For example. If you assume that no LayCSSOM reactions will trigger any CSSOM 
reactions, you can process all CSSOM reactions once and then all LayCSSOM reactions once, 
per animation frame. This is principally naive, as LayCSSOM reactions can cascade into new 
CSSOM reactions. But it is faster, and might yield a good practical solution, in some situations.

In any case, there might be several different strategies by which DOM folding might run, 
with varying degrees of accuracy. Below, the strategies are listed from most accurate/most costly to 
least accurate/costly:

1. **Complete element-by-element**:
   Process both CSSOM and LayCSSOM reactions before moving on to the next element in TreeOrder.

2. **Complete layer-by-layer**:
   Process CSSOM reactions for all elements first, then the first LayCSSOM reactions. 
   After every LayCSSOM reaction, process all CSSOM reactions again. 
   When selecting the next LayCSSOM reaction, observe LayCSSOM values a new.
    
3. **Complete style, layout only once**:
   Process CSSOM reactions for all elements first.
   Then observe the LayCSSOM values for elements with LayCSSOM reactions, and cache these values. 
   After every LayCSSOM reaction, process all CSSOM reactions again. 
   When selecting the next LayCSSOM reaction, reuse the cached LayCSSOM values.
   
4. **Style once, layout once**:
   Process CSSOM reactions for all elements first, then process LayCSSOM reactions for all elements second.
   Do not check for any new CSSOM reactions between LayCSSOM reactions.
   CSSOM reactions that are caused by a LayCSSOM reaction will not be processed until the next frame
   (ie. they will cascade across animation frames).

Minor DOM mutations might cause large cascading recalculations of first style and second layout that 
might seem superfluous, but due to the finer grammatical and semantic details of CSS are necessary.
Browsers also process CSSOM and LayCSSOM differently. And use different strategies to speed this 
process up. And they base most of their style and layout calculation efficiency mechanisms on the 
concept that they will only be calculated once per frame. All of these factors, and more, 
are counter arguments to implementing CSSOM and LayCSSOM reactions.

Some rules of thumb can and therefore should be used when working with CSSOM and LayCSSOM reactions.

1. Layout reactions can be a bit tricky to ensure only affects contained elements.
   To put simply, only use layout reactions on elements whose size is calculated top-down, 
   such as `display: block`.

2. Layout and style reactions should be turned off when they are not needed for longer periods.
   Using a nested `requestAnimationFrame(()=>requestAnimationFrame(()=>styleAndLayoutReactionsOff());`
   can for example turn styleAndLayoutReactions after first or second iteration.

3. Layout reactions can be turned on only in certain circumstances, such as triggered by the `resize`
   event.
   
4. Style calculations mostly depend on DOM NODE or DOM TREE mutations, situations that cannot 
   efficiently be observed using DOM events, MutationObservers or similar. Alternative strategies
   to reduce the load of style reactions can therefore be to pause all style reactions:
   1. for 50ms if no style reactions was processed last round, or
   2. until certain aspects of an apps global state is altered (ie. activate style reactions via a
      single state observer).

5. Both style and layout reactions should be used on elements there are few of in an app, 
   such as elements that structure the entire app. For example: 
   If you make a game, the frames around the game, the menu and possibly visualization of game 
   controllers might react to style and layout mutations. These elements will likely alter rarely 
   (thus is ok to pause) and one-of-a-kind (will not fill the list of elements that need to observe
   and possibly react to style and layout changes). Game pieces and game objects on the other hand are 
   likely to be many-of-a-kind and actively changing. Although style and layout absolutely *can be*
   used to successfully manage these elements look an appearance, to do so would definitively require
   more attention to race conditions and performance bottlenecks. 

## References

 * Layout thrashing