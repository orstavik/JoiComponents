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

## References
 * https://hacks.mozilla.org/2015/06/es6-in-depth-symbols/
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
