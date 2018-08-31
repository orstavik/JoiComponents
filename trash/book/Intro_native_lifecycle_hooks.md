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
                                             
Later I will add *one* extra lifecycle callback: `firstConnectedCallback()`. 
Then, in the next chapter, I will also add *several* extra event callbacks such 
as `slotchangedCallback()`, `resizeCallback()`, `enterViewCallback()` and numerous gesture callbacks.

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
    //this.getAttribute("nono") || this.setAttribute("nono", "");  //[4]
    //const nonono = document.querySelector("#context");           //[5]
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
4. *NO* attributes should be added in the constructor. See `.firstConnectedCallback()`. 
5. In the `constructor()` you do *not* have access to the DOM surrounding the `host` element.
In the `constructor()` the element is *not connected*.
Therefore, the general rule to *NOT REACH INTO THE DOM* is especially true in the `constructor()`.

## `connectedCallback()` and `disconnectedCallback()`

`connectedCallback()` and `disconnectedCallback()` is called when the custom element
is connected and disconnected to the active DOM.
While the `constructor()` *sets up* the content of a custom element,
`connectedCallback()` *activates* said content. Most often, this means to:
* add event-listener-closures to either `this` or `window` 
(depending on which event is observed), and/or 
* activating `Observer` or plain function callbacks on other objects.

`disconnectedCallback()` reverses and cleans up the actions performed in `connectedCallback()`.

However, as hinted at in the example above, attributes cannot be set up in the `constructor()`.
The platform therefore anticipates that attributes are set up in `connectedCallback()`.

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();                                                       
    this.attachShadow({mode: "open"});                             
    this.shadowRoot.innerHTML = "hello <slot></slot>";
    this._onClick = this._clickTrigger.bind(this);                 
  }
  
  connectedCallback(){                                             
    this.addEventListener("click", this._onClick);                 //[1]
    this.getAttribute("active") || this.setAttribute("active", "");//[2]
  }
  disconnectedCallback(){
    this.removeEventListener("click", this._onClick);              //[3]
  }

  _clickTrigger(e){
    this.shadowRoot.appendChild(document.createElement("hr"));
  }
}
```
1. The event listener `this._onClick` is activated while connected.
2. The attribute `active` is given a default value if not previously set. See below for more details.
3. The event listener `this._onClick` is deactivated while disconnected.

### Avoid overwriting start-tag-attributes?
When you declare an HTML element in an HTML document (or in a string passed to `.innerHTML`),
you can also set one or more attributes with string values in that element start tag.
```html
<my-element start-tag-attribute="This value is specified by the author in the start tag"></my-element>
```
These start-tag-attributes will be set up in the element as part of the HTMLElement constructor 
(the `super()` in a custom element's `constructor()`).

When you declare a custom element, you want to make sure that you do not overwrite any 
start-tag-attributes on your custom element instances. 
If you do so inadvertently, the users (the html authors using your element) cannot 
explicitly define these attributes.
To avoid overwriting such start-tag-attributes when giving attributes a default value at set up, 
you must check if the attribute already exists *before* giving it a default value.
```javascript
this.hasAttribute("one") || this.setAttribute("one", "default value");  
```
                              
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
At the time when the parser first encounters this tag, the `<upgrade-me>` tag is unknown to the browser.
The browser therefore instantiates the element as an HTMLUnknownElement.
2. The `<upgrade-me id="too">` element is used inside `.innerHTML`.
The `<upgrade-me>` tag is still unknown to the browser.
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
 * [Do not to override page author](https://developers.google.com/web/fundamentals/web-components/best-practices#dont-override)

<!--
## custom element upgrade

The `HTMLElement.constructor()` is a little tricky. 
When the browser parses an HTML document, it can encounter custom element tags that it does not yet know.
These custom elements might be defined later when the browser has loaded a particular script,
or not defined at all because the developer has forgotten to include a definition of it.
In any case, the browser will when it encounters an HTML tag for a custom element it does not yet know,
create a HTMLUnkownElement object for that tag that it will handle later.

However, even though the browser cannot do much with the HTMLUnkownElement object,
it can and will populate it with any attributes it finds in the tag.
And the browser will also display it using the CSS rules it has for that tag.
Then, when the browser has loaded the definition for that tag via `customElements.define`,
it will then so-called `upgrade` the custom element.
The `upgrade` of custom elements is a special process in browsers for just this situation,
where the browser has instantiated and added a custom element to the DOM *before* it has its definition.
In the `upgrade` process the browser takes the existing object and then calls its now discovered 
`constructor()` and its `connectedCallback()` *after* the browser has already instantiated 
the element *and* added that element to the DOM.

The developer rarely notices this upgrade process; 
most often it is as if the element was constructed and connected to the DOM normally.
But, when it comes to attributes and attribute values, 
the developer should take care not over-write attributes already defined and added to the `host` node. 
-->