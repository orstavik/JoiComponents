# Pattern StaticSettings

The native function `static get observedAttributes()` that is used to control the
native function `.attributeChangedCallback(name, oldValue, newValue)` is simpler than it might seem.
`static get observedAttributes()` simply provides a function that every element can choose to
override if they want. But to see it in action, we need an example:

## Example DoubleAgent

In this example, we have two classes: `JamesBond` and `TheGirl` that extends `JamesBond`.
`JamesBond` has a method `myNameIs()` that prints a name to the console.
`JamesBond` also has a static getter method `name`.
`TheGirl` only overrides the static getter method `name`, and not `writeMyName()`.

```javascript
class JamesBond {
  
  static get name(){                //[1]  
    return "Bond, James Bond";
  }
  writeMyName(){
    console.log(this.name);         //[2]
  }
}

class TheGirl extends JamesBond {
  
  static get name(){                //[3]        
    return "Miss Moneypenny";
  }
}

const agent007 = new JamesBond();
agent007.writeMyName();             //[4] //Bond, James Bond
const badGuy = new JamesBond();
badGuy.name = "Goldfinger";         
badGuy.writeMyName();               //[5] //Goldfinger
const plusOne = new TheGirl();
plusOne.writeMyName();              //[6] //Miss Moneypenny
```
1. 
2.
3.
4.
5.
6.                               

## Example: `LongpressSettingsMixin`

When implementing a `longpress` gesture mixin, 
we likely need to adjust the settings for:
* how long the button must be pressed, and
* how much the user might move his finger before he cancels the press.
 
```javascript
const startListener = Symbol("startListener");
const stopListener = Symbol("stopListener");
const start = Symbol("start");
const stop = Symbol("stop");
const startEvent = Symbol("startEvent");
const settings = Symbol("settings");

const LongPressMixin = function(Base) {
  return class LongPressMixin extends Base {
    
    static get longpressSettings(){                //[1]  
      return {minDuration: 1000, maxMovement: 20};
    }
    
    constructor(){
      super();
      this[startListener] = (e) => this[start];
      this[stopListener] = (e) => this[stop];
      this[startEvent] = undefined;
    }
    
    connectedCallback(){
      if (super.connectedCallback) super.connectedCallback();
      this.addEventListener("mousedown", this[startListener]);
    }
    
    disconnectedCallback(){
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.removeEventListener("mousedown", this[startListener]);
    }
    
    this[start](e){
      this.addEventListener("mouseup", this[stopListener]);
      this[startEvent] = e;
      this[settings] = this.longpressSettings();
    }                                                                  
    
    this[stop](e){
      this.removeEventListener("mouseup", this[stopListener]);
      const duration = e.timeStamp - this[startEvent].timeStamp;
      const moveX = e.x - this[startEvent].x;
      const moveY = e.y - this[startEvent].y;
      const distance = Math.sqrt(moveX*moveX + moveY*moveY);
      if (this[settings].maxMovement >= distance && this[settings].minDuration <= duration)  //[2]
        this.dispatchEvent(new CustomEvent("longpress", {bubbles: true, detail: {duration, distance}}));
      this[startEvent] = undefined;
      this[settings] = undefined;
    }
  }
};

class LongPressOne extends LongPressMixin(HTMLElement){
  connectedCallback(){
    super.connectedCallback();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<div style='width: 10px; height: 10px; border: 10px solid red;'></div>"
  }
}

class LongPressTwo extends LongPressMixin(HTMLElement){
  
  static get longpressSettings(){
    return Object.assign(super.longpressSettings(), {minDuration: 2000});
  }
  
  connectedCallback(){
    super.connectedCallback();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<div style='width: 10px; height: 10px; border: 10px solid blue;'></div>"
  }
  
}

customElements.define("long-press-one", LongPressOne);
customElements.define("long-press-two", LongPressTwo);

//A needs 1000ms press
const A = new LongPressOne();
one.addEventListener("longpress", () => console.log("one"));

//B needs 2000ms press
const B = new LongPressTwo();

//C needs 3000ms press, and A still needs 1000ms press
const C = new LongPressOne();
C.longpressSettings = {minDuration: 3000, maxMovement: 20};

//D changes the LongPressOne prototype, so now A, C and D all need a 4000ms press
//don't do this..
const D = new LongPressOne();
D.__proto__.longpressSettings = function(){
  return {minDuration: 3000, maxMovement: 20};
};
```
1. 
2.
3.
4.
5.
6.

## how to use it?
why use static?
because most of your elements likely use the same settings. so you don't need to add all the extra stuff in all your objects.
BUT!! You can use non static overrides on each individual element. Both works

use it to set settings that your mixin needs.
these settings can then be used as default value, as a per element type value, and also, if you really need, per element value.


## Why `static get observedAttributes()`?
When you make a custom element, you most often need only observe a few custom attributes.
But, HTML elements has many attributes. Some of these attributes such as `style` 
can change value quite often. So, if all attribute changes of custom elements 
would trigger a JS callback, the browser would slow down.
                                                        
Therefore, the browser is interested in *avoiding* `attributeChangedCallback(...)`
for all the attribute changes which the custom element do not care about. 
By making the developer specify which attributes should 
trigger `attributeChangedCallback` in `static get observedAttributes()`,
the browser can *ignore* all changes to other attributes.

`static get observedAttributes()` is attached to the custom element prototype and 
applies equally to all instances of the element.
`static get observedAttributes()` returns an array of strings which represents 
a list of the attribute names to be observed.

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

## TODO explain the pattern behind static get observedAttributes() ?? 
how it can be used inside a functional mixin.
how it can be overridden both statically and in each individual object.

## References
 * MDN on `attributeChangedCallback`
 * MDN on `observedAttributes`