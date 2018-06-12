# Pattern: Define, load and use a custom element

Normal HTML elements such as `<P>` and `<H1>` and `<UL>` are defined by the HTML standard.
When you use a normal HTML element in your web app, you get their default look and behavior 
out of the box. Custom elements are similar to normal HTML elements in that they can be *used* 
in the same way as a normal HTML element in your web app. But, while normal HTML elements are 
always present, custom elements must be 1) *defined* and 2) *loaded* before 3) use.

## 1. How to define a custom element?
                                                   
To create a custom HTML element, you need to:
1. make a JS class that `extends HTMLElement` and 
2. override the `constructor()` and/or `connectedCallback()`.

#### Example: MyFirstElement
```javascript
 class MyFirstElement extends HTMLElement {         //[1]
   constructor(){                                   //[2]
     super();
     this.attachShadow({mode: "open"});
     this.shadowRoot.innerHTML = "hello, I am a custom element";
   }
}
```
1. Declare a class that `extends HTMLElement`.
2. Override `constructor()`.

## 2. How to load a custom element?

Loading a custom element requires two steps:
1. load the `class extends HTMLElement` definition using a `script` tag or `import` statement, and
2. register the `class` definition with a particular html tag using 
`customElements.define("tag-name", JSClass);`. 

#### Example: load and register MyFirstElement as my-first-element
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
#### `customElements.define()`
`customElements.define("tag-name", Class)` registers a particular tag-name with 
custom element class definition.
The name of the tag you provide *must* include one or more **dashes** (`-`). 
This distinguishes custom elements defined by a developer (with a dash) 
from native elements (no dash).
If you don't call `customElements.define` before you instantiate a custom element, 
you get an `Error`. This `Error` occurs because the browser does not know which 
tag-name to associate with the element functions as a DOM node.

## 3. How to use a custom element?
After the custom element is loaded, you can instantiate a custom element with:
* the constructor,
* `document.createElement`, and/or
* an HTML tag in your HTML code.

### Example: use my-first-element
```html
<my-first-element></my-first-element>                       <!-- will be 'upgraded' when the element is loaded -->

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
<my-first-element></my-first-element>                       <!-- will be 'upgraded' when the element is loaded -->

<script type="module">
  import {MyFirstElement} from "https://example.com/MyFirstElement.js";
  
  const el1 = new MyFirstElement();                         //this works
  //const el2 = document.createElement("my-first-element"); //does not work yet
  customElements.define("my-first-element", MyFirstElement);
  const el3 = document.createElement("my-first-element");   //now it works
</script>

<my-first-element></my-first-element>                       <!-- script type="module" does not break the flow of parsing, so this will also be 'updated' when the element is loaded -->
```

## References
* 