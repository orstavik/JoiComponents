# Introduction: native lifecycle hooks

An HTML element has five native *lifecycle* callback methods:
`constructor()`, `connectedCallback()`, `disconnectedCallback()`, 
`adoptedCallback()`, and `attributeChangedCallback()`.

This book will categorize such callbacks in two different categories:
normal "lifecycle callbacks" and "event callbacks".

The normal lifecycle callback methods are `constructor()`, 
`connectedCallback()`, and `disconnectedCallback()`.
These lifecycle callback methods:
1. must be triggered during the life of an element that gets connected to the DOM, and
2. are triggered in a particular sequence:
   1. `constructor()`
   2. `connectedCallback()`
   3. `disconnectedCallback()`
   * can repeat 2. then 3. if desired.
                                             
Event callbacks, `attributeChangedCallback()` and `adoptedCallback()`, occur:
1. *when* an element is connected to the DOM,
2. in no particular order.
                                             
In later chapters, *one* extra lifecycle callback `firstConnectedCallback()` will be added, 
and *several* extra event callbacks such as `slotchangedCallback()`, `resizeCallback()`, `enterViewCallback()` and 
and several gesture (composed event) callbacks.

## `constructor()`

The `constructor()` runs every time an HTML element is created (or upgraded, see below).
Normally, a custom element `constructor()` should do this:

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();                                                       //[1]
    this.attachShadow({mode: "open"});                             //[2]
    this.shadowRoot.innerHTML = "hello <slot></slot>";
    this._onClick = this._clickTrigger.bind(this);                 //[3]
    this.getAttribute("active") || this.setAttribute("active", "");//[4]
  }
  
  _clickTrigger(e){
    this.shadowRoot.appendChild(document.createElement("hr"));
  }
}
```
1. call `super()`.
The `constructor()` of the HTMLElement set up fundamental resources, 
for example the `.classList` property.
2. attach and set up a `.shadowRoot`.
3. set up "event-listener-closures".
A closure is a function object that can have bound `this` object and bound arguments.
In custom elements the *same* event-listener-closures needs be *added* in 
`connectedCallback()` and *removed* in `disconnectedCallback()`.
In custom elements event listeners almost always to access properties and methods on the
particular custom element, ie. the event-listener-closures needs to bind `this` to the custom element.
To set up event-listener-closures in the constructor() is both the cleanest and most efficient way
to do so.
4. set up default attributes of the host element.

In the `constructor()` you do *not* have access to the DOM surrounding the `host` element.
You do neither know where the custom element will be connected, if ever connected.
Therefore, the general rule to *NOT* query or manipulate the DOM is especially true
in the `constructor()`.

### `.firstConnectedCallback()` as an alternative to `constructor()`.
Sometimes, custom elements can be set up in HTML templates or other structures 
that are not immediately connected to the DOM.
On such occasions, to run complex set up routines for several components might slow down
other processes in the browser such as rendering the first impression.
If this is the case, you want to delay the set up of the element until `.firstConnectedCallback()`.
See [FirstConnectedMixin](Mixin4_FirstConnectedMixin.md) for more details.
Most often, the entire body of the `constructor()` can then be moved into `.firstConnectedCallback()`,
and you can skip the `constructor()` entirely. 

The Polymer project advocates consistent use of a `.firstConnectedCallback()` equivalent 
called `.ready()`. I'm not sure as to what I personally think about that.
On the one hand, all your custom elements can be used by frameworks and settings where their
`constructor()` methods *should* be delayed.
However, consistently replacing the well-known, native and generic `constructor()` with 
a largely unknown, non-native, and DOM-particular `.firstConnectedCallback()` or `.ready()`
is not good. In most web apps, and in the best practice advocated in this book, 
the performance benefit of `.firstConnectedCallback()` is rarely needed and therefore rarely employed.

## `connectedCallback()` and `disconnectedCallback()`

`connectedCallback()` and `disconnectedCallback()` is called when the custom element
is connected and disconnected to the active DOM.
While the `constructor()` (or `.firstConnectedCallback()`) *creates* the content of a 
custom element,
`connectedCallback()` *activates* said content. Most often, this means to:
* add event-listener-closures to either `this` or `window` 
(depending on which event is observed), and/or 
* activating `Observer` or plain function callbacks on other objects.
The `disconnectedCallback()` reverses and cleans up the actions performed in `connectedCallback()`. 

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();                                                       
    this.attachShadow({mode: "open"});                             
    this.shadowRoot.innerHTML = "hello <slot></slot>";
    this._onClick = this._clickTrigger.bind(this);                 
    this.getAttribute("active") || this.setAttribute("active", "");
  }
  
  connectedCallback(){                                             
    this.addEventListener("click", this._onClick);                 //[1]
  }
  disconnectedCallback(){
    this.removeEventListener("click", this._onClick);              //[2]
  }

  _clickTrigger(e){
    this.shadowRoot.appendChild(document.createElement("hr"));
  }
}
```
1. The event listener `this._onClick` is activated.
2. The event listener `this._onClick` is deactivated.

## `adoptedCallback()`
`adoptedCallback()` is triggered when a custom element is transplanted *into* a new document.
This is a highly specialized use-case. In fact, I cannot imagine *when* it would be better to
*move* a complete DOM branch between shadowDOM and/or a shadowDOM and the top level.
Generally, I would therefore encourage developers *not* to employ such a pattern in their code
and therefore *not* to use rely on this lifecycle callback.

But, I love to be wrong. So if you can share a simple use-case in which such transference of 
custom elements *already and needed to be* attached to one DOM is *needed to be and attached* 
to another DOM, please let me know!

### Example: UpgradeMe

When making and using custom elements, you can use a custom element in your HTML template 
before the class definition of the custom element has been loaded.
Here is an example:

```html
<html>
  <body>
    <upgrade-me id="one">world</upgrade-me>                       <!--[1]-->
    <script>
      const div = document.createElement("div");
      div.innerHTML = "<upgrade-me id='too'>sunshine</upgrade-me>"; //[2]
      document.querySelector("body").appendChild(div);
    
      const one = document.querySelector("upgrade-me#one");
      const two = document.querySelector("upgrade-me#too");

      console.log("typeof upgrade-me#one: " + typeof one);          //[3]
      console.log("typeof upgrade-me#too: " + typeof too);          
      
      class UpgradeMe extends HTMLElement{
        constructor(){
          super();
          this.attachShadow({mode: "open"});
          this.shadowRoot.innerHTML = "hello <slot></slot>";
        }
      }
      customElements.define("upgrade-me", UpgradeMe);               //[4]
                                                                    //[5]
      console.log("typeof upgrade-me#one: " + typeof one);          //[6] 
      console.log("typeof upgrade-me#too: " + typeof too);          
    </script>
  </body>
</html>
```
1. The `<upgrade-me id="one">` element is used in the HTML template.
2. The `<upgrade-me id="too">` element is used inside `.innerHTML`.
3. *Before* the class definition is loaded, both `<upgrade-me>` elements
are typeof `HTMLUnknownElement`.
4. The `upgrade-me` tag is registered to the `UpgradeMe` class in `customElements`.
5. When the element is registered, 
the `upgrade` process is run on all the elements of that type in the DOM.
The `upgrade` will run the `constructor()` function of the custom element 
*on the already instantiated object and "upgrade" it.*
6. *After* the `upgrade` has run, the class of custom element objects
change from `HTMLUnknownElement` to `UpgradeMe`.
ATT!! In the polyfill the upgrade process will change the content of the custom element
(here: add the shadowDOM with "hello <slot>"), but *not* change the class of the custom element.

## References
 * [MDN: Using custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)