# Pattern SuperRide

The native function `static get observedAttributes()` that is used to control the
native function `.attributeChangedCallback(name, oldValue, newValue)` is simpler than it might seem.
`static get observedAttributes()` simply provides a function that every element can choose to
override if they want. But to see it in action, we need an example:

## Example OverRideMyName

In this example, we have a class `SuperMyName`.
this class has a method `writeMyName()` that prints a name to the console.
`SuperMyName` also has a static getter method `name`.

In addition, we have a class called `MyName`.
This class extends `SuperMyName`, but it does not override the method `writeMyName()`.
But, `MyName` still intends to change the name written to the console, but 
it will do so by overriding the static getter method `name`.

```javascript
class SuperMyName {
  
  static get name(){                //[1]  
    return "James Bond";
  }
  writeMyName(){
    console.log(this.name);         //[2]
  }
}
class MyName extends SuperMyName {
  
  static get name(){                //[3]        
    return "Miss Moneypenny";
  }
}

const agent007 = new SuperMyName();
agent007.writeMyName();             //[4] //James Bond
const agent008 = new SuperMyName();
agent008.name = "Goldfinger";         
agent008.writeMyName();             //[5] //Goldfinger
const agent007pluss1 = new MyName();
agent007pluss1.writeMyName();       //[6] //Miss Moneypenny
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