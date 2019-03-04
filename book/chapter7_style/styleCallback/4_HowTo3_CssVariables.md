# HowTo: CSS variables

Currently, the only native vehicle to pass CSS properties into a web component is CSS variables.
In principle, CSS variables enable us to expose the style of the *entire* shadowDOM to its surrounding. 
If a web component explicitly marks all the CSS properties of all its shadowDOM elements
as CSS variables (with default values), then the style of a web component's entire shadowDOM
can be set from the outside.
                                   
## What does CSS variables look like?

CSS variables are defined as regular CSS properties whose names *must* begin with double dashes:
`--css-variable-name: stringValue`. 
These CSS variables can then be used inside a CSS `var(--variable-name, defaultValue)` expression.

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
<script>
  class BlueBlue extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
           <style>
        div {
           background-color: var(--bg-color, red);                /*[2]*/
           color: var(--text-color, red);          
         }
       </style>
       <div>
         <slot></slot>
       </div>`;                                                      
    }
  }

  customElements.define("blue-blue", BlueBlue);
</script>

<style>
    blue-blue {                                                   /*[1]*/
        --bg-color: lightblue;
        --text-color: darkblue;
        --list-style: square inside none;
    }

    div {                                                        
        color: yellow;                         
    }

</style>

<blue-blue id="one" style="background-color: red;">               
    darkblue text against a lightblue background.
</blue-blue>

<div>                                                             
    This text is yellow.                                         
</div>
```

1. In the lightDOM we can define CSS-variables of the `<blue-blue>` element in a 
   `<style>` element.
2. Inside shadowDOM, we can define the background color `<div>` by invoking CSS variable 
   selectors defined outside shadowDOM. This can also be understood as "exposing" two CSS properties
   of the shadowDOM as `--text-color` and `--bg-color`.

## Are CSS variables enough to style web components?

In principle, CSS variables gives us *full access from the lightDOM to all the CSS 
properties of all the elements in a webcomponent's shadowDOM*.
But, that's the principle. In reality, CSS variables comes up short when put to the test against
three important use cases (which will be described in the next chapters):
 * [how to coordinate system-world covariant CSS properties internally?](UseCase1_CoordinateSystem)
 * [how to coordinate real-world covariant CSS properties internally?](UseCase2_CoordinateRealWorld)
 * [how to alter the inner structure of the shadowDOM template based on external changes of style properties?](UseCase3_OuterStyleBecomesInnerStructure) 

## References

 * [Using CSS custom properties (variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables)


