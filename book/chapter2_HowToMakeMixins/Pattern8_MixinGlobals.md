# Pattern: MixinGlobals (rough draft)

## Module-local resources

When a JS module is loaded, it will run the JS code in the module (of course).
This code is given its own context, lets call it module scope. 
The module scope is accessible within the module (of course).
Classes, functions, variables and constants that are exported, 
can be imported and accessed elsewhere (of course).
But any class, function, constant or variable that are not exported, 
can only be accessed from within that module.

When a module is loaded and run, it can therefore set up lots of variables and local functions that
*the module does NOT export*. We call them *module-local resources*. 
When the module has finished loading, and finished its initial run, 
it can (of course) simply discard these module-local resources.
But, it can also hang on to these local variables and functions and 
use them from within the functions and classes it exports.

## Singleton resources in mixins

Mixins are loaded as JS modules.
And mixins are used to extend the class of new objects so that all the new objects get some new functionality.

Therefore, when a mixin:
1. is loaded in a module,
2. that set up a module-local resource,
3. that the mixin can access from one of its callbacks,
4. then that resource effectively is simply *one, single* resource that is *shared* between 
all the objects that implement that mixin.

   A "singleton" resource, if you will.
   (Some associate a very particular pattern with the term "singleton".
   I do not. For me, a "singleton" means a resource that:
   1. can hold a state, 
   2. is shared between objects of a particular type,
   3. and accessible from all the objects of that type.

## Example 1: SuperSimpleSingleton

This example is a mixin that keeps tabs on how many elements using this mixin 
that are connected at any given point.
These elements need to share the count of how many they are.

```javascript
let count = 0;    //singleton resource

function SuperSimpleSingleton(Base){
  return class SuperSimpleSingleton extends Base {
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      count++;
    }
    disconnectedCallback(){
      super.connectedCallback && super.connectedCallback();
      count--;
    }
    howManyOfUsAreConnected(){
      return count;
    }
  }
}
```

## Anti-pattern: RegisterElementsConstructed

Another example is a mixin that registers all the elements that are created of a certain type:

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
The problem with this solution is that every element will be added to the els list, but 
they are never removed from that list.
The array holds a hard reference to these objects, and even though the element is removed from 
the DOM and "should be" garbage collected, the hard reference here will prevent the garbage collector
from ever picking up the elements.

Discuss the use of weakSet and the problem of not being able to iterate weakSet.
The dilemma of preserving references to elements disabling GC.

This is therefore an anti-pattern. Don't register elements in a mixin singleton if you do not have a
strategy for removing them.

## Pattern: RegisterConnectedElements
But, lets say we needed to do something with the connected elements.
We want the callback not only to provide us with the count of the connected elements, but 
also a list of who they are:

```javascript
let cons = [];    //singleton resource

function SuperSimpleSingleton(Base){
  return class SuperSimpleSingleton extends Base {
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      cons.push(this);
    }
    disconnectedCallback(){
      super.connectedCallback && super.connectedCallback();
      cons.remove(this);    //todo obvious error
    }
    listOfConnected(){
      return cons;
    }
  }
}
```
## Use of mixin singletons
 
The primary use-case for mixin singletons is to make mixin functionality more efficient.
Lets say you have 100 elements that all use the same mixin that listens for a particular event.
When this event occurs, the mixin must process the event data or some system state, and 
then perhaps trigger a reaction in a few of the elements that implement that use this mixin.

To make this action more efficient, a different structure might be set up.
Instead of adding one event listener for each element of that mixin and process the same data 100 times,
a single event listener is set up in the module-local scope which parses that data once.
Then the result of this function can then either result in the dispatch of a new event.

To make such functions even more efficient, 
a register of all the elements of that type can be set up so that the single processing function 
itself can evaluate if it needs to trigger a callback on that element for this particular event or not.

//in order to que and control the callbacks on the elements more efficiently and to do cleanup and 
other activities at a single point.


But. This leads to the primary pit-fall for mixin singletons.
Singletons have side-effects. You should worry a little bit when you set them up.
In the example use-case described above, you need to establish a register that you can iterate over.
To be able to iterate over a set of elements, this set must have hard references.
This means you cannot use `WeakSet`, and this means that none of the elements 
that you register in your mixin singleton will be garbage collected.

To ensure that the register does not contain objects that should be garbage collected,
then add them on connectedCallback() and remove them when disconnectedCallback().

At least, I do not know how to make an iterable object register that will allow objects within it to be garbage collected.

[LieFi] and [ResizeMixin] are good examples of mixin singletons.

## References
 * dunno