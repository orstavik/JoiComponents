# Pattern: EventAndOrCallback

Sometimes you want an element to react to gestures performed upon itself.
A carousel might want to scroll left or right in reaction to horisontal swipes. 
At other times you want an element to dispatch a custom event as their reaction.
A custom button might dispatch a `longpress` event in addition to `click`.
And yet at other times you need both. 
You want your custom button when pushed down long, and you want your carousel to
alert its surroundings about being swiped.

This behavior could be solved by always dispatching new custom events for all reactions.
The custom elements using your mixin, would then ~only~ need to listen for that event.
But.. There are some issues with this:
1. To trigger functions *via* the event system is less performant than triggering a callback.
The element then needs to create, add and remove event listener objects, and
every time an event listener function is to be called, it must be accessed using the event system structure.
Neither is cost free.
2. The (boilerplate) code needed to manage the event listener will clutter up your element.
For one or two events, this extra code might not matter. But as custom elements already rely on
callback methods such as `connectedCallback()` and `attributeChanged(...)`, 
the internal code will be both smaller and more unified if your custom elements can use 
callbacks directly as trigger to self-invoked events. 

So, we want our FunctionalMixins to be able to both trigger reactive callback methods and 
dispatch custom events. To implement this feature we need:
* a StaticSetting `eventAndOrCallback` and 
* a triggerFunction `eventAndOrCallback(eventName, eventSubtype, detail)`.

```javascript
class MyNameMixin {
                                  
  /**
   * eventAndOrCallback: 0 => callback and event, -1 => callback only, 1 => event only
   */
  static get myNameSettings(){                                         //[2]
    return {eventAndOrCallback: 0};                                    //[1]
  }
  
  eventAndOrCallback(eventName, detail) {                              //[1]
    const eCb = this.constructor.myNameSettings.eventAndOrCallback;    //[3]
    if (eCb <= 0) {                                                    //[4]
      let cbName = eventName + "Callback";                             //[5]
      this[cbName] && this[cbName](detail);                            //[6]
    }
    if (eCb >= 0)                                                      //[7]
      this.dispatchEvent(new CustomEvent(eventName, {bubbles: true, detail}));
  }              
}
```
1. Both the StaticSetting property and the triggerFunction should be called `eventAndOrCallback`.
2. The name of the StaticSetting method must be unique to the mixin, and 
by convention this is the mixin's name minus "Mixin".
3. Remember to use the correct name of the the StaticSetting method inside `eventAndOrCallback()`.
4. The callback is only triggered if the `eventAndOrCallback` property equals 0 or -1.
5. The name of the callback is eventName + "Callback". 
The callback has one argument which equals the detail of the equivalent event.
6. The callback is only called if it exists.
This is needed because some mixins (such as EventRecordings) 
will enable lots of potential events/callbacks.
A subclass extending such Mixin might not use all of these callbacks,
and by checking for existence before calling the method improves both performance and readability.
But(!), this also means that no errors will be thrown for added, but unused mixins.
7. The event is only dispatched when the `eventAndOrCallback` property equals 0 or 1.

## Example: `LongpressMixinEventAndOrCallback`

In this example we add the ability to both produce a callback and/or a custom event to
`LongpressMixin`.

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
    
    static get longpressSettings(){                  
      return {
        minDuration: 1000, 
        maxMovement: 20,
        eventAndOrCallback: 0                      //[1]
      };
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
    
    [start](e){
      this.addEventListener("mouseup", this[stopListener]);
      this[startEvent] = e;
    }                                                                  
    
    [stop](e){
      this.removeEventListener("mouseup", this[stopListener]);
      const duration = e.timeStamp - this[startEvent].timeStamp;
      const moveX = e.x - this[startEvent].x;
      const moveY = e.y - this[startEvent].y;
      const distance = Math.sqrt(moveX*moveX + moveY*moveY);
      const settings = this.longpressSettings;
      if (settings.maxMovement >= distance && settings.minDuration <= duration)  //[2]
        this[eventAndOrCallback]("longpress", {duration, distance});
      this[startEvent] = undefined;
    }
    [eventAndOrCallback](eventName, detail) {    //[2]
      const eCb = this.longpressSettings.eventAndOrCallback;
      if (eCb <= 0) {
        let cbName = eventName + "Callback";
        this[cbName] && this[cbName](detail);
      }
      if (eCb >= 0)
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
