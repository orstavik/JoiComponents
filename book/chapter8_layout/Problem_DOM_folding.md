# Problem: DOM Folding

> DOM folding is a new term I am now going to invent in order to describe the very old problem of 
organizing HTML, CSS and JS code in web apps. "Great!", you might think, ironically, "a new word is
exactly what we need to solve web problems!" But, stupid as I am, this irony is completely lost on
me. And so I just continue.

When you change something in the DOM, these **DOM mutations** will usually also alter the screen image 
presented to the user. For example, if you add or remove an `<img>` element to the DOM, then an image 
will (dis)appear on screen. Such DOM mutations can be done in *both* HTML template *and* via JS, and
it is because the DOM can be created and mutated from both HTML and JS we think of it as "the DOM", and
not simply "HTML".
 
All DOM mutations does not *have to* alter the screen image. For example can elements be added to or 
removed from the DOM outside of the viewport; the web app might also load or alter styles or attributes 
or other data that for some reason or another does not affect the painted image, but something else.
However, the prototypical end-goal of DOM mutations is to alter the screen image, and 
so to think of *DOM mutations as the *first step* on a longer journey where changing the screen image is
the *last* step*, is quite alright.

And this "long journey from DOM mutations to screen image change" I here dub **DOM folding**.

1. a DOM mutation is the *first* step of DOM folding.
2. screen image update is the *last* step of DOM folding.

But what happens in between? This is where things start to get really complex, and really interesting.
Let's start by discussing the obvious, well-known in-between steps.

## #1: DOM folding involves style calculation

The DOM contains a group of style elements (`<style>` and `<link rel="style">`).
These style elements adds a series of CSS rules to the web application. 
In order to know the style of an element in the DOM, 
these CSS rules must be matched with the other elements in the DOM to create a CSSOM. 
The CSSOM is the DOM, when all the CSS rules within it has been calculated and applied to 
all the other elements inside it according to CSS grammar and semantics.

Almost all DOM mutations, ie. adding, moving, removing or changing an element or an attribute,
require that the browser (re-)calculate CSSOM values. And this calculation is not a prickly task; on
the contrary, whenever an element in the DOM mutates, this will likely require the recalculation of not
only the mutated element, but also all its sibling and descendant elements that now might be found by new 
CSS selectors or inherit other inheritable or cascading properties. As CSS cascade, DOM mutations can
cause sweeping changes to the CSSOM, thus requiring inclusive style calculations.

## #2: DOM folding involves layout calculation

To turn the CSSOM into a screen image, the first thing the browser does is to calculate the size and position
of all the CSSOM images in stack of several two dimensional layers. This process is called "layout".

Although quite cumbersome and complex in its detail, layout is not a conceptually complex process overall.
To calculate layout, the browser tries first to define the position and style of the elements top-down, 
left-to-right. Some CSSOM elements' size and position can be found this way, looking at only one element.
But other CSSOM elements have style properties that require the browser to look at the properties of their
parents, another ancestor element. Other CSSOM elements have even more complex rules that require the
browser to calculate their size and position together with their siblings, children or descendant elements.
To do so, the inner workings of layout calculation might need to go up and down and in and out for a couple
of rounds, in complex ways. But seen from the outside, the CSSOM is passed into a layoutCalculationFunction
that in turn spits out a CSSOM-with-LAYOUT Object Model (LayCSSOM).

## #3: DOM -> CSSOM -> LayCSSOM

Every time you alter the DOM, this might affect the CSSOM. That means that if you have *two* 
operations that is going to mutate the DOM, and none of these operations need to know anything about
the current state of the CSSOM, then you want to perform *both* of these operations *first, before*
you calculate the CSSOM. This is well known.

Since almost no operations that mutate the DOM read or use the values that would require the 
CSSOM to be calculated, the browsers *only* calculate the CSSOM at the end of all normal HTML and JS 
operations. By delaying the CSSOM calculation until after several DOM mutations have all been completed,
the browsers performance greatly improve. This also reflexively influence the strategies of web 
developers: as they know they do not have CSSOM values available during DOM mutations, 
they try their very best to find strategies to make their web apps work that use other means than
reading style. This is also well known.

Every time you alter the CSSOM, this might affect the LayCSSOM. That means that if you want to avoid
calculating the LayCSSOM *before* you update the CSSOM, because any later change to the CSSOM will
cause you to have to redo your LayCSSOM calculations. Again, this pushes the system architecture to
establish a pecking order where:

1. All known DOM mutations are completed first,
2. then the CSSOM calculation is performed, and
3. then the LayCSSOM calculation is performed.

This, more or less, ends the state of the well-known and agreed upon practice in the browsers.
Now, let's start to look at the unknown and not agreed upon aspects of DOM folding.

## #4: DOM mutations = a) DOM events & callbacks then b) `slotchange`

In the world of established web development, all DOM mutations that do not require CSSOM or LayCSSOM
data can in principle be called at the same time. The business logic of the app might require
one DOM event to be processed before another, or callbacks to be handled in a certain order, but
there is no difference between DOM mutations in regards to DOM folding other than that.
But. I am here to tell you that this is no longer true.

With the advent of web components, a new DOM event `slotchange` emerged. This DOM event is triggered
when a DOM mutation causes one or more elements to be slotted into another element. 
Currently, this DOM event is processed at the same time as all the other DOM Events and callbacks, 
ie. synchronously in JS.
But, when an operation performs many different DOM mutations that in turn causes many elements 
to for example be added into the DOM in quick succession (which actually happens every time you create
a DOM branch with web components that chain their `<slot>` elements (see the chapters on `slotCallback`), 
then several unnecessary `slotchange` events and processes will be triggered that from the perspective 
of the developer should *not* happen as the DOM mutations required when adding a bunch of DOM events
prescribed in a single HTML template are considered synchronous in the predicative sense of HTML, and 
not an imperative sense of JS.
To fully understand why and how `slotchange` operations should be considered "a secondary
step" of DOM mutations, and how DOM mutations involving `slotchange` triggered DOM mutations can 
be split up into two different steps, see the chapters on `slotCallback`. 

The initial stage of DOM folding should therefore be split i two: 

1. **DOM NODE BUNCH** is defining the DOM as a bunch of DOM nodes. Most JS driven DOM mutation 
   fits within this step:
   1. creating/deleting DOM nodes and adding/removing them to/from the bunch,
   2. altering HTML attributes,
   3. altering the text content of DOM nodes.
    * adding, moving and removing DOM nodes in the DOM is *not* part of this stage, 
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
   
2. **DOM NODE TREE** is the second stage of DOM mutations. All the DOM NODES in the bunch is neatly
   ordered into a tree structure. This is the process of considering the order and hierarchy of the
   DOM nodes. While the DOM NODE BUNCH perspective somewhat fits with our JS perspective on DOM mutations,
   the DOM NODE TREE stage is very familiar to us as it reflects our HTML view of the *result* of DOM
   mutations. To make HTML template *feels* very much like only specifying the organisation of DOM nodes, 
   although from an imperative viewpoint it presupposes that the elements positioned are also first 
   created.
   
   In JS, the act of adding, moving and removing elements into positions as a child of another element
   is part of this stage. However, purely positioning elements in the DOM is unproblematic, and can 
   therefore be implemented together with the DOM NODE BUNCH step.
   However, the `slotchange` event (plus some childlist MutationObserver callbacks) are JS operations 
   that conceptually require the DOM NODE TREE to be completed before execution.
   
   In all likelihood, not splitting these two stages only causes confussion and bugs in the code at
   design time. Most of these bugs can also be fixed by adding checks that ensures that a DOM NODE TREE
   mutation only causes reactions in certain situations. However, left unfixed, the problem will 
   continue to reappear, and applying the `slotchangeCallback(...)` will fix it.
   
Conceptually, DOM folding is therefore a process of four steps:
**DOM NODEs -> DOM TREE -> CSSOM -> LayCSSOM**.

## #5: Cascading DOM folding reactions

The final addition to the DOM folding process is that DOM folding process should be considered
recursive and nested. Let me explain:

Imagine that your application has been running for a little while. The user does something that
triggers a DOM event that in turn causes a DOM NODE mutation of an HTML attribute on an element. 
This is the *first* DOM NODE mutation, we change an attribute.

The attribute we changed is an observed attribute that causes a web component to add a new branch of
elements to its shadowDOM.
Adding this branch of DOM TREE with a series of DOM NODES is a set of several *secondary* DOM TREE 
mutations. The DOM TREE mutation is "higher order" than the DOM NODE mutations, and therefore likely
contains many individual DOM NODE mutations.
But to keep the nested structure simple, we can say that the *first* DOM NODE mutation triggered
a *second* and *third* DOM NODE mutation and a *forth* DOM TREE mutation.

For the sake of simplicity, we say that these DOM NODE mutations triggered no imperative JS reaction
via for example `slotchange` or `attributeChangedCallback(...)`. As the browser completed the
*second* and *third* DOM NODE mutation, and then concluded the *forth* DOM TREE mutation, that then
concluded the *first* DOM NODE mutation leaving the DOM (as DOM NODES and DOM TREE) correctly folded
and processed up to this point. The browser can move on and calculate the CSSOM.

The mutations of the DOM NODES and DOM TREE caused several mutations in the updated CSSOM.
We can call them *fifth*, *sixth* and *seventh* CSSOM mutation. The last two mutations creates no 
JS reaction, but the *fifth* CSSOM mutation triggers a `styleCallback(...)`. The `styleCallback(...)`
uses the new style value to alter the composition of its shadowDOM, thus spawning yet an *eighth* 
DOM NODE mutation, a *ninth* DOM TREE mutation, and a *tenth* CSSOM mutation on descendant elements.
Again, to keep things simple, these three mutations does not cause any additional JS reactions, 
thus enabling the browser to again move on and pass its calculated and correctly folded CSSOM into the 
layout process.

Again, the newly calculated LayCSSOM contains an *eleventh* and *twelfth* LayCSSOM mutation. 
The *twelfth* LayCSSOM mutation causes no JS reaction, but the *eleventh* LayCSSOM mutation alters
the width of an element whose size is observed via `ResizeObserver` or some other kind of layout
observing callback. This layout observer again causes a *thirteenth* and *fourteenth* DOM NODE 
mutation. These DOM NODE mutations in turn causes a *fiftennth* mutation in the next updated CSSOM 
which in turn causes the browser to calculate yet another LayCSSOM object which contain a *sixteenth* 
LayCSSOM mutation. Luckily, none of these DOM NODE, CSSOM, or LayCSSOM mutations trigger 
any further JS reactions which in turn leaves the browser with a completed LayCSSOM object that 
it can pass to its paint process to make an updated screen image.

To summarize. We can view DOM folding as a process of completing a change to either a DOM NODE, a 
DOM TREE, the CSSOM, or the LayCSSOM. However, the process of completing a change *can* spawn
several other DOM folding processes. This can happen as a consequence of a JS callback method 
triggered by an observation of a DOM NODE, DOM TREE, CSSOM, or LayCSSOM property, or this can occur
as a consequence of the three process that is completed at least once per animation frame:

1. DOM NODE to DOM TREE (`slotchange` driven) 
2. DOM TREE to CSSOM (style calculation)
3. CSSOM to LayCSSOM (layout calculation)

When DOM folding processes 'unfold', they form a hierarchy. 

1. the DOM NODE and DOM TREE processes run. Here all the DOM NODE operations run and all the
   reactions to individual DOM NODE operations such as `attributeChangedCallback(...)` run
   synchronously in JS. 
   
2. Then the reactions to DOM TREE mutations run. These operations might trigger DOM NODE mutation
   and DOM NODE reactions, and these will be completed first before any other queued DOM NODE mutation
   can run. In essense, a DOM TREE operation will finish all pending DOM NODE operations before it
   passes its control to the next DOM TREE operation.
   
3. Then, when the DOM TREE is still and ready, the CSSOM is calculated. Any CSSOM reactions will here
   be queued and all DOM NODE and DOM NODE mutations and reactions it causes will be performed according
   to the same order described in point 1. and 2. above. Only after all the DOM NODE and DOM TREE 
   processes has been concluded, will the next CSSOM reaction be processed.
   
4. Finally, once the CSSOM is still and completely unfolded, then the LayCSSOM is calculated.
   If and when LayCSSOM properties trigger a new reaction that mutates either a DOM NODE, the DOM TREE 
   or the CSSOM, the steps 1, 2 and 3 will be repeated and resolved before moving on. 
   
## #6: Requirement to control cascading DOM folding processes

There are several criteria that can and should be used to control the complexity of DOM folding.
First, layout reactions should be kept at a minimum. And with extreme care. Whenever layout changes 
either the style applied to an element, the developer must make sure that this will not trigger a loop.
Use `display: block` on web components who observe their layout and only use the observed value to 
alter the shadowDOM and the style of elements within the shadowDOM. This reduces the risk of infinite 
loops.

The same applies to `styleCallback(...)`

## Two strategies to manage cascading, nested DOM folding processes

As a premise for this discussion, we will assume that no all JS reactions only causes LayCSSOM mutations 
on descendant elements. JS reactions to CSSOM and JS reactions to LayCSSOM should always only mutate 
CSSOM and LayCSSOM properties on elements they contain, no one else.

When this premise is fulfilled, there are two strategies the DOM folding process can follow:

1. split the actions in four different layers (DOM NODES, DOM TREE, CSSOM, LayCSSOM).
   then complete each layer in tree order before stepping into the next layer.
   
2. process all four processes (in reality the three last steps DOM TREE, CSSOM, LayCSSOM) 
   for each element in tree order. 
   
The second strategy is more accurate, and if such a system were built bottom up, this strategy 
would probably be preferred. But. The web platform has already optimized their operation as to work
best if done as separate layers. Little support exists for calculating *only* smaller segments of the
CSSOM nor the LayCSSOM at a time.

That is why the first strategy is used.

There are limitations to how many times it can be feasible to calculate CSSOM and LayCSSOM per animation 
frame. Even thought the CSSOM calculations and LayCSSOM calculations are reused when the final screen 
image is painted, LayCSSOM should be calculated at max twice per frame and CSSOM reactions processed at max
two times per frame (yielding potentially three CSSOM calculations). This effect is achieved if LayCSSOM
reactions are processed only once per animation frame.

Layout reactions and styleCallback(...) comes with great power and complexity. If you make absolutely
sure that:

1. neither layout reactions nor styleCallback(...) alters nothing more than their descendant elements and 
   never the input values for their own JS reaction, and

2. that your layout reactions does not require that they cascade within the same frame, but that if 
   changes of one layout triggers layout changes of a contained element, that the apps behavior can 
   tolerate that such cascading effects occur across different animation frames,
   
then you should be fine. Use JS-based layout reactions and styleCallback(...) sparsely and constrained 
to not affect the host element and only affect the shadowDOM element makeup.



## References

 * Layout thrashing