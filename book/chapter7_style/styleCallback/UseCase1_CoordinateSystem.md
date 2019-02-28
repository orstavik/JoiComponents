# UseCase: Coordinate SystemWorldCovariantCss

## What is SystemWorldCovariantCss?
                                                                                     
Often, CSS properties are codependent. This codependence can have several origins, but we can think
of it as either a **system-world** or **real-world** codependence. 

Two CSS properties are **system-world codependent** when they directly depend on the value of each other.
For example, it makes no sense to set the `left: 10px` CSS property on an element with `display: inline`. 
The value of the `left` CSS property depends on a specific value of the `display`, such as `absolute` or `fixed`.

Such system-world codependence is not restricted to within individual HTML elements; 
it can span several elements in the DOM. An example of such inter-element, system-world codependence
is again the `display` CSS property: when you set the `display: absolute` on an element, the interpretation
of this value depends on the value of the value of the `display` property of one or more of the element's 
ancestor elements.

## Native coordination SystemWorldCovariantCss 

external coordination inner codependent CSS properties

Example, BlueBlue with codependent border values?

```html

```

Natively, CSS provides some support for coordinating such CSS properties.
For example, shortcut CSS properties such as `border: 4px 2px dotted red` makes it simpler to coordinate
low-level properties such as `border-left-width`.

todo: find an example from CSS where it gives a shortcut to coordinate SystemWorldCovariantCss

Other examples of coordination of SystemWorldCovariantCss will be discussed in [UseCase: OuterStyle Becomes InnerStructure]().

## Custom coordination SystemWorldCovariantCss

example: an imagined `display-shortcut: fixed top-left 12px 200px;`
