# Pattern: PrivateSymbols

Accidents happen. 
When using a mixin, accidents can happen when a data property or method in your mixin is accidentally 
(or interntionally) read or set or iterated over in your custom element.
To prevent such accidents from happening, we would like to hide the properties in our mixins. 

In some programming languages, to hide a property or method is done simply by marking it as "private".
Alas, JS does not have class property modifiers such as "public" and "private", all the properties of
an object are just public. Except..

## `symbol`

`symbol` is a new native datatype(!) in ES6 on par with `string`, `boolean`, `number` and `object`.
`symbol`s are like invisible strings.
To read them, you have to be given a reference to them, ie. hold on to them as a variable,
and if you do not have this reference, you cannot see it.

So, to hide a property or method on an object in JS, use a `symbol` as that object property key:
1. Create a variable with a `symbol` using the `Symbol("some name")` function.
2. Use this variable to register a property on an object.
3. These properties can be retrieved using the variable that points to the symbol.
4. But! If you do not have this variable, then `symbol` object properties is completely invisible,
it cannot be neither read nor found during property iteration.

The example above shows the use of such properties:

```javascript
const test = {};
const str = "c";
test.a = "A";
test["b"] = "B";
test[str] = "C";

console.log(test["a"]); //A
console.log(test.b);    //B
console.log(test[str]); //C
console.log(test.c);    //C

const invisibleString = Symbol("invisibleString");
test[invisibleString] = "invisible";
console.log(test[invisibleString]);   //invisible
console.log(test["invisibleString"]); //undefined (we have not added a property with a string key called "invisibleString")
console.log(test.invisibleString);    //undefined (same as above)

for (let prop in test){
  console.log(prop);                  //"A", "B", then "C", but "invisible" is NOT printed. 
}
```

## Pattern: PrivateSymbol

Using `symbol`s, we can hide both properties and methods in a mixin.
However, with data properties, we often just want to disable users of the mixin *setting* those properties
values, but still have access to *reading* them.
In such instances we combine `symbol` with `getter` and `setter` functions in JS.

## Example: PrivateSymbolMixin

The PrivateSymbolMixin:
1. keeps count of how times an object have been connected and disconnected to the DOM,
2. gives everyone **read access** to these data as a property on the object called `connectedData`
that looks like this: `{connected: 12, disconnected: 11}`,
3. disallows **write access** to `connectedData`, and
4. **hides** a method that checks that `connectedData` always either has the same number of connects and disconnects,
or only one more connect than disconnect.

```javascript
const conDis = Symbol("createdConnecteds");
const checker = Symbol("checker");

function PrivateSymbolMixin(Base) {
  return class PrivateSymbolMixin extends Base {
    constructor(){
      super();
      this[conDis] = {connected: 0, disconnected: 0};
    }
    
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      this[conDis].connected += 1;
      this[checker](true);
    }
    
    disconnectedCallback(){
      super.disconnectedCallback && super.disconnectedCallback();
      this[conDis].disconnected += 1;
      this[checker](false);
    }
    
    [checker](connecting){
      if (connecting){
        if ((this[conDis].connected-1) !==this[conDis].disconnected)
          alert("OMG! This should never happen!!");
      }
      else {
        if (this[conDis].connected !==this[conDis].disconnected)
          alert("WTF! How on earth did this happen??");
      }
    }
    
    get connectedData(){
      return this[conDis];
    }
    set connectedData(value){
      throw new Error("'connectedData' is READ only.");
    }
  };
}
```

## Anti-pattern: PrivateSymbol methods

When developing mixins, they look and feel very much like a class.
But, they are not.
Every time you `extend` a mixin, you will not only create a new sub class of that mixin,
but *also* a new super class object created and returned from the mixin function.
Here is an example:

```javascript
const testValue1 = Symbol("testValue1");
const testValue2 = Symbol("testValue2");
const testMethod = Symbol("testMethod");

function myMixin(Base) {
  return class MyMixinInstance extends Base {
    constructor(){
      super();
      this[testValue1] = ["apples", "oranges", "bananas"];
      this[testValue2] = undefined;
    }
    
    connectedCallback(){
      Base.connectedCallback && Base.connectedCallback();
      this[testMethod]();
    }

    [testMethod](){
      this[testValue2] = this[testValue1].join(" + ");
    }
  };
}

class AElement extends myMixin(HTMLElement){}
class BElement extends myMixin(HTMLElement){}

customElements.define("a-element", AElement);
customElements.define("b-element", BElement);

let aParentClass = Object.getPrototypeOf(AElement);
let bParentClass = Object.getPrototypeOf(BElement);
let aGrandParentClass = Object.getPrototypeOf(aParentClass);
let bGrandParentClass = Object.getPrototypeOf(bParentClass);

HTMLElement === aGrandParentClass === bGrandParentClass; //the base for the mixin is in this example the exact same class, although it need not be.
aParentClass !== bParentClass; //because the mixin is a method that will create a new class object
aParentClass.name === bParentClass.name === "MyMixinInstance"; //but the mixin class has the same name
AElement !== BElement;      //of course
aParentClass[testMethod] !== aParentClass[testMethod];  //since the two classes are different, the methods on the classes are also different.
```

In the example above, two different classes are created for `MyMixinInstance`, 
even though they get the same Base and turn out exactly similar.
Thinking about it, this makes sense as the mixin is a function that creates a 
new class instance every time, and not a singular class in itself.

The consequence of this is that you essentially will end up with a new class
object for every time the mixin is used to define a class.
This also means that you would like to make as much of the functionality, ie. methods,
mixin general to save memory.
The example above illustrates the solution to this problem


```javascript
const testValue1 = Symbol("testValue1");
const testValue2 = Symbol("testValue2");
const testMethod = Symbol("testMethod");

function testMethod(thiz){
  thiz[testValue2] = thiz[testValue1].join(" + ");
}

function myMixin(Base) {
  return class MyMixinInstance extends Base {
    constructor(){
      super();
      this[testValue1] = ["apples", "oranges", "bananas"];
      this[testValue2] = undefined;
    }
    
    connectedCallback(){
      Base.connectedCallback && Base.connectedCallback();
      testMethod(this);
    }
  };
}

class AElement extends myMixin(HTMLElement){}
class BElement extends myMixin(HTMLElement){}

customElements.define("a-element", AElement);
customElements.define("b-element", BElement);

let aParentClass = Object.getPrototypeOf(AElement);
let bParentClass = Object.getPrototypeOf(BElement);
let aGrandParentClass = Object.getPrototypeOf(aParentClass);
let bGrandParentClass = Object.getPrototypeOf(bParentClass);

HTMLElement === aGrandParentClass === bGrandParentClass; //the base for the mixin is in this example the exact same class, although it need not be.
aParentClass !== bParentClass; //because the mixin is a method that will create a new class object
aParentClass.name === bParentClass.name === "MyMixinInstance"; //but the mixin class has the same name
AElement !== BElement;      //of course
testMethod === testMethod;  //of course, since now we call the same external method from connectedCallback
```

## Securely hidden?

The PrivateSymbol pattern is not safe from reflection using the method `Object.getOwnPropertySymbols`:

```javascript
var A = {};
var B = Symbol("B");
A[B] = "not really that secret after all";
var symbols = Object.getOwnPropertySymbols(A);
var b = symbols[0];
alert(A[b]);      //"not really that secret after all"
```
Therefor, *if* another JS resource on the outside of an element 
*really desires* to read and write to PrivateSymbol properties or methods in the mixin,
they can do it.

In general, this is OK. 
The PrivateSymbol pattern intends to prevent accidental conflicts and signal encapsulation;
the PrivateSymbol pattern is not a security nor encryption mechanism.
If you need even stronger encapsulation, 
see [accessor pattern](https://medium.com/@weberino/you-can-create-truly-private-properties-in-js-without-es6-7d770f55fbc3).

## References
 * https://hacks.mozilla.org/2015/06/es6-in-depth-symbols/
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
 * https://medium.com/@weberino/you-can-create-truly-private-properties-in-js-without-es6-7d770f55fbc3