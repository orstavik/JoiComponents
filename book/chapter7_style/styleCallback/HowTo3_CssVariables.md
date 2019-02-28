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

## CSS variables + web components != love

In principle, CSS variables can give us *full lightDOM access* to 
*all the elements and CSS properties* in the shadowDOM of a web component.
But. As the example above illustrates, something is not right. 
Here, we will list and illustrate how CSS variables come up short as a vehicle for styling web components.

### CSS variables + web components = lots of boilerplate CSS

When using CSS variables to control the style, a series of repetitive steps must be taken to both:
1. define the use of all the CSS variables inside the shadowDOM of the web component and
2. declare the CSS variables' values in the outside lightDOM of the web component.

Inside the web component, the CSS code does not really perform any other function than to give a specific
name to a specific element's CSS property in the shadowDOM. For a handful of inner CSS properties
such exposure is ok, but when you start counting exposed CSS properties with two digits, the gravity
of low-level API complexity starts pulling the usability of the web component down.

Outside the web component, naming a couple of key, inner CSS properties is fine. 
But. As soon as the web component require you to manage a handful of CSS properties custom with 
"--long-double-dashed-names", the need for detailed documentation and detailed insight into the 
web component will start to annoy the user. The user of the web component desires:
* fewer CSS properties with
* simple, logical names, that are
* coherent with the form and function of the web component's template and reactions.
 
Alone, the verbosity of exposing multiple CSS variables is not a show-stopper.
But, the web community *knows* that generic CSS grammar that create CSS boilerplate is not good.
And combined with the other coming problems, the verbosity issues escalate.

### CSS variables + web components = external coordination inner codependent CSS properties
                                                                                     
Often, CSS properties are codependent. This codependence can have several origins, but we can think
of it as either a **system-world** or **real-world** codependence. 

Two CSS properties are **system-world codependent** when they directly depend on the value of each other.
For example, it makes no sense to set the `left: 10px` CSS property on an element with `display: inline`. 
The value of the `top` CSS property depends on a specific value of the `display`.
Such system-world codependence is not restricted to within individual HTML elements; 
it can span several elements in the DOM. An example of such inter-element, system-world codependence
is again the `display` CSS property: when you set the `display: absolute` on an element, the interpretation
of this value depends on the value of the value of the `display` property of one or more of the element's 
ancestor elements.

Example, BlueBlue with codependent border values?

```html

```

Natively, CSS provides some support for coordinating such CSS properties.
For example, shortcut CSS properties such as `border: 4px 2px dotted red` makes it simpler to coordinate
low-level properties such as `border-left-width`.

Two CSS properties are **real-world** codependent when the user will experience the value of one affecting
the value of another. For example, if you set `background-color: white` and `color: yellow` on a `<span>`
element with plain text content, then the user will no longer be able to read its content. 
As with system-world codependence, real-world codependence can also span several elements requiring the
developer to coordinate the values of several CSS properties for the user.

Example, BlueBlue with codependent color values

```html

```

To fix this, we would like one external property `color-mode` that would be translated into a set
of real-world coherent CSS properties. For example, 
* `color-mode: day blue;` => `background-color: lightblue; border-color: darkblue; color: black;`
* `color-mode: night green;` => `background-color: darkgreen; border-color: lightgreen; color: white;`

Natively, CSS provides CSS shortcuts such as (todo find some example here).

For web components, there is no ability to define CSS shortcuts for external coordination of codependent
CSS properties. But. There is hope! `styleCallback` enables the developer to create such coordinating
CSS shortcuts and implement their translation into other CSS properites in JS. Yes. I know. You will
love `styleCallback`.


## The limits imposed by verbosity

It is has several problems:

1. 
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

