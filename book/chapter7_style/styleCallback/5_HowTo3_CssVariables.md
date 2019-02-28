# HowTo: CSS variables

CSS variables is currently the only native vehicle to pass CSS properties into a web component.
In theory, CSS variables enable us to expose the *entire* style of a shadowDOM to its surrounding: 
If the developer of a web component explicitly marks all the CSS properties of all its shadowDOM elements
as either a CSS variable or a default value, the entire body of a web component's shadowDOM
can be selectively controlled from the outside.

## What does CSS variables look like?

CSS variables are defined as regular CSS properties, except that their name must begin with a double
dash `--variable-name`. These CSS variables can then be used inside a CSS `var(--variable-name, defaultValue)` 
expression.

```html
<style>
* {
  border: 10px solid transparent;
}
div {
  --variable-color: blue;
}
#left {
  border-left-color: var(--variable-color, orange);
}                   
#right {
  border-right-color: var(--variable-color);
}                   
#top {
  border-right-color: var(--variable-color, black);
}                   
</style>

<div id="left">left blue border</div>
<div id="right">right blue border</div>
<span id="top">top black border, because the CSS variable declaration is only set on the div elements</span>
```

## Example: Passing CSS variables into BlueBlue web component

Below is the BlueBlue example setup to illustrate how CSS variables can be used to expose multiple
CSS properties to the outside. We take up the very first BlueBlue example from the 
[HowTo: shadowStyle](HowTo1_shadowStyle) so to illustrate how we when we make a web component with
shadowDOM can expose the inner style of the shadowDOM by invoking CSS variable selectors.

```html

```

## Are CSS variables enough to style web components?

In principle, CSS variables gives us *full access from the lightDOM to all the CSS 
properties of all the elements in a webcomponent's shadowDOM*.
But, that's the principle. In reality, CSS variables comes up short when put to the test against
three important use cases (which will be described in the next chapters):
 * [how to coordinate system-world covariant CSS properties internally?](UseCase1_CoordinateSystem)
 * [how to coordinate real-world covariant CSS properties internally?](UseCase2_CoordinateRealWorld)
 * [how to alter the inner structure of the shadowDOM template based on external changes of style properties?](UseCase3_OuterStyleBecomesInnerStructure) 

## References

 * 

