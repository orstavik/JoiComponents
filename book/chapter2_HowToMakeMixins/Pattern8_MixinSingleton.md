# Pattern: MixinSingleton

## Short intro to JS module scope

When a JS module is loaded, it will run the JS code in the module (of course).
This code has its own scope, the "module scope". 
The module scope is by default accessible only from within the module, and not from the outside (of course).
In order to make the resources inside the module scope accessible from the outside,
classes, functions, variables and constants have to be "exported" (of course). 
These exported properties can then be "imported" where the module is used (of course).

But, the module can create both classes, functions, constants or variable that are not exported. 
These entities are trapped in the scope of the module.
When a module is loaded and run, it can therefore set up lots of variables and local functions that
*the module does NOT export*.
If none of the exported functions or classes uses these module-local resources, 
they will just disappear (ie. be garbage collected) when the module has finished loading.
But, if an exported function relies on such a module-local resource (ie. has a reference to it),
then that resource will:
 1. stay active as long as the module is active, 
 2. be hidden from the outside, and 
 3. be accessible and changeable from the exported module functions.

## Mixin singleton

Mixins are loaded as JS modules.
And mixins are used to extend the class of new objects.
Doing so, the mixin gives the new objects new functionality.

Therefore, when a mixin:
1. is loaded in a module,
2. that set up a module-local resource,
3. that the mixin can access from one of its callbacks,
4. then that resource effectively is simply *one, single* resource that is *shared* between 
all the objects that implement that mixin.

We call this resource a "mixin singleton".
Regardless of how many elements are created using the mixin, they will all share the same module scope
and thus the same instances of any resources specified in that scope.
(Note. The Mixin prototype itself could be used for this purpose too. 
But the class that the mixin returns will be different every time it is called.
Therefore, it is more beneficial to use mixin globals than methods on the class the mixin returns.)

## Example 1: SuperSimpleSingleton

This example illustrates the basic MixinSingleton pattern.
The SuperSimpleSingleton keeps tabs on:
1. how many elements that 
2. that extend this mixin that
3. are connected to the DOM.

```javascript
let count = 0;                    //[1]

function SuperSimpleSingleton(Base){
  return class SuperSimpleSingleton extends Base {
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      count++;                    //[2]
    }
    disconnectedCallback(){
      super.connectedCallback && super.connectedCallback();
      count--;                    //[2]
    }
    howManyOfUsAreConnected(){
      return count;               //[3]
    }
  }
}
```
1. In the module scope, we set up the singleton resource.
   In this mixin it is simply a `number` variable.
2. Whenever an element using this mixin connects or disconnects from the DOM, 
   The singleton resource can be read and altered from the mixin.
   All the object instances of this mixin will all change the same variable count.
3. A method on the element returns the current number of connected elements.

## Anti-pattern: HotelCalifornia

> The elements can check-in any time they like, but they can never leave.

Sometimes, it is tempting to keep track of all elements of a certain type.
The mixin might listen for an external event and 
then trigger a callback on all of its element instances.
Below is an example `NaiveSingleton` that keeps a register of all elements extending the mixin.

```javascript
let els = [];    //singleton resource

function NaiveSingleton(Base){
  return class NaiveSingleton extends Base {
    constructor(){
      super();
      els.push(this);
    }
    listOfMyTypes(){
      return els;
    }
  }
}
```

Such a register is very useful in many use-cases.
But, it has a problem. A big problem:
*Objects in iterable registers cannot be garbage collected.*

Custom elements take up memory in the browser. 
And we do not want to use too much memory.
The most important way we preserve memory is by letting the browser clean up after us: 
garbage collection.
And the browser does this when the element is a) disconnected from the DOM and b)
no other hard references to the element object is kept in other active JS objects.

But, when we register an element of a certain type in the mixin, 
that registry needs hard links to the element in order for it to be iterable.
(`WeakSet` in JS is not iterable).
Thus, by enabling a register of all elements of a certain type, for example in their `constructor()`,
we will at the same time **disable garbagecollection** of the same elements.

To register elements in the mixin from the `constructor()` is therefore an anti-pattern. 
Don't register elements in a mixin singleton "normal" collection 
if you do not have a strategy for removing them.

## Pattern: RegisterConnectedElementsOnly
To ensure that the register does not contain objects that should be garbage collected,
then add them on `connectedCallback()` and remove them on `disconnectedCallback()`.
We modify the `NaiveSingleton` example above so that the element is only registered while 
the element is connected to the DOM.

```javascript
let cons = [];    //singleton resource

function SimpleSingleton(Base){
  return class SimpleSingleton extends Base {
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      cons.push(this);
    }
    disconnectedCallback(){
      super.connectedCallback && super.connectedCallback();
      cons.splice(cons.indexOf(this), 1);
    }
    listOfConnected(){
      return cons;
    }
  }
}
```
To learn more about the use of the connected/disconnected-session as an alternative to 
constructor/"destructor"-session, see 
[Mixin: UnloadsDisconnects](../../trash/book/chapter3_element_lifecycle/chapter3_lifecycle/Mixin3_unload_disconnects.md). 

## Use of MixinSingleton
 
The primary use-case for MixinSingleton is to make mixin functionality more efficient.
Lets say you have 100 elements that all use a mixin that listens for a particular event.
When this event occurs, the event triggers some state, event or system data calculation.
As a result of this calculation, a callback function should be triggered on some or 
all of the mixin elements.

It is more efficient to listen for the browser to process only one event listener and calculate 
current state, event or system data once.
It is also more efficient to invoke the callback methods form within a loop in JS instead of going
in and out of JS and the event listener que.

[ResizeMixin] and [UnloadsDisconnects] are good examples of mixins that rely on the MixinSingleton pattern.

## References
 * dunno