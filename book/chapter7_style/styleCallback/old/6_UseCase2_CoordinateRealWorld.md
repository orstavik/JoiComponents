# UseCase: Coordinate RealWorldCovariantCss

## What is RealWorldCovariantCss?
                                                                                     
Often, CSS properties are codependent. This codependence can have several origins, but we can think
of it as either a **system-world** or **real-world** codependence. 

Two CSS properties are **real-world** codependent when the user will experience the value of one affecting
the value of another. For example, if you set `background-color: white` and `color: yellow` on a `<span>`
element with plain text content, then the user eyes are not sensitive enough to read its content. 
As with system-world codependence, real-world codependence can also span several elements requiring the
developer to coordinate the values of several CSS properties for the user.

## Native coordination RealWorldCovariantCss 

Natively, CSS provides CSS shortcuts such as (todo find some example here).

For web components, there is no ability to define CSS shortcuts for external coordination of codependent
CSS properties. But. There is hope! `styleCallback` enables the developer to create such coordinating
CSS shortcuts and implement their translation into other CSS properites in JS. Yes. I know. You will
love `styleCallback`.

> Often, the styles need to vary accordingly. In the example above, the color of the text should vary according
  to the color of the background: set a light background, and you should have a dark text, and vice versa.
  When two such co-dependent style properties are exposed to be set individually, you can expect lots
  of mistakes and worries on behalf of the user that wants to style these properties.

## Custom coordination RealWorldCovariantCss

Problem is the external covariance of the CSS property, that the user on the outside gets the task and worry 
about ensuring that CSS properties fit together. This is bad. We want the developer of the web component
to encapsulate this logic inside the web component.

## Example: BlueBlue with codependent color values

An example of such encapsulation is an imagined external property `color-mode`.
`color-mode` would be translated into a set of CSS properties that are coherent in the real-world. 
For example, 
* `color-mode: day blue;` => `background-color: lightblue; border-color: darkblue; color: black;`
* `color-mode: night green;` => `background-color: darkgreen; border-color: lightgreen; color: white;`


```html

```

Other examples of coordination of SystemWorldCovariantCss will be discussed in [UseCase: OuterStyle Becomes InnerStructure]().

