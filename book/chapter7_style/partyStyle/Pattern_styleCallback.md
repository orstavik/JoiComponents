# Pattern: styleCallback


## `styleChangedCallback` as an element specific reaction

The `styleChangedCallback` is the implementation of this reaction. 
The `styleChangedCallback` gives this ability to control web components custom reactions to CSS specific 
styles: it gives us the ability to create `<table>` as a web component, with no fuss.

There are so many examples of how to use this. 
You might want to control an element's layout to respond to a horizontal or vertical setup. 
You might want to control new stylistic properties such as adjust depth of scope or shades of grey. 
You want to use it to control which style properties the user of the web component can set,
you want to use it to give the user the ability to control style in a way that would alter the
shadowDOM structure of the element.
You want to use it to simplify the use of the web component so that the user does not have to
set multiple CSS variables with complex intraconnected bindings, but instead set a simple numerical or
enumeric value (ie. choose one string value of a small list of string values) that the web component
in turn translates into a set of CSS properties with complex intraconnected bindings.
In short, the `styleChangedCallback` gives you the power to complete the encapsulation of CSS and HTML.
  
## How `styleCallback("property-name", newValue, oldValue)`?

1. To make a callback when a custom CSS property changes, we need to observe changes in the CSSOM.
   There are no native "CSS has changed for this document or element or window" in the browser.
   We therefore have no better alternative than to
   manually trigger style processing for one or more DOM elements using `getComputedStyle`.
   We can do this once per frame (using `requestAnimationFrame()`) or 
   a debounced `requestAnimationFrame()` (that either runs more rarely, or if inactive waits up to 
   50ms to allow other events to occur).
   Many elements can register themselves to get a `styleCallback(...)` for different CSS properties.
   All these callbacks will be batched and run once per registered element+property pair per frame
   (if the value of the given property for that element has changed).
   
2. Several different elements can register themselves to be callbacked when one or more of their 
   properties change. These elements+property -> callback are registered in a Map.
   the 
   This Map is TreeOrdered, when it loops, and the order of this map 

3. The `styleCallback("property-name", newValue, oldValue)` will be called on registered elements.
   It should be debounced and clustered into a rAF and called only once per frame per element. 
   Custom elements should not change their lightDom as a response to external style changes, but 
   it could and should very likely change the DOM and CSSOM of its shadowDOM.
   The `styleCallback("property-name", newValue, oldValue)` should therefore be called top-down
   in tree order, once per element.
   
   Furthermore, reactions of style changes in a custom element can take elements out of and place new 
   elements into the shadowDOM:
   
   1. If an element is added or removed before the TreeOrderPosition of the current styleCallback cycle, 
      then this should or could throw an Error.
      Mutating the TreeOrderPosition of the elements should only occur after the current point in the
      TreeOrder iteration, ie. inside the custom element's shadowDOM.
   
   2. If an element is added or removed before the TreeOrderPosition of the current styleCallback cycle, 
      then this change should be included in the current styleCallback cycle.
      Mutating the TreeOrderPosition of the elements should that occur after the current point in the
      TreeOrder iteration, ie. inside the custom element's shadowDOM, is ok.
      
   3. The current styleCallback cycle, in TreeOrder, could be aborted. 
      I'm not sure we should do this.

## The order of `styleChangedCallback`

### no `styleChangedCallback` spillover

The `styleChangedCallback` should have no spillover effect. When you change the inner state of the 
web component from a CSS property that triggers a `styleChangedCallback`, then this internal state change
should be invisible from the outside of the element. This means that the `styleChangedCallback`
can change the shadowDOM of the element, and the elements internal state, but that these internal 
state changes should *not*:
1. cause the element to directly or indirectly dispatch a so-called "composed" DOM event that 
   will slip into the lightDOM,
2. do not set or change an HTML attribute (that can be observed and trigger outside functional reactions)
3. nor cause any internal state changes that in turn triggers changes of the app state as a whole.

From the app's perspective, the change is pure, it has no side-effects.
         
### the order of execution of `styleChangedCallback`

`styleChangedCallback` should be executed as a batch.
Several elements can be queued to call `styleChangedCallback`.
As a `styleChangedCallback` should only affect the inner shadowDOM of a web component, 
these calls should be processed top-down, so as to work as intended and efficiently.
The batch processing of `styleChangedCallback` can assume that no spillover effects will cause
changes in the DOM *before* the point of current execution.
If such changes occur, the batch processing of `styleChangedCallback` is allowed to delay 
`styleChangedCallback` of such elements until the next frame.

### the point of execution of `styleChangedCallback`

`styleChangedCallback` is triggered by changes of style properties on the `host` node of a web component.
This has several benefits and reasons:
1. lifecycle callbacks are reactions to contextual, lightDOM changes. 
   As a lifecycle callback, `styleChangedCallback` should comply with this concept.
   todo add this comment to slottablesCallback too, that this is a true lightDOM change and that a 
   lifecycle callback should be that. While slotchangeCallback is an inner, shadowDOM change, 
   which should not be a lifecycle callback.
2. By listening for style changes on the `host` node, not only CSS variable and inherited properties,
   but any CSS property name can be observed. This is nice, as we do not necessarily want to
   enable CSS properties that trigger internal state changes to be recursive as CSS variables are.
3. The properties we need to observe might be changed from within the element, 
   but inner changes from other lifecycle or regular JS methods can and should in this instance 
   trigger ensuing functionality in the element imperatively, not reactively. 
4. By observing changes on the upper, lightDOM level, the browser would be able to skip processing 
   the CSS of the shadow elements, even though the `:host` operator is problematic.
   The `host` operator should have been a `shadowRoot` operator, working on the shadowRoot document node.
   This would have given the browser the ability to process CSS down-to-current-document level.
   
## todo

1. make an example of how we could implement a native element as a web component 
   that require an element specific CSS property. Find a simpler example than `<table>`.
   `list-style` is a good example. Then we get to work with our favorite beast, the `<ol>` list.
   Super!
   
3. make an example of the spillover effect.

