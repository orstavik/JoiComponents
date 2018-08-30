# Pattern: InitialAttributes

## Why HTML attributes?

**HTML attributes are directly accessible from both HTML, CSS and JS**.
In HTML template, HTML attributes can be set in the element start tag.
HTML attributes values can be used to toggle CSS rules.
And in JS `.getAttribute`, `.setAttribute` and `.attributeChangedCallback` 
update and respond to changing attribute values.

But. HTML attributes also has its limitations. HTML attributes are string values only.
You can try to use JSON. But not all objects can be stringified.
And if you store too much or complex JSON data in your HTML attributes, 
your HTML template become obfuscated.
Therefore, data objects that has either *complex structure* or *lots of data*
are often better kept as regular object properties rather than as an HTML attribute.

Still. Regular object properties cannot be directly accessed from neither HTML nor CSS.
So, if you store some part of the state of an HTML element as a regular property,
and that state change needs to be reflected in the view (CSS) or controllable from template (HTML),
then that property must also be mirrored as an HTML attribute.
Such mirroring is inherently problematic, creating redundancy issues and race conditions.
Therefore, if the state marker either needs to be set from HTML template or affect the style, 
then you want that state marker stored as an HTML attribute.

My advice is:
 * store state markers in custom elements as HTML attributes strings by default, and
 * fallback to regular object properties only when you really need to because 
 the data is un-string-able, too big or too complex.

## Problem: No attribute access in `constructor()`

The `constructor()` of `HTMLElement` subclasses is in principle called *before*
the attributes are registered with the element.
Therefore, if we try to get hold of an attribute set in the HTML template in the constructor,
it has no value.
Furthermore, if we try to set an attribute value in the constructor of `HTMLElement` subclasses, 
the browser will throw an error:

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
   1. The attribute value in itself might be informative,
      and to implicitly describe that value as "void" is misleading seen from the outside.
   2. Having the value accessible makes the inner workings of the element simpler.
      The custom element might have states that always would require some version of the state marker set.
      `undefined` might be the state of the attribute, but 
      what the attribute represents internally in the element's code can never be `undefined`.

## Example: A impractical and misleading RainBow
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

## Pattern: InitialAttributes

> Caveat: Most elements do not need this pattern.
> The InitialAttributes pattern is *only* needed when the element needs to:
> 1. set initial attribute values, or
> 2. make initial setup based on initial values.

To get access to an element's attributes during construction, 
we establish a custom lifecycle `initialAttributesCallback()`.
We define `initialAttributesCallback()` as triggered:
 * *only once*
 * as soon as possible *after* the `constructor()`
 * and *before* either `attributeChangedCallback()` or `connectedCallback()`, whichever comes first.
 
A naive implementation of such a callback looks like this:
```javascript
  class SetupElement extends HTMLElement {
    constructor(){
      super();
      this.isSetup = false;
      this._setupTrigger = requestAnimationFrame(()=> this.initialAttributesCallback());
    }
    attributeChangedCallback(name, oldValue, newValue){
      if(!this.isSetup) {
        this.initialAttributesCallback();
        cancelAnimationFrame(this._setupTrigger);
        this._setupTrigger = undefined;
        this.isSetup = true;
      } 
      //do your thing
    }
    connectedCallback(){
      if(!this.isSetup) {
        this.initialAttributesCallback();
        cancelAnimationFrame(this._setupTrigger);
        this._setupTrigger = undefined;
        this.isSetup = true;
      } 
      //do your thing      
    }
    initialAttributesCallback(){
      //setup here
      //for example, populate the shadowDOM based only on initial attribute settings
    }
  }
```
The SetupElement above adds a custom lifecycle callback `initialAttributesCallback()`.
`initialAttributesCallback()` is added to be run in the next `requestAnimationFrame`.
If either `attributeChangedCallback()` or `connectedCallback()` is run before
that time, they will trigger `initialAttributesCallback()`.
A property `isSetup` is used to ensure that setup only runs once. 

## Mixin: `InitialAttributesMixin`

The `initialAttributesCallback()` can also be implemented in a `InitialAttributesMixin`.
The benefit of implementing the callback as a mixin is that it hides the details.
> ATT!! `InitialAttributesMixin` requires calling *both* 
`super.connectedCallback` *and* `super.attributeChangedCallback()` in the custom element.
 
```javascript
const isSet = Symbol("isSet");
const trigger = Symbol("trigger");
export function InitialAttributesMixin(Base){
  return class InitialAttributesMixin extends Base {
    constructor(){
      super();
      this[isSet] = false;
      this[trigger] = requestAnimationFrame(()=> this[isSet] || this.doInit(true));
    }
    attributeChangedCallback(name, oldValue, newValue){
      super.attributeChangedCallback && super.attributeChangedCallback(name, oldValue, newValue);
      this[isSet] || this.doInit();
    }
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      this[isSet] || this.doInit();
    }
    doInit(fromRaf){
      if (!fromRaf) cancelAnimationFrame(this[trigger]);
      this.initialAttributesCallback();
      this[isSet] = true;
    }
  }
}
```

The simple implementation above is good, but it has one drawback.
If one `initialAttributesCallback()`s adds triggers to other `initialAttributesCallback()`s,
the added `initialAttributesCallback()`s will run in the *next* `requestAnimationFrame`.
To solve this issue, a shared que is set up `initialAttributesCallback()` triggers.

```javascript
let que = [];
let active = false;

function runQue(){
  for(let i = 0; i < que.length; i++){
    let el = que[i];
    el[isSet] || (el[isSet] = true, el.initialAttributesCallback());
  }
  que = [];
  active = false;
}

function addToQue(el){
  que.push(el);
  if (active)
    return;
  active = true;
  requestAnimationFrame(runQue);
}

const isSet = Symbol("isSet");
const trigger = Symbol("trigger");
export function InitialAttributesMixin(Base){
  return class InitialAttributesMixin extends Base {
    constructor(){
      super();
      this[isSet] = false;
      addToQue(this);
    }
    attributeChangedCallback(name, oldValue, newValue){
      super.attributeChangedCallback && super.attributeChangedCallback(name, oldValue, newValue);
      this[isSet] || (this[isSet] = true, this.initialAttributesCallback());
    }
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      this[isSet] || (this[isSet] = true, this.initialAttributesCallback());
    }
  }
}```

## Example: `RainBow` with `InitialAttributesMixin`

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

  class RainBow extends InitialAttributesMixin(HTMLElement) {

    static get observedAttributes(){
      return ["colors"];
    }

    constructor(){
      super();
      this.attachShadow({mode: "open"});
    }

    initialAttributesCallback(){
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
        this.initialAttributesCallback(); 
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

