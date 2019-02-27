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
div {
  --variable-color: blue;
  border: 10px solid red;
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

## The limits imposed by verbosity

In principle, CSS variables gives us *full access* to the shadowDOM style from the lightDOM.
But. It is has several problems:

1. It is far too verbose to work. *Especially* defining the use of all the CSS variables inside the 
   shadowDOM of the web component *and* to declare the values of all the needed CSS variables in the
   lightDOM around each component, is just too much. It will fill the web component and its uses
   with boilerplate styling text, just annoying everyone to death and hiding all the other code inside
   a mass of CSS uselessness. The web has long been there and done that before, we know it doesn't work
   in the long run.

2. Often, the styles need to vary accordingly. In the example above, the color of the text should vary according
   to the color of the background: set a light background, and you should have a dark text, and vice versa.
   When two such co-dependent style properties are exposed to be set individually, you can expect lots
   of mistakes and worries on behalf of the user that wants to style these properties.
   
3. Often, the style you want to specify is as much associated with the makeup and structure of  
   the shadowDOM template as it is with CSS properties. 

CSS and HTML actually has a solution for these three quite different problems in use on some 
native HTML elements such as `<ol>` and `<table>`: 
[Pattern: ElementSpecificCSSProperties](Pattern_ElementSpecificCSSProperties).
However, up to this point, no generic solution has been supplied to do so for web components.
Until now. It gives me great pleasure to shortly introduce to you the solution to most of your 
web component custom styling: `styleCallback()`.

## References

 * 

