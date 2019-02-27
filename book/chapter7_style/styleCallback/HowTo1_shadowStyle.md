# Pattern: ShadowStyle

Web components encapsulate CSS in addition to HTML and JS. 
This encapsulation **protects** the integrity of both:
1. the shadowDOM CSS from the lightDOM CSS, and
2. the lightDOM CSS from the shadowDOM CSS.

One of the big, big, big problems of CSS is that it cascades and quickly becomes chaotic and filled with
multiple rules that overlap and intersect and intermingle with each other in numerous and impossible-to-manage
ways. Specifying that CSS rules do not pass into and out-of shadowDOMs helps manage this chaos:

1. The encapsulation that keeps the CSS style of the inner shadowDOM from escaping up 
   and into the lightDOM. This is simple and unproblematic. We want a *top-down* control of style, 
   and child elements should *not* define the style of parent elements in the DOM.

2. At the same time, developing the shadowDOM you only need to worry about CSS
   variables cascading into your component. No other outside CSS rules or properties can somehow
   interfere nor influence your element. 

## Example: `<blue-blue>` with ShadowStyle

In this example we will create a simple web components that will present its text as darkblue
against a lightblue background.
This example is as simple as possible so as to avoid confusion.
```html
<script>  
class BlueBlue extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  div {                                                                
    background-color: lightblue;                                          /*[1]*/
  }
</style>
<div style="color: darkblue;">
  <slot></slot>
</div>`;                                                                  //[2]
  }
}

customElements.define("blue-blue", BlueBlue);
</script>
  
<style>                                               
  div {
    color: yellow;                                                        /*[3]*/
  }
</style>

<blue-blue id="one" style="background-color: red;">                       <!--3-->
  darkblue text against a lightblue background.
</blue-blue>
<div>                                                                     <!--4-->
  This text is yellow.
</div>                
```
1. Inside the shadowDOM, we can define the `background-color` of the `<div>` element 
   in a `<style>` element.
2. We can also define the `color` on the `<div>` element itself.
   When we use the `<blue-blue>` web component, the text inside it will be wrapped
   inside a `<div>` that will make the text appear in blue against a lightblue background.
3. Regular CSS properties set in the lightDOM will not leak into the web component and control the 
   styles in the shadowDOM of the custom element.
4. Styles set inside the shadowDOM of `<blue-blue>`, does not leak out into the lightDOM 
   surrounding the host element.

## The need to style into the lightDOM

## The need to style into the shadowDOM

## Exceptions to CSS encapsulation

In principle, web components encapsulate CSS by making sure that:
1. CSS selectors defined *inside* the shadowDOM *cannot* select lightDOM elements, and that
2. CSS selectors defined *outside* a web component in its lightDOM *cannot* select shadowDOM elements.

But, there are of course exceptions to this principle divide:
1. The `:host` selector inside a web component do style the host node of the web component that reside
   in the lightDOM.
2. CSS variables can cascade into the shadowDOM of web components.
   
We will return to these exceptions later in this chapter.



## References

 * 