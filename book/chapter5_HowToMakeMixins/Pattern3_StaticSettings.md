# Pattern: StaticSettings

The callback method `.attributeChangedCallback(name, oldValue, newValue)`
is controlled by settings defined by `static get observedAttributes()`.
I call this pattern StaticSettings.

At the heart of the StaticSettings pattern is a static getter method for settings (ie. StaticSetting)
such as `static get observedAttributes()`.
The StaticSetting returns values that a super class can use to guide its actions.
`static` methods in JS are placed with the class prototype object.
Getter methods (`get`) are function properties that you access as if they were data properties.
And so, the complex signature `static get observedAttributes()` basically
defines `observedAttributes` is a universal property for all objects of the class.

## How does StaticSettings work?
The secret behind this pattern is **mixins use StaticSettings** and 
**subclasses can override StaticSettings**.

`this.constructor.staticSettingName` will access a StaticSetting named `staticSettingName`. 
This you typically do in a super class or FunctionalMixin you intend other classes to extend.
To override the same StaticSetting in a subsequent class, define static getter method for `staticSettingName`, 
such as:
```
static get staticSettingName() {
  const defaultSettings = Object.getPrototypeOf(this).staticSettingName;  //[1]
  return Object.assign(defaultSettings, {newSetting: 200});               //[2]
}
```
1. `Object.getPrototypeOf(this).staticSettingName` accesses the (default) settings already defined 
by the mixin or super class. 
In the context of a `static` class method, `this` refers to the prototype (class) object.
To get the super class of this prototype, use `Object.getPrototypeOf(this)`.
2. If the settings is a complex object, it might be wise to not overwrite the default settings completely,
but instead extend it using functions such as `Object.assign`.

The benefit of making the settings static, is that the same settings will then 
be shared by all instances of the element class.
This is both efficient in terms of memory, as the same value will not be multiplied across elements,
and creates a more transparent structure as the developer knows that all instances of an element
will share the same settings.

> ATT!! Do **NOT** change the StaticSetting runtime. 
Mixin developers expect that StaticSettings never change.

## Example: `LongpressSettingsMixin`

When implementing a `longpress` gesture mixin, we might likely need to control:
* how long the button must be pressed, and
* how much the user is allowed to move his finger from start to end.
 
In the example below, I implement a StaticSetting `longpressSettings` in `LongPressMixin`.
I then implement two different subclasses of LongPressMixin: 
`LongPressOne` that uses the default `longpressSettings` and 
`LongPressTwo` that overrides `longpressSettings`.

```javascript
const startListener = Symbol("startListener");
const stopListener = Symbol("stopListener");
const start = Symbol("start");
const stop = Symbol("stop");
const startEvent = Symbol("startEvent");
const settings = Symbol("settings");

const LongPressMixin = function(Base) {
  return class LongPressMixin extends Base {
    
    static get longpressSettings(){                                              //[1]  
      return {minDuration: 1000, maxMovement: 20};
    }
    
    constructor(){
      super();
      this[startListener] = (e) => this[start](e);
      this[stopListener] = (e) => this[stop](e);
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
    [start](e) {
      this.addEventListener("mouseup", this[stopListener]);
      this[startEvent] = e;
    }
    
    [stop](e) {
      this.shadowRoot.removeEventListener("mouseup", this[stopListener]);
      const duration = e.timeStamp - this[startEvent].timeStamp;
      const moveX = e.x - this[startEvent].x;
      const moveY = e.y - this[startEvent].y;
      const distance = Math.sqrt(moveX*moveX + moveY*moveY);
      const settings = this.constructor.longpressSettings;                       //[2]
      if (settings.maxMovement >= distance && settings.minDuration <= duration)  //[3]
        this.dispatchEvent(new CustomEvent("longpress", {bubbles: true, detail: {duration, distance}}));
      this[startEvent] = undefined;
      this[settings] = undefined;
    }
  }
};

class LongPressOne extends LongPressMixin(HTMLElement){                          //[4]
  connectedCallback(){
    super.connectedCallback();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<div style='width: 10px; height: 10px; border: 10px solid red;'></div>"
  }
}

class LongPressTwo extends LongPressMixin(HTMLElement){
  
  static get longpressSettings(){
    const defaultSettings = Object.getPrototypeOf(this).longpressSettings;       //[5]
    return Object.assign(defaultSettings, {minDuration: 200});                   //[6]
    // return {minDuration: 200, maxMovement: 20};
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
A.id = "A";
document.querySelector("body").appendChild(A);
//B needs only 200ms press
const B = new LongPressTwo();
B.id = "B";
document.querySelector("body").appendChild(B);
document.addEventListener("longpress", (e) => console.log(e.path[0].id, e.detail.duration));
```
1. The StaticSetting method is set up in the mixin super class.
This static property defines the default setting values. 
2. The StaticSetting is retrieved as `this.constructor.longpressSettings`.
3. The StaticSetting is then used to control the ReactiveMethod callback and EventRecording.
4. Subclasses that do not override `static get longpressSettings()` uses the default values.
5. To access the default values when you override the StaticSetting in a subclass,
use `Object.getPrototypeOf(this).staticSettingName`.
6. When overriding a super class, you can extend the default values or define all settings directly.

## References
 * [MDN: static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static)