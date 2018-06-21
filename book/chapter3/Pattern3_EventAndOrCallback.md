# Pattern EventAndOrCallback

When working with mixins for gestures, 
some elements need to react to events occuring directly themselves,
some need to dispatch a custom event for those gestures,
and some need to both react and dispatch events.

To implement this feature we need a StaticSetting and a triggerFunction.
The naming convention for the static getter method is the gesture name + EventAndOrCallback,
such as `longpressEventAndOrCallback`.
Another method `eventAndOrCallback(eventName, detail)` is added to the mixin and 
called whenever the event and/or callback needs to be triggered.

```javascript
/**
* @returns 0 => callback and event, -1 => callback only, 1 => event only
*/
static get longpressEventAndOrCallback(){
  return 0;
}

[eventAndOrCallback](eventName, detail) {
  if (this[activeEventOrCallback] <= 0) {
    let cbName = eventName + "Callback";
    this[cbName] && this[cbName](detail);
  }
  if (this[activeEventOrCallback] >= 0)
    this.dispatchEvent(new CustomEvent(eventName, {bubbles: true, detail}));
}
```

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
const eventAndOrCallback = Symbol("eventAndOrCallback");
const startEvent = Symbol("startEvent");
const settings = Symbol("settings");

const LongPressMixin = function(Base) {
  return class LongPressMixin extends Base {
    
    static get longpressEventAndOrCallback(){
      return 0;
    }

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
        this[eventAndOrCallback]("longpress", {duration, distance});
      this[startEvent] = undefined;
      this[settings] = undefined;
    }
    [eventAndOrCallback](eventName, detail) {
      if (this[activeEventOrCallback] <= 0) {
        let cbName = eventName + "Callback";
        this[cbName] && this[cbName](detail);
      }
      if (this[activeEventOrCallback] >= 0)
        this.dispatchEvent(new CustomEvent(eventName, {bubbles: true, detail}));
    }
  }
};

class LongPressEvent extends LongPressMixin(HTMLElement){
  
  static get longpressEventAndOrCallback(){
    return 1;
  }

  connectedCallback(){
    super.connectedCallback();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<div style='width: 10px; height: 10px; border: 10px solid red;'></div>"
  }
}

class LongPressCB extends LongPressMixin(HTMLElement){

  static get longpressEventAndOrCallback(){
    return -1;
  }

  connectedCallback(){
    super.connectedCallback();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<div style='width: 10px; height: 10px; border: 10px solid green;'></div>"
  }
  
  longpressCallback(detail){
    console.log("LongPressCB.longpressCallback: ", detail);
  }
}

class LongPressEventAndCB extends LongPressMixin(HTMLElement){

  // static get longpressEventAndOrCallback(){      //This is not necessary as it is already implemented as default by LongPressMixin
  //   return 0;
  // }

  connectedCallback(){
    super.connectedCallback();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<div style='width: 10px; height: 10px; border: 10px solid blue;'></div>"
  }

  longpressCallback(detail){
    console.log("LongPressEventAndCB.longpressCallback: ", detail);
  }
}                                                                                                

customElements.define("long-press-event", LongPressEvent);
customElements.define("long-press-cb", LongPressCB);
customElements.define("long-press-event-cb", LongPressEventAndCB);

const A = new LongPressEvent();
const B = new LongPressCB();
const C = new LongPressEventAndCB();

A.addEventListener("longpress", () => console.log("A => longpress"));
//B does not produce longpress events.
C.addEventListener("longpress", () => console.log("C => longpress"));
```

## References
