# Pattern: FirstCallback

Sometimes it is greatly beneficial to perform an operation only once for a certain callback.
There are two ways to implement such a check:
1. OnlyOnceProperty
2. OnlyOnceWeakSet

The FirstCallback pattern maintains a property or register to check whether or not the callback
method has been run previously.
If the FirstCallback has already run, the pattern just aborts its operations.
If the FirstCallback has not already run, the pattern runs and then updates the property or register.
It is really quite simple.

## Pattern: `.firstConnectedCallback()`
The FirstCallback pattern can be used for any callback method.
But, it is by far most common to use it with `connectedCallback()` to establish a `.firstConnectedCallback()`.

Here is a verbose version using property:
```javascript
class FirstConnectedCallback extends AMixin(HTMLElement) {
  
  constructor(){
    super();
    this.hasBeenConnected = true; 
  }
  connectedCallback(){
    if(!this.hasBeenConnected) {
      this.hasBeenConnected = true;
      this.firstConnectedCallback();
    }
    if (super.connectedCallback) super.connectedCallback();
    //the rest of your connectedCallback
  }

  firstConnectedCallback(){
    //all the logic you only wish to perform the first time the element gets connected
  }
}
```

Here is a verbose version using a global registry. 
This approach is most appropriate when the registry is set up as a MixinSingleton.

```javascript
const onceRegister = new WeakSet();

function FirstConnectedMixin(Base) {
  class FirstConnectedMixin extends Base {
    
    connectedCallback(){
      if(!onceRegister.has(this)) {
        onceRegister.add(this);
        this.firstConnectedCallback();
      }
      if (super.connectedCallback) super.connectedCallback();
      //the rest of your connectedCallback
    }
  
    firstConnectedCallback(){
      //all the logic you only wish to perform the first time the element gets connected
    }
  }
}
```
Here are minified, punchline versions of the two mixins:

```javascript
const onceRegister = new WeakSet();

function FirstConnectedMixin(Base) {
  class FirstConnectedMixin extends Base {
    
    connectedCallback(){
      onceRegister.has(this) || (onceRegister.add(this), this.firstConnectedCallback());
      if (super.connectedCallback) super.connectedCallback();
      //the rest of your connectedCallback
    }
  
    firstConnectedCallback(){
      //all the logic you only wish to perform the first time the element gets connected
    }
  }
}
```

```javascript
class FirstConnectedCallback extends AMixin(HTMLElement) {
  
  constructor(){
    super();
    this.hasBeenConnected = true; 
  }
  connectedCallback(){
    this.hasBeenConnected||( this.hasBeenConnected = true, this.firstConnectedCallback());
    if (super.connectedCallback) super.connectedCallback();
    //the rest of your connectedCallback
  }

  firstConnectedCallback(){
    //all the logic you only wish to perform the first time the element gets connected
  }
}
```

## References
 * dunno