# Chapter introduction

Normal HTML elements such as `<P>` and `<H1>` and `<UL>` are defined by the HTML standard.
When you use a normal HTML element in your web app, you get their default look and behavior 
out of the box. Custom elements are similar to normal HTML elements in that they can be *used* 
in the same way as a normal HTML element in your web app. But, while normal HTML elements are 
already defined by the browser, before you can use a custom element, you must yourself *define* 
how a custom element should behave and look.

Custom elements is therefore about two things:
1. how to define a custom element and 
2. how to use that custom element.

Using a custom element is *almost* as simple as using a normal HTML element.
I say *almost* here because the use of native custom elements is not (yet) all it is cracked up to be.
First of all, many browsers out there still do not support the HTML standards needed to define and use 
web components such as a) HTML templates, b) custom elements, c) shadowDom, and d) es6. 
To support these browsers, polyfills must be included and/or es6 code must be transpiled to es5.
And that is not as easy at one might like and hope.
Secondly, few if any custom elements have been written as diligently as the normal HTML elements.
This book hopes to remedy this, but using custom elements will likely require much more care than 
using normal, browser-defined elements. 
Still. Custom elements do provide a good interface for integrating custom HTML+JS+CSS modules. 
As such, custom elements provide a great means both to organize and stabilize your own work, and 
collaborate with others. It might not be perfect. And it might always need to be polyfilled
if one desires to support old browsers. But it will still provide you with the cleanest and simplest
API for making HTML+JS+CSS modules. In my humble opinion.

In this book, the web component design patterns will:
1. first exemplify how to define custom elements in JS, and then 
2. second exemplify how to use those definitions from HTML or JS.

## Pattern 1: Create a custom element
                                                   
A custom element is an HTML element. And to create a custom HTML element, 
you only need to perform two steps:
1. make a JS class that `extends HTMLElement` and overrides the `constructor()` 
and/or `connectedCallback()`, and
2. call `customElements.define()` assigning this class with a tag-name.

### Example: my-first-element is MyFirstElement
```javascript
class MyFirstElement extends HTMLElement {                          //[1]
  
  connectedCallback(){                                              //[2]
    this.innerText = "hello, you are looking at my first element";
  }
}

customElements.define("my-first-element", MyFirstElement);          //[3] 
```
1. declare a class that `extends HTMLElement`
2. override `connectedCallback()`
3. use `customElements.define` to associate your class with an HTML tag

To use the element, you would do: 
(HTML)
```html
<h1>Here is a custom element</h1>
<my-first-element></my-first-element>
```
(JS)
```javascript
const el = document.createElement('my-first-element');
document.querySelector("body").appendChild(el);
//or 
const el2 = new MyFirstElement();                     //todo read up on using constructor to create custom elements
document.querySelector("body").appendChild(el2);      
```

#### About customElements.define
`customElements.define` provides a method for associating a custom element with a particular tag.
The name of the tag you provide *must* include one or more **dashes** (`-`). 
The reason for this is to clearly show developers which HTML elements are custom and 
defined by a developer (with a dash) 
and which are normal and defined by the browser (no dash).
Also, in order to use the constructor of a custom HTMLElement, you *must* call `customElements.define` first.
This is needed because the browser needs to associate a tag name with every HTMLElement, 
and calling `customElements.define` is the way you do that.


                                             
                                             

```html
<h1>Here is a custom element</h1>
<my-first-element></my-first-element>
```


### References
* 