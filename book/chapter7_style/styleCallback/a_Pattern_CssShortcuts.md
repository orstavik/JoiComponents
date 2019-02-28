# Pattern: CustomCssShortcuts

## CSS variables as CSS micromanagement

When using multiple, individualized CSS variables to control the style of a web component, 
we essentially micromanage the style. Each individual CSS variable control one stylistic aspect,
and the more inner properties of the web component we expose as CSS variables, 
the more of the internal style we can control in the web component.
 
Neither exposing CSS variables from inside the shadowDOM nor declaring CSS variables in the lightDOM
around a web component is very problematic. The problem is that:
 
1. CSS variables are declared at various points deep down in shadowDOM structure. 
   They are structurally hidden in the web component. 
   This means that the developer of the web component must make a separate documentation note
   connected to the web component to give:
   1. an overview of which css properties the web component exposes and 
   2. what these CSS variables controls and how to use them.

2. As the previous three chapter illustrated, the user of an HTML element desires to control groups
   of style properties as one. This can be motivated by CSS properties being system- or real-world
   covariant. Managing such covariant CSS properties one by one instead of as a group really smacks of
   micromanagement.

The web community *knows* that micromanaging CSS is a practice that does not lead to productivity 
and lean and mean code.

## CustomCssShortcuts fixes CSS micromanagement

To avoid CSS micromanagement, custom CSS shortcuts is a great tool:

 * Custom CSS shortcuts enable the developer to cluster groups of covariant CSS properties
   as a single unit that externally can present a simple, enumeric interface, but that
   internally can ensure that the values of several CSS properties in the shadowDOM are coordinated.
   **Put simply, custom CSS shortcuts enable the developer to encapsulate the internal logic between
   different CSS properties in a web component.**
   
 * CSS shortcuts enable the developer to reduce the number of style properties given to the developer.
   
 * The logic that process CSS shortcuts can easily be modularised as methods in the custom element class.
   This gives the developer a better structure and entry point for documentation. By adding a simple
   naming convention, methods processing custom CSS shortcuts can also readily be turned into
   partial documentation.  
   
 * Custom CSS shortcuts also gives the developer a single solution to fix all the three use-cases listed 
   in the three previous chapters.

## How to implement a Custom CssShortcuts

To implement naive(!) CustomCssShortcuts is super simple:

1. decide on a CSS property name that is not in use for that element.
   By using a single `_` as a prefix for your CustomCssShortcut name, 
   you can be certain that the browser will not attach some other meaning to your CSS property.

2. add a CustomCssShortcut-function that converts your CustomCssShortcut value into
   a series of other CSS properties and apply them to the element.

3. whenever the CustomCssShortcut property changes value on an element, 
   call the CustomCssShortcut-function.
 
```html
<script>
  /**
  * the CustomCssShortcut _color-mode must be given on the form:
  *   _color-mode: <color> <mode>;
  * 
  * examples:
  *   color-mode: day blue;
  *   color-mode: night red;
  */
  function processColorMode(el){
    var values = getComputedStyleValue(el, "_color-mode").trim().split(/\s+/);
    var color = values[0];
    var mode = values[1];
    el.style.color = (mode === "night") ? "white" : "black";
    el.style.backgroundColor = (mode === "night") ? "dark" + color : "light" + color;
    el.style.borderColor = (mode === "night") ? "light" + color : "dark" + color;
  }
</script>

<style>
  #noShortcut {
    background-color: darkgreen;
    border-color: lightgreen;
    /*color: black;               ooops, missed a real-world covariant attribute*/
  }
  #shortcutOne {
    _color-mode: blue night;
  }
  #shortcutTwo {
    _color-mode: red day;
  }
</style>

<div id="noShortcut">Micromanaged</div>
<div id="shortcutOne">Shortcut one</div>
<div id="shortcutTwo" style="border: 3px solid transparent;">Shortcut two</div>

<script>
  processColorMode(document.querySelector("#shortcutOne"));
  setTimeout(function(){  
    processColorMode(document.querySelector("#shortcutTwo"));
  }, 5000);
</script>
```

The naive implementation of CustomCssShortcuts above is not very useful:
1. It is not well modularized, and so the CustomCssShortcut is mixed together with all sorts of other
   stuff.
2. It requires the developer to manually trigger the function that process the CustomCssShortcut.
3. It will likely cause the browser to repeatedly compute the CSSOM.

In the next chapters we will extend this naive CustomCssShortcut implementation to gradually
become a full fledged lifecycle callback (`styleCallback(...)`) that will go a long way to address
the weaknesses described above.

## References

 * [_safe-css-property-name](https://www.w3.org/TR/CSS2/syndata.html#vendor-keywords)