# Problem: premature `attributeChangedCallback`

> TLDR: `attributeChangedCallback()` are automatically called by the browser when
> 1. `.cloneNode`
> 2. `.innerHTML`
> 3. main document parser.

## Problem: Chaotic upbringing

The rearing of a custom element is a bumpy ride. 
Here is a short clear story to describe just how patchy and rocky the road to a new custom element can be:

When you create a custom element, the browser will always trigger the `constructor()`.
But, there are many ways to create a new custom element: 
the `constructor()`, `document.createElement()`, `cloneNode()` and the HTML parser via the main document or `innerHTML`.

Sometimes, for example via `constructor()` or `document.createElement()`, *only* the `constructor()` is called.
But, if the element is created via `.cloneNode()` or from HTML template 
(via the main document parser or `.innerHTML`), 
then the newly minted element might also include HTML attributes.
If these are also `observedAttributes`, 
then `cloneNode()` or the HTML parser will also trigger one or more `attributeChangedCallback()`.
But, if there are *no* attributes or the attributes added are *not observed*, 
then *no* `attributeChangedCallback()` will be called.
And this depends on the context of use of the element, so the author of the custom element definition
is not guaranteed any `attributeChangedCallback()`.

Furthermore, elements created by the HTML parser can also be created directly in the DOM.
This can only happen via the parser of the main HTML document or `.innerHTML`.
And only if the parent element is connected to the DOM.
Which is all the HTML elements in the main document except children element of `<template>`, and
every time `.innerHTML` is invoked on an element connected to the DOM.

The important aspect to take note of is that from the perspective of the custom element
you are never really sure of what you will get growing up.
You might only get a `constructor()` callback. 
You might get one or more `attributeChangedCallback()`s as well.
And you might get a `connectedCallback()` as well.
From where you stand, you don't know. 
Below is a schema that summarize all these different scenarios of custom element upbringings.

## Problem: Premature `attributeChangedCallback`

As described earlier, HTML attributes serves the purpose of describing the state of an HTML element.
However. There is a conceptual problem here. 
The `attributeChangedCallback` is triggered every time an attribute is changed. 
This is very useful during the life of a custom element.
For example, changing the value of an attribute can change the color of a button or add a number to a list.
But, if the element has not yet been setup, then there might be no button to color or list to add numbers to.
At the same time, as a developer of a custom element you cannot rely on the `attributeChangedCallback`
to trigger you custom element setup, because a) it is often not triggered (no attributes)
or b) you do not want to run your setup immediately because you want to delay setting up that element.
The `attributeChangedCallback` that are triggered immediately when the element is created by
a) cloneNode, b) parser of main document and c) parser from innerHTML are *premature*.

## Pattern: How to handle premature `attributeChangedCallback`

You do not have the default, start state of the custom element ready, and 
so you are not ready to handle the "change of state" that an `attributeChangedCallback` conceptually assume.
`attributeChangedCallback` that come prematurely *before* the element is setup should be aborted.

But, at the same time, if you just skip the premature `attributeChangedCallback`, 
then those changes will not be registered after the element has setup/*matured*.
Even though the element was given state descriptors before it was ready to handle them,
it should still handle them asap once it has matured / setup.

This would require the developer of the custom element either to:
1. handle already set attributes in both the setup step and the regular `attributeChangedCallback` 
that might be triggered on an element while it exists,
or
2. somehow trigger the `attributeChangedCallback` that are paused for later again 
after the element has matured/setup.

The first alternative is bad, as it creates redundant code. 
It is likely the developer will overlook or confuse updates of an attribute if its done in two places.
Re-triggering the `attributeChangedCallback` after the element has matured/setup is therefore the best alternative.

This re-triggering the `attributeChangedCallback` has also two alternative approaches.
Either a not-so-simple que for premature `attributeChangedCallback` calls can be setup and 
then flushed once the element is ready.
Or, simpler, all premature `attributeChangedCallback` can be skipped,
and then the element just checks its observed attributes immediately after setup and calls
`attributeChangedCallback` for any `observedAttribute` with a value.

## Solution: skip and re-trigger premature `attributeChangedCallback`

The solution requires the following test in any `attributeChangedCallback`.
This check must be placed directly in the custom element itself as it must be able to abort the call.
If there is no `attributeChangedCallback`, then there is no need to implement this check.
 
```
attributeChangedCallback(name, oldValue, newValue){
  if (!this.isSetup) return;
  //do your thing here
}
```
Re-triggering of `attributeChangedCallback` is done by:
1. iterating the `observedAttributes`,
2. checking if they are set,
3. and then calling `attributeChangedCallback` for all set values.

```
for (let att of el.constructor.observedAttributes) {
  if (el.hasAttribute(att))
    el.attributeChangedCallback(att, null, el.getAttribute(att));
}
```


But, if that element has not been setup yet, ie. its shadowDOM not populated, its default state not set,
externally controlled state parameters are not 
As described in [Pattern: Delayed setup](Pattern2_delay_setup.md), sometimes you want to delay
the setup of a custom element.
In such instances you do not want attributeC 

## References
 * todo
