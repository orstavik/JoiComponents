# Pattern: Define, load and use a custom element

Normal HTML elements such as `<P>` and `<H1>` and `<UL>` are defined by the HTML standard.
When you use a normal HTML element in your web app, you get their default look and behavior 
out of the box. Custom elements are similar to normal HTML elements in that they can be *used* 
in the same way as a normal HTML element in your web app. But, while normal HTML elements are 
already defined and loaded by the browser, custom elements must be *defined* and *loaded* before use.

Custom elements is threefold:
1. how to define a custom element,
2. how to load a custom element, and 
3. how to use that custom element.

## How to define a custom element?
                                                   
A custom element is an HTML element. So, to create a custom HTML element, you need to:
1. make a JS class that `extends HTMLElement` and 
3. override the `constructor()` and/or `connectedCallback()`.

### Example: MyFirstElement
```javascript
class MyFirstElement extends HTMLElement {                          //[1]
  
  connectedCallback(){                                              //[2]
    this.innerText = "hello, you are looking at my first element";
  }
}
```
1. declare a class that `extends HTMLElement`
2. override `connectedCallback()`

## How to load a custom element?
There are two ways to load the definition of a custom element: 
* use a normal `script` to declare the custom element in the global scope, or
* use an import statement in a `script type="module"` to declare the custom element in a module scope.

However, just importing the customElement definition into JS is not enough. 
Sure, loading the definition gives you access to the custom element as a JS class. 
But, the HTML interpreter in the browser has **no** automatic mapping between classes imported in JS
HTML tags. Therefore, after a custom element is loaded as an es6 class, 
the es6 class must then be registered in the HTML interpreter using `customElements.define("tag-name", JSClass);`.

So, loading a custom element requires two steps:
1. load the definition using a `script` tag or `import` statement, and
2. register the definition with the HTML interpreter using `customElements.define("tag-name", JSClass);`.

### Example: load and register MyFirstElement as my-first-element
Regular scripts:
```html
<script src="https://example.com/MyFirstElement.js"></script>
<script>
  customElements.define("my-first-element", MyFirstElement);
</script>
```

Script-modules:
```html
<script type="module">
  import {MyFirstElement} from "https://example.com/MyFirstElement.js";

  customElements.define("my-first-element", MyFirstElement);
</script>
```
#### About customElements.define
`customElements.define` provides a method for associating a custom element with a particular tag.
The name of the tag you provide *must* include one or more **dashes** (`-`). 
This distinguishes custom elements defined by a developer (with a dash) 
and normal elements defined by the browser (no dash).
If you don't call `customElements.define` before you try to instantiate a custom element, you get an `Error`.
This `Error` occurs because the browser does not know which tag-name to associate with the element.

## Use a custom element
After the custom element is loaded, you can instantiate a custom element with:
* the constructor,
* `document.createElement`, and/or
* an HTML tag in your HTML code.

### Example: use my-first-element
```html
<my-first-element></my-first-element>                       <!-- will be 'updated' when the element is loaded -->

<script src="https://example.com/MyFirstElement.js"></script>
<script>
  const el1 = new MyFirstElement();                         //this works
  //const el2 = document.createElement("my-first-element"); //does not work yet
  customElements.define("my-first-element", MyFirstElement);
  const el3 = document.createElement("my-first-element");   //now it works
</script>

<my-first-element></my-first-element>                       <!-- the element is loaded, so it will be 'updated' from the start -->
```
Or via script-modules:
```html
<my-first-element></my-first-element>                       <!-- will be 'updated' when the element is loaded -->

<script type="module">
  import {MyFirstElement} from "https://example.com/MyFirstElement.js";
  
  const el1 = new MyFirstElement();                         //this works
  //const el2 = document.createElement("my-first-element"); //does not work yet
  customElements.define("my-first-element", MyFirstElement);
  const el3 = document.createElement("my-first-element");   //now it works
</script>

<my-first-element></my-first-element>                       <!-- script type="module" does not break the flow of parsing, so this will also be 'updated' when the element is loaded -->
```
<!--
### Problems using custom elements
In principle it is as simple to use a custom element as a normal HTML element.
I say *in principle* here because there are some real world issues that in practice makes using custom elements more complicated than one might like.

First of all, many browsers out there still do not support the HTML standards needed to define and use 
web components such as a) HTML templates, b) custom elements, c) shadowDom, and d) es6. 
To support these browsers, polyfills must be included and/or es6 code must be transpiled to es5.
And that is not simple, although many tools out there try to make it easy. 
We look at how to solve this in this chapter on polyfills todo.

Secondly, most custom elements are not implementing *all* the relevant HTML standards. 
Nor tested as diligently as the normal HTML elements.
We look at this in the this chapter about testing and demoing web components todo. 

### References
* 
-->