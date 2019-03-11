# HowTo: TraverseCssom

There are several problems with the *naive* `styleCallback(...)` and how it traverses the CSSOM.
In order to make a `styleCallback(..)` that can react to changes in the CSSOM, we first need to 
solve these problems.

## Problem 1: (in)finite loops

 * What if the `styleCallback(...)` alters a `:host()` rule in the shadowDOM that changes 
   the very CSS property it is observing? Could this loop infinitely animation frame after 
   animation frame?
   
 * What if the `styleCallback(...)` causes a side-effect that changes the very CSS property 
   it is observing? What if `styleCallback(...)` (in)directly altered an attribute on the host element that
   was observed from the outside and triggered a function that altered the CSS property?
   What if `styleCallback(...)` (in)directly caused an event to be dispatched which then
   triggered an outside function that altered the CSS property?
   Could this cause infinite loops?
   
 * What if:
   1. CSS property A on element A triggers its `styleCallback(...)` which
   2. alters CSS property B on element B that triggers its `styleCallback(...)` which 
   3. alters CSS property A on element A again that triggers its `styleCallback(...)` which
   4. created an infinite loop that spans the `styleCallback(...)` of several elements?

 * What if the `styleCallback(...)` triggers a side-effect that changes the CSS properties
   that is the premise of another `styleCallback(...)`? Could this cause an infinite loop?
   Should the other `styleCallback(...)` be triggered again during the same cycle/animation 
   frame as consequence of this, when this repeated cascading adjustments constitutes an finite, 
   closed loop?
   
 * What if the `styleCallback(...)` creates or adds several elements *inside or under itself* 
   that que their own `styleCallback(...)` as part of their setup/connection. Do we have to wait 
   until the next animation frame for this to be created, thus creating a flash of unstyled content?

All these problems above has to do with execution order and problems of recursion and imperative loops.
And these problems are not only practical, they are also conceptual. 

Already in the platform, we can have cross domain loops between HTML and JS. 
A JS function can alter the DOM, which in turn can trigger a `MutationObserver` or an 
`attributeChangedCallback(...)` or a `slotchange` event listener, which in turn can alter the same DOM
elements so as to cause an infinite loop. This is a know pitfall to web developers.

However, now, the `styleCallback(...)` suddenly tosses CSS into this mix. Now, the `styleCallback(...)`
can trigger JS, that alter the DOM, that alters the CSSOM and/or a `MutationObserver` , that triggers 
`styleCallback(...)`. And the `MutationObserver` that was triggered at the same time that the CSSOM triggered
a `styleCallback(...)`, that `MutationObserver` altered a CSS property on another element that trigger 
another `styleCallback(...)`. Wow, hold your horses!! A dynamic DOM+JS is one thing, but a dynamic CSSOM
that essentially throws CSS into this dynamic mix with HTML and JS as well, now that is a whole new 
bowl of sauced spaghetti.

## Problem 2: The cost of `getComputedStyles(..)`

Another source of `styleCallback(...)` problems has to do with the cost of `getComputedStyles(..)`.
Computing the CSSOM is a real performance killer. That is why the browser only does so once per frame,
right before layout and paint. The cost of CSSOM calculation is not two digits in milliseconds, 
its two digits in percentage points of the available time per frame. 

Implementing `styleCallback(...)`, we plan to call `getComputedStyles(..)` several times per frame, 
one for each element that implements a `styleCallback(...)`. Potentially hundreds of elements! Wow... 
That sounds... HORRIBLE!!

But. There are some aspects of CSSOM calculation that ought to be considered too.
The browser already *does* **one** CSSOM calculation each frame anyway. 
Is there a way to:
 1. push this CSSOM calculation ahead in time so that the `styleCallback(...)` can (re)use it?
 2. reuse this single CSSOM calculation so that several `styleCallback(...)`s can (re)use the same
    data?

The short answers are: "yes, quite extensively" and "yes, quite extensively". 
These answers build on an assumption about *how* the browser caches its CSSOM calculation so it can
reuse these answers when `getComputedStyles(..)` asks for them and when the browser needs to paint 
the window.

The assumption is as follows(todo this needs verifictation). 

First. When the browser calculates the CSSOM, it marks all the elements in the DOM with a "clean" 
flag. As long as this "clean" flag is present on a DOM element, the browser can reuse the previously
calculated, cached CSSOM value for it. When no changes occur to the DOM that could affect the CSSOM,
the browser will not calculate CSSOM, but only reuse cached CSSOM.

Second. When the browser mutates the DOM, it alters the flag on the element and all the element whose
CSSOM value might affected by this change from "clean" to "dirty". The rules of which DOM changes 
causes which DOM element to change from "clean" to "dirty" is not necessarily straight forward, but a 
coarse overview can be given:

1. If the user alters the content of a `<style>` element, or adds or remove a `<link rel="style">` or
   directly alters the `document.styles...` or `ownerDocument.styles...`, then that document root and
   thus its entire content as "dirty".
   
2. If the user alters the `style` attribute or any other attribute on an element, that causes that 
   element and all other contained elements both in the lightDOM and shadowDOM of it to be marked "dirty".
   CSS selectors for all contained elements. Attributes and CSS classes can trigger CSS rules to be 
   activated within and CSS variables can be added via the style attribute.

3. If an element is added, removed or moved in the DOM, this will cause BOTH:
   1. the element that is moved,
   2. the sibling elements *from* where the element is removed, and
   3. the sibling elements *to* where the element is added 
   
   to all be marked "dirty".
   
   The reason the siblings are affected, but not the parent is that the `:nth-child()` and 
   `:nth-last-child()` on the parent element can affect the siblings style, but no CSS selector can
   alter the CSS properties on a parent based on its children.

This means that:

1. when a JS function early in the frame triggers the browser to calculate CSSOM via 
   `getComputedStyles(..)`, then if no DOM alterations are made to flip flags on the DOM element
   from "dirty" to "clean", then when the browser later needs to calculate the CSSOM values, it can
   reuse the result from the `getComputedStyles(..)`. Thus, yes, the CSSOM calculation can be pushed
   ahead in time so that the `styleCallback(..)` can reuse the single CSSOM calculation quite 
   extensively.
   
2. If the `styleCallback(..)` *do not* alter the DOM in such a way as to flip as few "clean" flag to 
   "dirty" flags as possible, then several `getComputedStyles(..)` can use the result from the same 
   CSSOM calculation. This means that by:
   1. controlling the order in which the `styleCallback(..)`s are triggered to comply with the 
      structure and intent of the CSSOM, ie. Tree-order or top-down, and
   2. limiting the scope of the reactions and DOM mutations that the `styleCallback(...)` can/should 
      be allowed to do so as to not trigger any more "clean" to "dirty" flag switches.

## Requirement #1: shadow state only

Both a) infinite loops, b) the rise of complexity due to branching CSSOM reactions, and 
c) to minimize the number of elements flipping from "clean" to "dirty" for CSSOM calculations,
can all be addressed with the same requirement:

 * functionality in the `styleCallback(..)` should *only* alter the internal state of the web component
   that *cannot* be observed from the lightDOM. 
   This essentially means that the `styleCallback(..)` *can*:
   1. change the element's entire shadowDOM, 
      except to alter any `:host()` rule that alters an `observedStyle` on the host element.
   2. change other internal state properties that cannot be observed from the lightDOM and above.
   
   This also means that the `styleCallback(..)` *cannot*:
   1. trigger any events that propagate on the host element or above in the lightDOM,
   2. alter, add or remove any HTML attributes on the host element because that might be observed 
      in the lightDOM,
   3. alter any global state such for example an apps single state, the `localStorage` or external
      network resources, nor
   4. call any async functions that would be delayed beyond the execution of the current 
      `styleCallback(..)`.

## Requirement #2: `styleCallback(..)` runs top-down

Both a) the first requirement of only altering shadow state, b) the need to flip as few "clean" to 
"dirty" flags as possible and c) to avoid having one `styleCallback(..)` alter the CSSOM values
of another `styleCallback(..)` function already triggered in the same frame, combine to make the 
second requirement:

 * the `styleCallback(..)` functions should be triggered top-down.
 
Whether the CSSOM is processed left-to-right (ltr) or right-to-left (rtl) has no principal and little practical 
consequence. CSS selectors work both ltr (`:nth-child()`) and rtl (`:nth-last-child()`).
However, processing the batch is well suited by choosing one direction, and tree order 
(top-down and left-to-right) is both simpler conceptually and practically.

## Requirement #3: contained elements added during the same cycle are processed in the same cycle

`styleCallback(..)` can alter the shadowDOM. That means that `styleCallback(..)` can not only 
a) alter a CSS property that is observed by `styleCallback(..)`, but also b) connect 
a new element that has its own `styleCallback(..)` to the DOM. When such an element is connected,
it would be strange and unnecessary if this "adding of inner child" either caused an Error or
was delayed until the next animation frame. Thus:

Whenever elements with `styleCallback(..)` are added to the DOM beneath the element whose 
`styleCallback(..)` is currently being executed, they should be run in the same cycle.

## Requirement #4: check requirement #1, #2 and #3

The `styleCallback(..)` should try to enforce and check the above requirements. 
There are many strategies that can verify that the above requirements are verified.
The simplest, good enough means to ensure that no `styleCallback(..)` alters the CSSOM in a way 
that will have potential damaging effects on other `styleCallback(..)` in the same cycle is
to directly check that the computed styles remain the same for all the executed `styleCallback(..)`
either: 
 * after all the `styleCallback(..)`s did run or
 * for each `styleCallback(..)`.
 
Checking for illegal CSSOM changes after *all* the batched `styleCallback(..)`s is more efficient than
checking for illegal CSSOM changes after *each* `styleCallback(..)` process. On the other hand.
Checking for illegal CSSOM changes after *each* `styleCallback(..)` process has the benefit of identifying
exactly which element and `styleCallback(..)` method caused the problem, thus giving the developer
a much better and more fine grained Error message. 

Furthermore, checking for illegal CSSOM changes is not likely be a run-time need. If the developer can
verify that the app triggers no illegal DOM mutations during development, it is likely that he can 
skip this test at run-time and rest assured that he followed the requirements. Checking for illegal
DOM mutations should therefore be an optional feature to be turned on or off, depending on the maturity
of the web components in the app. It is possible to leave these checks in during production, but if 
these checks do not turn up anything during development, it is unlikely that they will produce much of 
value in production.

## Conclusion

A fully functioning `styleCallback(..)` that adhere to the requirements is possible. It is safe
and efficient enough. It will simplify several operations that now add complexity to apps and web 
components, while at the same time add its own practical problems, errors and edge-cases. But, 
`styleCallback(..)` is most relevant in that it adds and reduces the conceptual complexity of web 
components and HTML+CSS+JS programming.

On the side, the `styleCallback(..)` reduces complexity by giving the developer all the tools
needed to make custom CSS property values. The `styleCallback(..)` gives the ability to implement true,
full custom CSS properties (CSS variables only implement custom CSS property *names*, not custom CSS
property *values*). Custom CSS property values is the last missing component 
needed to implement a web component version of native HTML/CSS constructs such as `<table>`. 
Conceptually, this is of great importance.

On the other side, `styleCallback(..)` gives the developer a method to *react to* style changes. 
Now, theoretically, both CSS and CSSOM has always been dynamic. CSS styles can be changed dynamically
as a part of the DOM. But, in practice, since there has been no default way to observe CSSOM changes, 
practically CSSOM observation and reaction has been limited to almost nothing.

My own opinion is that `styleCallback(..)` sheds light on the future of HTML and CSS. With a 
`styleCallback(..)`, `<table>` can finally be implemented using only web components technology.
Many HTML elements that today are 'core' elements can be remade as derivatives of other HTML elements,
custom CSS properties *and* custom CSS values. From my perspective, `styleCallback(..)` is the only
missing piece in that puzzle. And, if then obscure HTML elements can be converted into web components, 
then a) HTML elements, b) custom CSS properties, and c) custom CSS values/types can be moved out of the
HTML and CSS core. For good. This will substantially reduce the semantic diversity of *both* HTML 
and CSS. Furthermore, as developers for the first time will have the full means to implement elements
akin to `<table>`, maybe the dream of wide spread, reusable web components could finally come true. 
I believe that custom CSS property values as an alternative to controlling the style of web components 
using HTML attributes is the last mayor obstacle for the web component dream.

## References

 * 
