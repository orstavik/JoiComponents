# How to `.attributeChangedCallback()`

`attributeChangedCallback` is a callback method that is triggered every time an 
attribute listed in `observedAttributes` is instantiated or changes.

To register an attribute in `observedAttributes` list, 
the name of the attribute must be added as a string to the 
returned array from the native function `static get observedAttributes()`.
For more about `static get observedAttributes()`, see the [StaticSettings pattern](../chapter2_HowToMakeMixins/Pattern3_StaticSettings.md).

## Example SayMyName
```html
<script>
  class SayMy extends HTMLElement {
    
    static get observedAttributes(){                        
      return ["first-name", "last-name"];                   //[1]
    }
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = 
        `<span>your name is: </span>
        <span id='lastName'></span>, 
        <span id='firstName'></span>`;
    }
    attributeChangedCallback(name, oldValue, newValue) {    
      if (name === "first-name"){                           //[2]
        const span = this.shadowRoot.querySelector("span#firstName");
        span.innerText = newValue;                          //[3]
      }
      else if (name === "last-name"){                       //[2]
        const span = this.shadowRoot.querySelector("span#lastName");
        span.innerText = newValue;                          //[3]
      }
    }
  }
  customElements.define("say-my", SayMy);
</script>

<say-my first-name="Ivan" last-name="the Great"></say-my>  <!--4-->

<script>
  setTimeout(function(){
    const el = document.querySelector("say-my");
    el.setAttribute("last-name", "the Terrible");           //[5]
  }, 3000);
</script>
```
1. The `static get observedAttributes()` function returns an array of attribute names that the 
element should observe. Here, both `first-name` and `last-name` are added to the returned array.
2. Inside `attributeChangedCallback(name, oldValue, newValue)` the attribute name
is used to identify which attribute the callback concerns.
3. The `oldValue` and `newValue` are used inside the custom element. 
Here, the new values of the name attributes are added as text in `<say-my>`'s shadowDOM.
4. When the attributes are ascribed values for the first time, 
`attributeChangedCallback(...)` is called twice:
   1. `attributeChangedCallback("first-name", undefined, "Ivan")`
   2. `attributeChangedCallback("last-name", undefined, "the Great")`
After these callbacks, the browser presents `your name is: the Great, Ivan`.
5. After 3000ms the `last-name` attribute is changed.
This change triggers a new callback:
   1. `attributeChangedCallback("last-name", "the Great", "the Terrible")`
After this callback, the browser presents `your name is: the Terrible, Ivan`.

## Why `static get observedAttributes()`?
Or rather, why not trigger an `attributeChangedCallback(...)` for all attributes, always?

When you make a custom element, you most often need only observe a few custom attributes.
But, HTML elements has many attributes. Some of these attributes such as `style` and `class` 
can change value quite often. So, if all attribute changes of custom elements 
would trigger a JS callback, the browser would slow down.
                                                        
Therefore, the browser is interested in *avoiding* `attributeChangedCallback(...)`
for all the attribute changes which the custom element do not care about. 
By making the developer specify which attributes should 
trigger `attributeChangedCallback` in `static get observedAttributes()`,
the browser can *ignore* all changes to other attributes.

## When is `attributeChangedCallback(...)` triggered?

`attributeChangedCallback(...)` is triggered immediately, synchronously.
But, as with other [custom element reactions](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-reactions),
`.attributeChangedCallback()` can be 'grouped' and run at the end *within* functions 
that manipulate DOM for several elements at the same time.
Examples of such functions are `.cloneNode`, `.innerHTML` and `.appendChild`/`.removeChild`. 
When these functions run they affect a whole group of children/elements within a single call.
*Within* such functions, `.attributeChangedCallback()`, `connectedCallback()` etc. for several children
can be grouped together.

## Comment on JS parameter order 
There is one minor flaw with the `attributeChangedCallback(...)` standard:
the order of arguments should have been `name`, `newValue`, `oldValue`, 
*not* `name`, `oldValue`, `newValue`. 
`newValue` is commonly needed, while `oldValue` is not.
If `oldValue` was placed last, then most often implementations of the `attributeChangedCallback(...)`
would have been able to skip the third argument.
To change this now would cause confusion and bugs. 
But developers should not copy the principle of oldValue before newValue for custom element callbacks.
The order should be newValue before oldValue. 

## References
 * MDN on `attributeChangedCallback`
 * MDN on `observedAttributes`