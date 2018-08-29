# Pattern: `setupCallback()`

## Why HTML attributes?

HTML attributes can be *accessed directly from both HTML, CSS and JS*.
In HTML template, HTML attributes can be set in the element start tag.
HTML attributes values can be used to toggle CSS rules.
And in JS `.getAttribute`, `.setAttribute` and `.attributeChangedCallback` 
update and respond to changing attribute values.

Sure, HTML attributes has its limitations. HTML attributes are string values only.
You can try to use JSON. But not all objects can be stringified.
And if you store too much or complex JSON data in your HTML attributes, 
your HTML template become obfuscated.
Therefore, data objects that either has a complex structure or lots of content
are often better kept as regular JS object properties rather than as an HTML attribute.

But still. Regular object properties cannot be directly accessed from neither HTML nor CSS.
So, if you store some part of the state of an HTML element as a regular property,
then if that state change needs to be reflected in the view (CSS) or controllable in HTML template,
then that property must also be reflected as an HTML attribute.
So if the state marker potentially might need to be controlled (set) from HTML template or be
reflected in the style, then you want that state marker stored as an HTML attribute.

My advice is:
 * store state markers in custom elements as HTML attributes by default
 * use object properties when the data is either too big or too complex to be stored as text.

## Problem: No attribute access in `constructor()`

The `constructor()` of `HTMLElement` subclasses is in principle called *before*
the attributes are registered with the element.
Therefore, if we try to get hold of an attribute set in the HTML template in the constructor,
it has no value.
Additionally, if we try to set an attribute value in the constructor 
of `HTMLElement` subclasses, the browser will throw an error:

```html
<script>
  class AttributeConstructor extends HTMLElement {
    constructor(){
      super();
      console.log(this.getAttribute("one"));          //will print nothing     
      console.log(this.setAttribute("two", "fails!"));//will cause the browser to throw an Error
    }
  }
  customElements.define("att-con", AttributeConstructor);            
</script>
                                                     
<att-con one="B"></att-con>                     
```

The browser has a normative reason for this behavior.
The "default" value of all HTML attributes' is: not set (`null`).
Hence, when you create an element, you "should" create that element with all attributes unset.
By extension, HTML attribute values on an element signify either:
 * a setting from the element tag in html,
 * a setting from JS code when the element was created, 
 * a response due to user or system actions around the element, or
 * a contextual role such as a first-child that is selected by default.
 
But.. That's *a* principle. With a couple of problems:

1. Practical concerns may deviate from this pattern.
Setting attributes on an element can cause substantial changes to an elements composition.
And if you expect your user to add attributes to your element when it is constructed in template,
which is perfectly normal, 
you would like to have access to those attributes *before* you setup your element for the first time.

2. Sometimes, it is a better principle to "fill in" a default attribute value, and let the user
override that value if they want.
The value in itself might be descriptive and to describe it as "void" seen from the outside is misleading.
And having the value accessible makes the inner workings of the element simpler.

The `RainBow` example below illustrate the need for both the conditions above.

```html
<script>
  function getColor(c){
    switch(c){
      case "r": return "red";
      case "o": return "orange";
      case "y": return "yellow";
      case "g": return "green";
      case "b": return "blue";
      case "i": return "indigo";
      case "v": return "violet";
    }
  }
  
  class RainBow extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.colors = "roygbiv";
      this.drawCircles();
    }
    drawCircles(){
      let res = "-";
      for (let c of this.colors.split("").reverse()){
        res = "<div style='border-color: "+getColor(c)+";'>"+res+"</div>";
      }
      this.shadowRoot.innerHTML = 
        "<style>div {border-radius: 50%; border: 5px solid white; display: inline-block}</style>" + res;
    }
    static get observedAttributes(){
      return ["colors"];
    }
    attributeChangedCallback(name, oldValue, newValue){
      if (name === "colors"){
        this.colors = newValue;
        this.drawCircles(); 
      }
    } 
  }
  customElements.define("rain-bow", RainBow);            
</script>
                                                     
<rain-bow></rain-bow>                     
<rain-bow colors="ggr"></rain-bow>
```

## Pattern: `setupCallback()`

> Caveat: This pattern is only needed if we want to set default attribute values, or 
> if changes to an elements attributes causes heavy changes to the elements composition.
> If none of these conditions are fulfilled, you do not need a `setupCallback()`.

To get access to an element's attributes during setup, we establish a custom lifecycle `setupCallback()`.
We define that `setupCallback()` is triggered:
 * only once
 * as soon as possible *after* `constructor()`
 * and *before* both `attributeChangedCallback()` or `connectedCallback()`, whichever comes first.
 
A simple implementation of such a callback looks like this:
```javascript
  class SetupElement extends HTMLElement {
    constructor(){
      super();
      this.isSetup = false;
      this._setupTrigger = requestAnimationFrame(()=> this.setupCallback());
    }
    attributeChangedCallback(name, oldValue, newValue){
      if(!this.isSetup) {
        this.setupCallback();
        cancelAnimationFrame(this._setupTrigger);
        this._setupTrigger = undefined;
        this.isSetup = true;
      } 
      //do your thing
    }
    connectedCallback(){
      if(!this.isSetup) {
        this.setupCallback();
        cancelAnimationFrame(this._setupTrigger);
        this._setupTrigger = undefined;
        this.isSetup = true;
      } 
      //do your thing      
    }
    setupCallback(){
      //setup here
    }
  }
```
The SetupElement above adds a custom lifecycle callback `setupCallback()`.
`setupCallback()` is added to be run in the next `requestAnimationFrame`.
If either `attributeChangedCallback()` or `connectedCallback()` is run before
that time, they will trigger `setupCallback()`.
A property `isSetup` is used to ensure that setup only runs once. 

## Mixin: `SetupMixin`

The `setupCallback()` can also be implemented in a `SetupMixin`.
The `SetupMixin` can hide many of the details and also run a single que 
for the `setupCallback()`s, 
so that if elements are constructed from within a `requestAnimationFrame` they 
are not postponed until the next frame:

> Att!! This Mixin requires calling *both* 
> `super.connectedCallback` *and* `super.attributeChangedCallback()`.

```javascript
let raf = 0;
function runQue(){
  while (toBeSetup.length){
    let el = toBeSetup.shift();
    el.setupCallback();
    el[isSet] = true;      
  }
  raf = 0;
}

const toBeSetup = [];
function addToQue(el) {
  toBeSetup.push(el);
  raf || (raf = requestAnimationFrame(runQue));
}
function runEarly(el){
  el.setupCallback();
  el[isSet] = true;      
  const index = toBeSetup.indexOf(el);
  if (index > -1)
    toBeSetup.splice(index, 1);
}

const isSet = Symbol("isSet");
function SetupMixin(Base){
  return class SetupMixin extends Base {
    constructor(){
      super();
      this[isSet] = false;
      addToQue(this);
    }
    attributeChangedCallback(name, oldValue, newValue){
      super.attributeChangedCallback && super.attributeChangedCallback(name, oldValue, newValue); 
      this[isSet] || runEarly(this)();
    }
    connectedCallback(){
      super.connectedCallback && super.connectedCallback(); 
      this[isSet] || runEarly(this)();
    }
  }
}
```

## Example: `RainBow` with `SetupMixin`

```html
<script>
  function getColor(c){
    switch(c){
      case "r": return "red";
      case "o": return "orange";
      case "y": return "yellow";
      case "g": return "green";
      case "b": return "blue";
      case "i": return "indigo";
      case "v": return "violet";
    }
  }

  class RainBow extends SetupMixin(HTMLElement) {

    static get observedAttributes(){
      return ["colors"];
    }

    constructor(){
      super();
      this.attachShadow({mode: "open"});
    }

    setupCallback(){
      this.hasAttribute("colors") || this.setAttribute("colors", "roygbiv");
      let res = "-";
      for (let c of this.getAttribute("colors").split("").reverse()){
        res = "<div style='border-color: "+getColor(c)+";'>"+res+"</div>";
      }
      this.shadowRoot.innerHTML = 
        "<style>div {border-radius: 50%; border: 5px solid white; display: inline-block}</style>" + res;      
    }

    attributeChangedCallback(name, oldValue, newValue){
      super.attributeChangedCallback(name, oldValue, newValue); 
      if (name === "colors") 
        this.setupCallback(); 
    } 

//    connectedCallback(){
//      super.connectedCallback(); 
//    } 

  }
  customElements.define("rain-bow", RainBow);            
</script>
                                                     
<rain-bow></rain-bow>                     
<rain-bow colors="ggr"></rain-bow>

```

