# Pattern: styleCallback


However, as we want a *top-down* control of style, we often *do* want the ancestor elements to define
the style of child elements, even across and into shadowDOM borders. And so CSS supports this, 
by two mechanisms that will be passed *from* the host node of a custom element in the lightDOM and 
*into* the shadowDOM of a custom element:

1. inherited CSS properties and
2. CSS variables (custom CSS properties).

## Passing CSS style into a web component with CSS variables

Passing CSS variables into a web component gives us another opening that in theory enables us to
expose the *entire* style of a custom element to its surrounding: If the developer of a web component
describes *all* of the CSS properties of *all* of its elements as CSS variables, *and* the user of the
web component then defines *all* of these CSS variables on the `host` elements of that web component,
then the entire style of that shadowDOM will be defined from the lightDOM.

In theory, CSS variables gives us *total control* of the shadowDOM CSS from the lightDOM.
Thus, the problem of styling a web component is *not* the *ability* to specify a web component's 
inner, shadowDOM CSS properties; the problem of styling web components is a problem of verbosity
and the division of labour. How to divide the labour of styling between the developer of the shadowDOM
and the developer of the lightDOM of a web component?

## Division of style labour 1: inherited CSS properties (native)

As described above, inherited CSS properties can be passed into a web component.
In many ways, this is obvious. Inheritable CSS properties are inherited and passed from top-down 
everywhere else in the flattenedDOM, so why not let inherited CSS properties be passed from the lightDOM
into the shadowDOM?
In deed, why not. Properties such as `font-family` flow into a web component.

In practice, passing inherited CSS properties into a web component means that
the CSS property is passed from the host node element node down into the shadowRoot document node.
Once inside, the web component itself can choose *override* the inherited font style in the shadowDOM,
by defining its own value of that property.

Mostly, letting inherited CSS properties flow into a web component is both necessary and 
"expected by the developer". Mostly, letting inherited CSS properties flow from lightDOM into shadowDOM
is simple and complete. But. There is one problem with it.
What if we want the web component to inherit a CSS property *only* in certain situations?
What if we want the developer to assign certain `font-family` and override this property if the given
`font-family` is not compatible with the web component?
In such a situation, we would need some kind of partial override of an inherited CSS style.
We would have needed to check if the inheritable CSS property fit a certain criteria and 
only then replace it with another value, something like this:
```text
* {
  font-family: if (inherited font-family is serif) { sans-serif } else { inherited }
}

```

The problem of partial override of CSS properties is not confined to web components, but applies to
CSS in general. Styling of web components is only *more* sensitive to this problem and needs partial 
CSS override more clearly as it attempts to reuse HTML and CSS elements in an even more varied contexts.
The solution presented here `styleChangedCallback` gives the developer of web components the means to 
handle partial override of inheritable css properties.


## Division of style labour 2: element specific CSS properties

The browsers already provide dozens of element specific CSS properties.
The `<table>` element and its table-specific CSS properties is a great example of this.
To understand this better, think of `<table>` as a web component.
When HTML first invented `<table>` web component, they quickly saw that they needed to specify 
the style of this particular element in a way that *only* applied to `<table>` elements.
To do so, they implemented a series of custom CSS properties unique to `<table>` element. 

#### Step 1

When `<table>` was invented, HTML and CSS didn't grammatically distinguish between CSS properties
that was meant to apply to all or many different HTML elements, and CSS properties that only applied
to a specific element such as `<table>`. All CSS properties looked the same. I do not think this is
a good convention. It causes confusion. First, it floods the lexicon of CSS properties. General
CSS properties applicable to many elements such as `display`, `color` and `border` is given equal
grammatical importance as `empty-cells` and other mic mack. 
Second, to avoid flooding the lexicon of CSS properties, 
browsers can try to reuse element specific properties to other elements where they might "almost" fit
(cf. `display: table` and `table-layout: something`). 

Element specific CSS properties should be prefixed with for example a single "-" (dash).
Double dash properties are CSS variables that will transcend into the element, single dash properties
will only be recognizable as being non-general.
It will be clear later why we want element specific CSS properties to both be able to differentiate 
between CSS properties that only transcend only one shadowDOM border (single dash) *and* 
those that transcend recursively (double dash) with `styleChangedCallback`.

#### Step 2

We continue with our thought experiment seeing the `<table>` as a web component.
When an element specific CSS property such as `empty-cells: hide` is specified on a `<table>` web component,
then this component will do "some magic" and "hide the empty cells".
Essentially, this "magic" is a none-simplistic reaction to the given style property.
By "none-simplistic" I mean a reaction, a function, that is not immediately recognizable as a
pure translation from one CSS rule to another. 
We can imagine that once the browser recognizes a specific CSS style for the table web component,
it takes the value of this CSS style to trigger a function (that could be implemented in JS)
to alter the inner view elements of the `<table>` web component (that could be implemented as an HTML+CSS
shadowDOM).

The concept is:
1. Alter an element specific style of a web component, and 
2. this will trigger a reactive function in the web component that
3. alters the internal shadowDOM of the web component.

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

## Why specify custom elements' style properties as CSS and not HTML attributes?

The main answer to this question is "we want to specify custom style properties of web components as 
CSS since style properties of normal web components is in CSS". Why?

1. we don't want a conceptual split. This leads to confusion, bad modularization, etc etc.
   So, as long as CSS controls the style of regular HTML elements, we want it to control the style
   of custom HTML elements.

2. HTML attributes is part of the DOM. CSS properties are part of the CSS rule set.
   The CSS properties can be placed in cascading CSS rules. This can be more convenient and less verbose.
   There is a reason why CSS is beneficial for styling regular elements, the same applies to custom elements.
   
3. CSS properties and CSSOM are processed in a different time (and place) than HTML attributes and DOM.
   This might actually turn out to be both problematic and beneficial for custom CSS properties of custom
   elements. However, as other CSS properties are affected similarly, this processing is beneficial.


   
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

