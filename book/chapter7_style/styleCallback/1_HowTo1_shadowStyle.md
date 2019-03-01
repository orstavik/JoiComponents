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

## Why break CSS encapsulation?

Web components protects the CSS from lightDOM and shadowDOM of influencing and confuse each other.
They do so by making sure that:
1. CSS selectors defined *inside* the shadowDOM *cannot* select lightDOM elements, and that
2. CSS selectors defined *outside* a web component in its lightDOM *cannot* select shadowDOM elements.

But. There are of course two exceptions to this principle.

First. Sometimes you want the web component to be able to style its host node.
The host node of the web component reside in the lightDOM, but the also functions as a stylistic
root element for the web component as a whole. 
To define its default, startup style, the web component needs to style this stylistic root, 
even though it is a lightDOM element.
The next two chapters [Problem: ThisStyleIsNotMyStyle](Problem_ThisStyleIsNotMyStyle) and
[HowTo: HostWithStyle](HowTo2_HostWithStyle) describe how this can and should be done.

Apart from styling the individual host element (with low priority), the inner CSS properties 
of the web component cannot leak into any other lightDOM element. Its only the host that gets affected.

Second. From the lightDOM, the host element node of the web component is directly available and
can be styled like any other HTML element. But, what if you want to control and adjust style 
(or even composition) of shadowDOM elements? Normally, style would be controlled top-down, so what if the
top lightDOM context needed to control and adjust some stylistic properties inside the element?

Natively, the CSS variables is so far the only accessible option. 
CSS variables set in the lightDOM context of a web component will be available as properties inside
the web components shadowDOM. In [HowTo: CSSVariables](HowTo3_CSSVariables) we show how this can be useful.
However, as we want a *top-down* control of style, we often *do* want the ancestor elements to define
the style of child elements, even across and into shadowDOM borders. And so CSS supports this.
A mechanism that will be pass CSS style properties *from* the host node of a custom element and 
directly into the shadowDOM of a custom element.

However, there are two use cases were CSS variables comes up short. First, what if you wanted to
style a group of internal CSS properties as CSS variables coherently, as one? In many such instances
these CSS variables depend on each other, meaning that the value of one require a specific value of another
to make sense. Second, what if you need to "style" the composition of the shadowDOM? Some changes of
appearance cannot be achieved without also at the same time altering the makeup of the shadowDOM template.
These element-specific CSS properties will be described in a series of chapters on the [Pattern `styleCallback(...)`]().

## References

 * 