# HowTo: `.attributeChangedCallback(...)`

`attributeChangedCallback(...)` is a callback method that is triggered every time an 
*observed* attribute is instantiated or changed.
To *observe* an attribute, its name must be added as a string to the 
returned array from the native function `static get observedAttributes()`.
For more about `static get observedAttributes()`, see the 
[StaticSettings pattern](../chapter2_HowToMakeMixins/Pattern3_StaticSettings.md).

## Why `static get observedAttributes()`?

Or, why not always trigger an `attributeChangedCallback(...)` for all attributes?

First. When you make a web component, you only need to process changes to a few custom attributes.
If not, you are doing something wrong.

Second. HTML elements often have many attributes, such as `style` and `class`. 
Some of these attributes can change value quite often. So, if all attribute changes 
triggered a JS callback, the browser would have to do lots of unnecessary work.
                                                        
Therefore, the browser is interested in *avoiding* `attributeChangedCallback(...)`
for as many attribute changes as possible. And it skips all attribute changes that is 
not explicitly observed via `static get observedAttributes()`.

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

## When is `attributeChangedCallback(...)` triggered?

`attributeChangedCallback(...)` is triggered immediately, synchronously.
But, as with other [custom element reactions](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-reactions),
`.attributeChangedCallback()` can be 'grouped' and run at the end *within* functions 
that manipulate DOM for several elements at the same time.
Examples of such functions are `.cloneNode`, `.innerHTML` and `.appendChild`/`.removeChild`. 
When these functions run, they affect a whole group of children/elements within a single call.
*Within* such functions, `.attributeChangedCallback()`, `connectedCallback()` etc. for several children
are grouped together.

## Opinion on `attributeChangedCallback(...)` parameter sequence 

There is a minor flaw with the `attributeChangedCallback("name", "newValue", "oldValue")` signature:
`oldValue` is listed before `newValue`. 
`newValue` is commonly needed, while `oldValue` is not.
If `oldValue` had been positioned last, then many `attributeChangedCallback(...)` implementations
could have skipped the `oldValue` argument.
But, what's done is done. Can't put toothpaste back in the tube.

## References
 * MDN on `attributeChangedCallback`
 * MDN on `observedAttributes`