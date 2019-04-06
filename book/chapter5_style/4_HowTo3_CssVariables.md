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

## CSS variables and the problem of external CSS coordination

ShadowDOM gives us the means to **hide all the inner CSS properties** of a web component.
CSS variables gives us the means to **expose all the inner CSS properties** so that
**style can be set from outside**. 
Together, ShadowDOM and CSS variables enable us to **selectively protect or expose the 
inner style of a HTML/JS/CSS module**.
If all we need is to set a single CSS property inside a web component, 
then ShadowDOM and CSS variables is the answer.

But. What if we need more? What if we need to adjust the style of an element in a way that requires 
setting multiple CSS properties at once? And what if these CSS properties needs to be set in a particular
way? Sure, CSS variables gives us the means to expose several inner CSS properties individually.
But they do not give us any means to ensure that their values correspond to each other and are coordinated.
CSS variables in many ways presupposes that the user of the web component *coordinate* the use and 
values of a several CSS properties.
 
But. To *successfully* coordinate the values of several CSS properties can often be tricky.
CSS property is fraught with semantic details and edge cases and gotchas, and thus
to coordinate several CSS properties so that they work together in harmony and pull in the same 
direction can take time and effort and cause numerous problems. Problems that quite often easily
can be foreseen ahead of time per element. Coordinating inner CSS properties should therefore often
*not* be an external task left up to the user of the web component, but instead be solved *internally*
by the developer of the web component. CSS variables alone does not give us a means to *internally*
coordinate the values of CSS properties.

In the next chapters, we will look at the first pattern for internally coordinating CSS properties
in web components: the StyleCoordinatingAttribute pattern. 

## old drafts

But. needs setting in a web component, but from within the web component, *CSS variables gives us no means 
of ensuring that the different CSS properties are set in a coordinated manner*.
internally coordinating 
such CSS*
But, that's the principle. In reality, CSS variables comes up short when put to the test against
three important use cases (which will be described in the next chapters):
 * [how to coordinate system-world covariant CSS properties internally?](UseCase1_CoordinateSystem)
 * [how to coordinate real-world covariant CSS properties internally?](UseCase2_CoordinateRealWorld)
 * [how to alter the inner structure of the shadowDOM template based on external changes of style properties?](UseCase3_OuterStyleBecomesInnerStructure) 

## Problem: CSS variables with IE and polyfill.

Polyfilling CSS variables is...
    
## References

 * [Using CSS custom properties (variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables)
 * [caniuse.com: CSS variables](https://caniuse.com/#feat=css-variables)
 * [github: css-vars-ponyfill](https://github.com/jhildenbiddle/css-vars-ponyfill)


