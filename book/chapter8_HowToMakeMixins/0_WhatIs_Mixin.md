# WhatIs: a mixin?

In JS, a mixin is:
1. a function that produces a `class`, 
2. that is used *in* the statement that *declares* another class, 
3. right after `extends`, so
4. that the new `class` inherits the output of the mixin.

It looks like this:
```javascript

function MyColorMixin(base){
  return class MyFirstMixin extends base {
    constructor(){
      super();
      this.myColor = "blue";
    }
    
    whatsMyColor(){
      return this.myColor;
    }
  };
}

class MyColoredClass extends MyColorMixin(Object){
  constructor(){
    super();
    this.myColor = "green";
  }
}

const myObject = new MyColoredClass();
console.log(myObject.whatsMyColor()); //prints green
```

If you are not used to it, this is a bit strange. But it is actually not that hard once you get used
to this grammatical innovations:

```
function produceAClass(SomeOtherClass) {
  return class produceAClass extends SomeOtherClass {
    ...
  };
}

class SomeThing extends produceAClass(SomeOtherClass) {
  ...
  
```

## Implicit assumptions in mixins

All functional mixins are applied to a `Base` class. And all mixins make some **assumptions** about 
what resources are available in this `Base` class.

The first assumption all mixins make is that their `Base` class has a `constructor()`called `super()`.
The mixin does not have to implement a `constructor()` themselves, but if they do, they must call 
this `super()` constructor *first* before running their own constructor instructions.

## References

* http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/                                                                                               