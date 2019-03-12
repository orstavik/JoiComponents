# HowTo: TraverseCssom

There are several problems with the *naive* `styleCallback(...)` and how it traverses the CSSOM.
In order to make a `styleCallback(..)` that can react to changes in the CSSOM, we first need to 
solve these problems.

## Problem 1: CyclicalCssomMutations

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

All these problems above has to do with CyclicalCssomMutations, and .
CyclicalCssomMutations is both a practical and conceptual issue. 

Already in the platform, we can have cross domain cycles / loops between HTML and JS. 
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

## Problem 2: The cost of `getComputedStyle(..)`

Another source of `styleCallback(...)` problems has to do with the cost of `getComputedStyle(..)`.
Computing the CSSOM is a real performance killer. That is why the browser only does so once per frame,
right before layout and paint. The cost of CSSOM calculation is not two digits in milliseconds, 
its two digits in percentage points of the available time per frame. 

Implementing `styleCallback(...)`, we plan to call `getComputedStyle(..)` several times per frame, 
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
reuse these answers when `getComputedStyle(..)` asks for them and when the browser needs to paint 
the window.

The assumption is as follows(todo this needs verifictation). 

First. When the browser calculates the CSSOM, it marks all the elements in the DOM with a "clean" 
flag. As long as this "clean" flag is present on a DOM element, the browser can reuse the previously
calculated, cached CSSOM value for it. When no changes occur to the DOM that could affect the CSSOM,
the browser will not calculate CSSOM, but only reuse cached CSSOM.

Second. When the browser mutates the DOM, it alters the flag on the element and all the element whose
CSSOM value might be affected by this change from "clean" to "dirty". The rules of which DOM changes 
causes which DOM element to change from "clean" to "dirty" is not necessarily straight forward, but a 
coarse overview can be given:

1. If the user alters the content of a `<style>` element, or adds or remove a `<link rel="style">` or
   directly alters the `document.styles...` or `ownerDocument.styles...`, then that document root and
   thus its entire content is marked as "dirty".
   
2. If the user alters the `style` attribute or any other attribute on an element, that causes that 
   element and all other contained elements both in the lightDOM and shadowDOM of it to be marked "dirty".
   The same applies with any changes of HTML attributes and CSS classes  on an element as that can 
   (de)activate different CSS rules to that element, and thus alter the styles of all its contained 
   elements.

3. If an element is added, removed or moved in the DOM, this will cause BOTH:
   1. the element that is moved,
   2. the sibling elements *from* where the element is removed, and
   3. the sibling elements *to* where the element is added 
   
   to *all* be marked "dirty".
   
   The reason the siblings are affected, but not the parent, is that the `:nth-child()` and 
   `:nth-last-child()` on the parent element can affect the siblings styles. 
   No CSS selector can alter the CSS properties on a parent based on its children.

This means that:

1. when a JS function early in the frame triggers the browser to calculate CSSOM via 
   `getComputedStyle(..)`, then if no DOM alterations are made to flip flags on the DOM element
   from "dirty" to "clean", then when the browser later needs to calculate the CSSOM values of a 
   "clean" element, then it can reuse the result from the previous `getComputedStyle(..)`. 
   Thus, yes, the CSSOM calculation can be pushed ahead in time so that the `styleCallback(..)` 
   can use the single CSSOM calculation quite extensively.
   
2. If the `styleCallback(..)` alters the DOM in such a way that it flips as few as possible of 
   the "clean" flags to "dirty", then several `getComputedStyle(..)` can use the output from the 
   same CSSOM calculation. This means that by:
   1. controlling the order in which the `styleCallback(..)`s are triggered to comply with the 
      structure and intent of CSS cascading (ie. Tree-order, top-down), and
   2. limiting the scope of the reactions and DOM mutations that the `styleCallback(...)` can/should 
      be allowed to do so as to not trigger any more "clean" to "dirty" flag switches,
      
   many `styleCallback(..)` can use the result from the same `getComputedStyle(..)` process.

## Requirement #1: shadow state only

Both a) CyclicalCssomMutations, b) the rise of complexity due to branching CSSOM reactions, and 
c) minimizing the number of elements flipped from "clean" to "dirty" per CSSOM calculation,
can all be addressed with *one* requirement:

 * functionality in the `styleCallback(..)` should *only* alter internal state of the 
   web component, state that *cannot* be observed from the lightDOM. 
   
   This means that the `styleCallback(..)` *can*:
   1. change the element's entire shadowDOM, 
      except to alter any `:host()` rule that alters an `observedStyle` on the host element.
   2. change other internal state properties that cannot be observed from the lightDOM and above,
   
   and *cannot*:
   1. trigger any events that propagate on the host element or above in the lightDOM,
   2. alter, add or remove any HTML attributes on the host element because that might be observed 
      in the lightDOM,
   3. alter any global state such for example an apps single state, the `localStorage` or an external
      network resources, nor
   4. call any async functions that would be delayed beyond the execution of the current 
      `styleCallback(..)`.

## Requirement #2: `styleCallback(..)` runs TreeOrder

Both a) requirement #1: shadow state only, b) the need to flip as few "clean" to 
"dirty" flags as possible and c) to avoid having one `styleCallback(..)` alter the CSSOM values
of another `styleCallback(..)` function already triggered in the same cycle, forces requirement #2 
on us:

 * `styleCallback(..)` functions are triggered top-down.
 
Whether the CSSOM is processed left-to-right (ltr) or right-to-left (rtl) has no principal consequence: 
CSS selectors work both ltr (`:nth-child()`) and rtl (`:nth-last-child()`).
However, batch processing must choose one horizontal direction, and 
TreeOrder (top-down+ltr) is simpler both conceptually and practically.

## Requirement #3: contained elements added during the same cycle are processed in the same cycle

`styleCallback(..)` can alter the shadowDOM. That means that `styleCallback(..)` function often 
will connect new elements to the DOM, elements that has their own `styleCallback(..)`. 
When such an element is connected, it would be strange and unnecessary if such "adding of an inner 
child" either caused an Error or was delayed until the next animation frame. Thus:

 * Whenever elements with `styleCallback(..)` are added to the DOM beneath the element whose 
   `styleCallback(..)` is currently being executed, their `styleCallback(..)` should also be 
   executed in the same cycle if their observed CSS property has changed.

## Requirement #4: check requirement #1, #2 and #3

The `styleCallback(..)` should try to enforce and check the above requirements. 
There are many strategies that can verify that the above requirements.
The simplest, good-enough strategy is to ensure that no `styleCallback(..)` alters the CSSOM in a way 
that would alter the CSSOM of another `styleCallback(..)` already processed in the same cycle.
In practice, this means to directly check that after each and every `styleCallback(..)` reaction, 
all the observed CSS properties of all the previously processed elements remain *un*altered.

There are two main strategies that can be employed here. 
CyclicalCssomMutations can be checked after: 
1. each `styleCallback(..)` (Constant checking for CyclicalCssomMutations)
2. all `styleCallback(..)` (Batched checking for CyclicalCssomMutations)
 
Batched checking is more efficient than constant checking. 
But, constant checking can identify exactly which `styleCallback(..)` on which element 
caused the problem, providing the developer with a much better, fine-grained Error message. 

Furthermore, both batched and constant checking is only likely needed during development, not 
in production. If the developer can verify that the app triggers no illegal DOM mutations during development, 
both constant and batched checking could be turned off in production. 
For best performance and developer ergonomics it is therefore best to *constantly* check for 
CyclicalCssomMutations when needed, and to turn all such checks off in production.

## References

 * 
