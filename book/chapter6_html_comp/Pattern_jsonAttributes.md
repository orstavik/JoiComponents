# Pattern: JSONAttributes

All attributes in HTML elements are `strings`. 
So. What do you do if you need to pass a boolean, number, array or object value via an attribute?
Use JSON.

HTML attribute values are always `strings`. So when passing data *into* or *out of* an HTML element as an attribute,
 as an attribute, you should try to comply with the guidelines of the platform.
The platform expects that HTML attributes have `string` values. Data in other formats should be passed into the 
HTML element using JS (such as setter-methods on the HTML element) if they are passed often (due to efficiency) 
or very complex (due to complexity). Therefore, try first to use `string` values with HTML attributes,
and use JSON parsing only when data passed in is a) simple and small, b) truly needed in another 
format than `string` (such as arithmetic operations on `number` or multiple values as an `array`), and 
c) are rarely changed in the running app.


## Example AndOne
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

