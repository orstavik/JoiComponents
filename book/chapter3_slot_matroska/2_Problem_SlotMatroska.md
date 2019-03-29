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

## SlotMatroska problems

When web components reuse other web components and chain their slots, the flattened DOM gets filled
with SlotMatroskas. The SlotMatroskas might look innocent and irrelevant: are not SlotMatroskas an
irrelevant technical detail concerning the inner workings of the flattened DOM that we do not need to
consider?; are not the SlotMatroskas purely for decoration in dev tools, the `<slot>` elements do 
affect the final view in any other way?; and in any case, are not SlotMatroskas a necessary evil, 
something the browsers *must* do in order to get shadowDOM to work?

The answer is... no. SlotMatroskas are both relevant, a real source of confusion and bugs, unnecessary
and persistently unfamiliar, even when you get to know it. SlotMatroskas as evil. And you should "know 
thy enemy". In this chapter I therefore make a full frontal assault on the evil SlotMatroska. 
I will show its tricks in a simple form, so you know what to look out for on the battlefield.

The first issue with SlotMatroskas is that they are unfamiliar to us linguistically. HTML `<slot>`s
is a placeholder, a variable that allows us to compose with HTML as a more powerful declarative 
programming language. But. By resolving itself as a SlotMatroska, the `<slot>` variable behaves 
differently than similar variables that it can be compared to in both programming and natural languages.
These linguistic structures are so closely related to our ways of thinking, so naturalized for us, 
that you safely can assume that you will never fully naturalize and get comfortable with the logic of
SlotMatroskas.

The second issue with SlotMatroskas is style creep. As all the `<slot>` elements remain in the 
flattened DOM, styles can creep onto and infect the innermost transposed nodes in ways that are
very hard to predict and control.

The third issue with SlotMatroskas is fallback nodes. As the `<slot>` elements do not "replace"
themselves with their assigned nodes, fallback nodes are only *half* work for chained slots:
if a `<slot>` element is placed as a child of a web component with a shadowDOM, then that `<slot>` 
element *cannot* use fallback nodes.

The forth issue with SlotMatroskas is `.assignedNodes()`. As fallback nodes do not fully work
in a SlotMatroska, it looks like the browser developers behind `.assignedNodes()` got confused 
themselves. In the algortihm a patch was added to include `<slot>` element fallback nodes on
the top level lightDOM, but this patch was not included in the middle level of SlotMatroskas.
Assigned nodes thus reflect the exact same problem as fallback nodes.
To add to the confusion, `.assignedNodes({flatten: true})` does not represent the flattened DOM,
but is essentially a `.childNodes` were all the `<slot>` elements are replaced by their children, 
recursively. And althought it would be natural to assume that this type of "flattening" was the same
type of "flattening" done in the browser, the "flatten" in assignedNodes and the "flatten" in the 
flattened DOM are completely the opposite.

The fifth issue with SlotMatroskas is `slotchange` events gone awry. This means that web components 
using other web components cannot assume that `slotchange` events that occur in their shadowDOM
has to do with one of their `<slot>` elements. In a SlotMatroska you are best served verifying all 
`slotchange` events.

## Old drafts

There are several *key* issues that needs to be addressed here:

1. The `<slot id="innerSlot">` is **not replaced(!)** by the last slotable nodes directly.
   If it were, the result would indeed be truly flat:
```html
<img src="picThis.jpg" ...>
```

2. The `<slot id="innerSlot">` is not filled with **only the last slotable** nodes neither.
   **All** the in-between, mediating `<slot>`s are included in the final result, 
   wrapping the final flattened slotted nodes in a **`<slot>` matroska**.

3. The order of the `<slot>`s in the `<slot>` matroska is **inside-out**.
   In the flattened DOM, `<slot>`s in the flattened chain appears in the reverse order in 
   which the documents that they belong to appear. 

It is *easy* to get confused working with such a structure. And in the next chapters we will discuss in
detail:
 * Why the `<slot>` structure will confuse you. 
 * How a **`<slot>` matroska** can confuse you.
 * Tips to help you remember the `<slot>` principles. 
 * Guidelines to avoid `<slot>` confusion.

## Discussion 
This is not a simple topic. Don't be sad or frustrated if you don't understand it fully yet.
Think of it as a sign of mental health and a proof of your own humanity.
Also, take solace in that when I first heard about such *linking slots*, 
I too found it unnatural and unappealing.
I also considered it a strange edge-case and fairly irrelevant. 

But. The good news is that it is actually much easier to get accustomed to linking slots than
might first appear.
*Linking slots* is neither particularly difficult nor strange.
It resembles many other forms of linking familiar to JS programmers and HTML developers, and 
can fall quite quickly into place.
Second, it is a much more useful than might first be considered.
In fact, once familiar with the concept, any web component made to be reused in different contexts
both benefit greatly and need to take slot chains into account.

In my own view, it is not the perfect structure for what we can call nested HTML composition.
But, it is manageable, with careful study, the help of some tools and watching your steps.

## to max: labels for sketch

* GreenFrame uses another web component PassePartout in its shadowDOM.
GreenFrame then place its `<slot id="outerSlot">` as a child of the PAssePArtout host node.
When `<slot id="outerSlot">` is placed as a slotable of PAssePArtout, 
the relationship between `<slot id="outerSlot">` and the `<passe-partout>` host node
form a **slot link**.

* The `<slot id="outerSlot">`, `<slot id="outerSlot">` and `<img src="picThis.jpg" ...>` make 
up a **slot chain**.

## References
 

 