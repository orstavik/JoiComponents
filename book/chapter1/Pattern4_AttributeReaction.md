## Pattern 6: Attribute changes
ATT!! This is an unfinished pattern.

### Why use attributes instead of properties?
Adding properties to a custom element has other benefits, such as allowing different simple types 
(boolean, numbers) and other more complex types (arrays and objects).
But, despite being limited to string values,
attributes has the benefit over properties that it can be written/read in both HTML, CSS, and JS.
In fact, it is only attributes and child elements that are used both in HTML, CSS, and JS to control
one and the same custom element directly.
So, in order for a JS property to be accessed in HTML (viewed in dev tools for example) or CSS 
(control styles), it has to be translated into an attribute.

Thus, if a custom element needs to use an internal state to coordinate behavior across both 
HTML, CSS and JS, you should set this internal state using one or more attributes.
As such, attributes (and child elements) provide the only vehicle to set an internal 
state of an HTML element that is globally available to both HTML, CSS, and JS.

### How to react to attribute changes?
To respond to changes in its attributes, HTMLElement includes two methods: 
`static get observedAttributes` and `attributeChangedCallback(name, oldValue, newValue)`.
The first method `observedAttributes` is static, placed as a method on the prototype, and 
therefore applies equally to all instances of the element.
`observedAttributes` identifies the name of the attributes this element intends to react to.
The second method `attributeChangedCallback` is the method that will respond whenever an 
attribute listed in `observedAttributes` changes. 

(Be aware that the same method is called for 
all attributes, so that you must check the value of `ǹame` when processing the changes.
However, if you only observe one attribute, the `if(name === "one")`-check can be skipped.

1. 
```
static get observedAttributes(){ 
  return ["one","two"];                         
}
```
2. 
```
attributeChangedCallback(name, oldValue, newValue){ 
  if(name === "one") {
    ... 
  } elseif (name === "two"){
    ...
  }
}
```

### How to process attributes that are not strings?
All attributes in HTML elements are by default `strings`. 
However, often you wish to pass other values such as booleans, numbers, arrays and objects as attributes.
To accomplish this, use JSON.

#### Example AndOne
```
class AndOne extends HTMLElement {
  
  static get observedAttributes(){ 
    return ["number"];                         
  }
  
  constructor(){
    this.attachShadow(mode: "open"); 
  }
                                      
  attributeChangedCallback(name, oldValue, newValue){ 
    if(name === "number") {                             //this check can be skipped
      const trueNumber = JSON.parse(newValue);
      this.shadowRoot.innerText = trueNumber + 1;
    }
  }
}
customElements.define("and-one", AndOne);
```

Use it like this:
```html
<and-one number="5"></and-one>
```
which will display:
```html
6
```
Warning! When passing data *into* an HTML element, you should try to comply with the guidelines of the platform.
The platform expects that HTML attributes have `string` values. Data in other formats should be passed into the 
HTML element using JS (such as setter-methods on the HTML element) if they are passed often (due to efficiency) 
or very complex (due to complexity). Therefore, try first to use `string` values with HTML attributes,
and use JSON parsing only when data passed in is a) simple and small, b) truly needed in another 
format than `string` (such as arithmetic operations on `number` or multiple values as an `array`), and 
c) are rarely changed in the running app.

### How to support boolean attributes (with `false` value)?
Often, you want an attribute to be boolean: either an element has that attribute or it does not.
This is particularly useful for turning on and off a particular CSS rule. 

To make a `switch` attribute function as such a boolean switch, 
from JS you would simply set an empty string value to
toggle the attribute on and then remove the attribute to turn it off.
```
myElement1.setAttribute("switch", "");
myElement1.removeAttribute("switch");
```
In plain HTML you could make two elements with the attribute on and off like this:
```html
<my-element switch>on</my-element>
<my-element>off</my-element>
```
And then to style the element differently, in your CSS rules could write this:
```css
my-element {            /*off*/
  background: red;
} 
my-element[switch] {    /*on*/
  background: green;
} 
```
And then proper template engines such as lit-html or hyperHTML have set up proper mechanisms to handle use such as:

```javascript
let onOrOff = false;
hyper.wire`<my-element switch="${onOrOff}">on</my-element>`;
```
However, confusion can arise if users use a template engine (such as `.innerHTML`) that does not 
automatically handle boolean attributes with your element. In such cases, the attribute switch would 
equal the string "false", which if tested in JS (!!"false") would return true. To support such a conflict
would be possible, if undesireable. Here is an example:
 
```javascript
class MyElement extends HTMLElement {
  
  static get observedAttributes(){ 
    return ["onOrOff"];                         
  }
  
  constructor(){
    super();
    this.attachShadow({mode: "open"}); 
  }
  
  attributeChangedCallback(name, oldValue, newValue){ 
    if(name === "onOrOff") {                             
      const boolOnOrOff = JSON.parse(newValue);
      if (boolOnOrOff === "false") {                //1. the attribute is improperly removed 
        return this.removeAttribute("on-or-off");
      } else if (boolOnOrOff === null) {            //2. the attribute is properly removed
        //do stuff if the attribute is not there
      } else {                                      //3. the attribute is set
        //do stuff if the attribute is there
      }
    }
  }
}
customElements.define("my-element", MyElement);
```
And then the element is used like this:
```javascript
class SomeOtherUsingElement extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback(){
    const aSetting = this.getAttribute("setting");
    this.innerHTML = `<my-element on-or-off="${!!aSetting}">on</my-element>`;       //a. incorrect
    this.innerHTML = `<my-element ${!!aSetting ? "on-or-off" : ""}>on</my-element>`;//b. correct
  }
                                                                        
}
customElements.define("another-element", SomeOtherUsingElement);
```
To support incorrect (a) use of primitive template engines such as `.innerHTML`, the 3 choice structure
depicted in `MyElement.attributeChangedCallback()` is needed. But, it is better to use the correct 
manner to set/unset the attribute as depicted (b).

### How to avoid overwriting user-defined attributes?
Attributes on HTML elements can be set at many different times in an elements lifecycle:
1. at creation-time (HTML template by the page author, *not* js `constructor()` [cf. mixin 4 firstConnectedCallback](../chapter2/Mixin4_FirstConnectedMixin.md)),
2. at connection-time (js `connectedCallback()`), or
3. at run-time (js dynamically changed from inside or outside the element).

Attributes should be able to be set by page authors, ie. by users of the element in their HTML template code.
But, if the author of the element then directly sets the value of an attribute at `connectedCallback()`-time,
then the users value will always be overwritten. Therefore, all attributes should be checked for
page-author value (1) when they are set at `connectedCallback()` (2). Like this:
```javascript
if(!this.hasAttribute("someSetting"))                 //ie. set by page-author
  this.setAttribute("someSetting", "default value");  //default value set at connection-time.
```
                              
#### References
* [Do not to override page author](https://developers.google.com/web/fundamentals/web-components/best-practices#dont-override)

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