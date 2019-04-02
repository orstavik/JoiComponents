## Problem: the SlotMatroska

As we saw in the previous chapter, the `<slot>` elements remain in the flattened DOM.
When a `<slot>` element gets chained to one or more other `<slot>` elements that in turn gets chained
to other `<slot>` elements, then the text nodes or other HTML elements that gets transposed into
the shadowDOM will be *wrapped* inside several `<slot>` elements. As we saw in the previous chapter,
it looks like this:

```html
<slot id="inner">
  <slot id="outer">
    Picture this!
  </slot>
</slot>
```

Such a layer-cake of `<slot>` elements I call a **SlotMatroska**.
And as you use more and more web components, the flattened DOM gets filled with such SlotMatroskas. 
But. Is this a problem?

 * Are not SlotMatroskas an irrelevant technical detail concerning the inner workings of the 
   flattened DOM that web developers do not need to consider?

 * Are not the SlotMatroskas purely for decoration in dev tools? Can we not assume that
   the `<slot>` matroska elements do not have any effect on the final view or behavior?

 * Are not SlotMatroskas a necessary evil? Must not the browser implement them to get 
   the shadowDOM working?

The answer is no. No, SlotMatroskas are relevant. No, they cause real confusion and bugs. 
No, SlotMatroskas are unnecessary; the shadowDOM could be flattened by other principles. 
Furthermore, SlotMatroskas are evil: even after you learn how they work, they will remain unfamiliar.

In this chapter I will therefore do a full frontal assault on the SlotMatroska. 
I expose its dirty tricks in simple forms, so that you know what to look out for on the battlefield. 
The plan is "know thy enemy".

## SlotMatroska problems

There are five categories of SlotMatroska dirty tricks:

1. **Style creep**. As all the `<slot>` elements remain in the flattened DOM, styles can creep 
   onto and infect the innermost transposed nodes in ways that are very hard to predict and control.

2. **Fallback nodes fallout**. In a SlotMatroska fallback nodes *only* work on the top most `<slot>`,
   not lower level `<slot>`s. Thus, if a `<slot>` element is placed as a child of another web 
   component, ie. a mid-level chained slot, then the fallback nodes of the low level `<slot>` element
   is permanently lost.

3. **Flatten true is false**. `.assignedNodes()` provide a setting `{flatten: true}`. You might assume 
   that "flatten" here is related to the flattened DOM. But the opposite is true. 
   Yes, `.assignedNodes({flatten: true})` *do* unwrap and replace any slots (except a top level 
   `<slot>` element), but no, as we have described before, this is *not* the state of the flattened DOM. 
   Yes, `.assignedNodes({flatten: true})` can be useful, but no, it can also fool you and make you 
   forget that `<slot>` elements are *not* removed in the flattened DOM.
      
4. **SlotchangeNipSlips**. SlotMatroskas cause `slotchange` events to go awry. The `.shadowRoot` 
   of web components using other web components can receive `slotchange` events that has nothing to 
   do with them. In a web component with a SlotMatroska you must therefore always verify which 
   `<slot>` is element is your relevant origin for your `slotchange` event.

5. **Never gonna get it**. SlotMatroskas are linguistically unfamiliar. At its core, the HTML `<slot>` 
   element is a variable: a placeholder that can be filled with different content depending on context. 
   But. The `<slot>` variable is resolved differently than similar variables in other programming 
   languages: `<slot>` variables are *preserved* as SlotMatroskas, they are not recursively *replaced* 
   as normal variables are. Furthermore, this concept of "variables being replaced" is not a free 
   choice programming languages can opt in or out of. Normal variable resolution is sedimented in 
   our natural languages; it is deeply ingrained in our our way of thinking, either by birth or by 
   breeding. This means that your human instincts and the flattened DOM will be at odds, even after you
   learn that `<slot>` elements are *not replaced, but wrapped inside each other* in the flattened DOM.

## SlotMatroska Solutions

SlotMatroska NipSlips cannot be fixed without completely ripping the guts out of the `<slot>` 
element behavior. And, this is practically impossible. 

Thus, the best way to fix the SlotMatroska problems is to add a new native element alongside the `<slot>` element: 
a *true, normal* HTML variable. 
I therefore propose a new HTML element, an "Internet VARiable" called `<IVAR>` (since `<var>` is 
already taken, unfortunately).

In addition, two `slotCallback(slotName, oldValue, newValue)` mixins are presented. 
These callback fixes the SlotchangeNipSlip problems. 

## References

 * 