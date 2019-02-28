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

1. Outside the shadowDOM, we can define CSS-variables of the <blue-blue> element in a <style> element to expose multiple CSS properties.
2. Inside shadowDOM, we can define the background color <div> by invoking CSS variable selectors defined outside shadowDOM.
3. We can also define the color of the <div> element itself by also invoking CSS variable. When we use the <blue-blue> web 
component, the text inside it will be wrapped inside the <div>, making the text blue against the blue background.
4. Regular CSS properties set in the lightDOM will not leak into the web component and control the styles in the shadowDOM of the custom element.
5. Styles set inside the shadowDOM of <blue-blue>, does not leak out into the lightDOM surrounding the host element.
  
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
           background-color: var(--bg-color, red);                //[2]          
         }
       </style>
       <div style="color: var(--text-color, red)">                //[3]  
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
        color: yellow;                                            <!--4-->
    }

</style>

<blue-blue id="one" style="background-color: red;">               <!--4-->
    darkblue text against a lightblue background.
</blue-blue>

<div>                                                             
    This text is yellow.                                         //[5]
</div>
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

 * [Using CSS custom properties (variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables)


