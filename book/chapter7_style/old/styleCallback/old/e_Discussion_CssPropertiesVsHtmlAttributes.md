# Discussion: CSS properties vs. HTML attributes?

In CSS, there are some properties that only apply one specific element.
One example is the `empty-cells`, `border-collapse`, and `caption-side` properties that 
only apply to `<table>` element.
Another example is the `list-style` property that only applies to `<ol>` and `<ul>`.

To understand this concept, think of for example the `<table>` as a web component.
When you make and use a `<table>` web component you need to specify the "look" of 
other stylistic properties than you do for other elements:
you need to specify where to show the caption, whether adjacent cells should share their borders, 
and how to treat missing table cells. 
These stylistic properties are highly particular to the `<table>` elements, and
to apply them to anything other than a `<table>` element just makes no sense.
To accomplish these styling goals, a set of CSS properties `empty-cells`, 
`border-collapse`, and `caption-side` are set up that only the `<table>` element react to.

## Element specific CSS properties vs. HTML attributes?

First, every CSS property could be specified as an HTML attribute. So that both the element specific 
CSS properties of `<table>` and `<ol>` could be specified as 

Why specify custom elements' style properties as CSS and not HTML attributes?
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

## Element-specific CSS properties or HTML attributes?

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

## Conclusion

If changes from the property *only* affects the inner mechanics of the element with no potential
for outside observation, then CSS properties can be used. If changes can and should affect other 
observable properties of the element (ie. dispatches events, alters other html attributes on the host node,
alters gesture or PWA state, etc.), then HTML attribute must be used.

## References

 * 
