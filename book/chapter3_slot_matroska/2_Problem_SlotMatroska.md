## Problem: the SlotMatroska

As we saw in the previous chapter, the `<slot>` elements remain in the flattened DOM.
When a `<slot>` element gets chained to one or more other `<slot>` elements that in turn gets chained
to other `<slot>` elements, then the text nodes or other HTML elements that gets transposed into
the shadowDOM will be *wrapped* inside several `<slot>` elements. As we saw in the previous chapter,
it can look like this:

```html
<slot id="inner">
  <slot id="outer">
    Picture this!
  </slot>
</slot>
```

Such a layer-cake of `<slot>` elements we call a **SlotMatroska**.
And as you use more and more web components, the flattened DOM gets filled with such SlotMatroskas. 
But. Is that a problem?

 * Are not SlotMatroskas an irrelevant technical detail concerning the inner workings of the 
   flattened DOM that web developers do not need to consider?

 * Are not the SlotMatroskas purely for decoration in dev tools? Can we not assume that
   the `<slot>` matroska elements do not have any effect on the final view or behavior?

 * Are not SlotMatroskas a necessary evil? Must not the browser implement them to get 
   the shadowDOM working?

The answer is no. No, no, no. SlotMatroskas are relevant: they cause real confusion and bugs.
SlotMatroskas are also unnecessary, and they will remain unfamiliar, even after you learn it. 
SlotMatroskas are evil. In this chapter I will therefore do a full frontal assault on the evil 
SlotMatroska. I expose its dirty tricks in simple forms, so that you know what to look out for 
on the battlefield. The plan is "know thy enemy".

## SlotMatroska NipSlips

The dirty tricks of the SlotMatroska we call SlotMatroskaNipSlips. And they can be grouped into
five categories:

1. **Style creep**. As all the `<slot>` elements remain in the flattened DOM, styles can creep 
   onto and infect the innermost transposed nodes in ways that are very hard to predict and control.

2. **Fallback nodes fallout**. In a SlotMatroska fallback nodes *only* work on the top and bottom 
   layer, not in the middle(!). Thus, if a `<slot>` element is placed as a child of another web 
   component, ie. a mid-level chained slot, then that mid-level `<slot>` element *cannot* use 
   fallback nodes.

3. **Flatten true is false**. `.assignedNodes()` provide a setting `{flatten: true}`. You might assume 
   that "flatten" here is related to the flattened DOM. But the opposite is true. 
   Yes, `.assignedNodes({flatten: true})` *do* unwrap and replace any slots (except a top level 
   `<slot>` element), but as we have described before, this is *not* the state of the flattened DOM. 
   Yes, `.assignedNodes({flatten: true})` can be useful, but it is also trying to trick you into
   forgetting that `<slot>` elements are *not* removed in the flattened DOM, but remain as 
   SlotMatroskas.
   
   The behavior of `.assignedNodes()` is very tightly linked to the behavior 
   of slot fallback nodes. And as mid-level fallback nodes do not appear in a SlotMatroska, 
   neither do they in `.assignedNodes()`. 
      
4. **SlotchangeNipSlip**. SlotMatroskas can cause `slotchange` events to go awry. The `.shadowRoot` 
   of web components using other web components can receive `slotchange` events that has nothing to 
   do with them. In a web component with a SlotMatroska you must therefore always verify which 
   `<slot>` is element is your relevant origin for your `slotchange` event.

5. **Never gonna get it**. SlotMatroskas are linguistically unfamiliar. At its core, the HTML `<slot>` 
   element is a variable: a placeholder that can be filled with different content depending on context. 
   But. The `<slot>` variable is *resolved* differently than similar variables in other programming 
   languages: `<slot>` variables *become* a SlotMatroskas, they are not recursively *replaced* like 
   normal variables. Furthermore, this concept of "variables being replaced" is not a free choice 
   programming languages can choose to opt in or out of. Normal variable resolution is sedimented in 
   our natural languages; it is so ingrained in our our way of thinking, either by birth or by 
   breeding, that you can safely assume that you instinctively for a looooong time will erroneously 
   think of `<slot>` elements as being *replaced, and not filled* in the flattened DOM.
   SlotMatroska variables are extremely *counter-intuitive* to naturalize, and you should not set up
   your code, methods, or practices on the premise that they will be.

## SlotMatroska Solutions

SlotMatroska NipSlips cannot be fixed without completely ripping the guts out of the `<slot>` 
element behavior. And, this is practically impossible. Thus, the best way to fix the SlotMatroska 
NipSlips is to add a new native element alongside the `<slot>` element: a *true, normal* HTML variable. 
I therefore propose a new HTML element, an "Internet VARiable" called `<i-var>` (since `<var>` is 
already taken, unfortunately).

Second, two `slotCallback(slotName, oldValue, newValue)` mixins are created. This callback fixes the 
problem with `slotchange` events gone awry, and also problems related to DOM folding reactions, 
which I will return to later.

## References

 * 


## old drafts

* GreenFrame uses another web component PassePartout in its shadowDOM.
GreenFrame then place its `<slot id="outerSlot">` as a child of the PAssePArtout host node.
When `<slot id="outerSlot">` is placed as a slotable of PAssePArtout, 
the relationship between `<slot id="outerSlot">` and the `<passe-partout>` host node
form a **slot link**.

* The `<slot id="outerSlot">`, `<slot id="outerSlot">` and `<img src="picThis.jpg" ...>` make 
up a **slot chain**.

