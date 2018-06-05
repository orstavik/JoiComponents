# Pattern: SuperFun

The SuperFun pattern wraps an existing function inside another method 
*with the same signature, at the exact same location, with the same signature*.
When the new extended function is put back with the same location+signature,
when other functions call this signature, they will call the new extended function
who will wrap the original function.
The SuperFun pattern is similar to what classes do when the inherit another class: 
it *extends an existing function* with some new functionality.
In its most simple form, here is what it looks like:

```javascript
var superFun = originalFunction;         //[1]

originalFunction = function(one, two){   //[2]
  console.log("pre");                    //[i]
  superFun(one, two);                    //[ii]
  console.log("post");                   //[iii]
}
```

1. a reference to the original function is preserved 
in a local variable called `superFun`.
2. a new function with the same signature is placed at 
the same location as the original function:
   1. actions done *prior to* calling `superFun`. 
   These pre-actions might:
   a) augment or reduce the arguments, and/or 
   b) capture the state of the environment before superFun is called, and/or
   c) to alter the environment in preparation of calling superFun.
   2. the original superFun is called with the same arguments.
   3. actions done *after* calling `superFun`.
   These post-actions might 
   b) capture the state immediately after superFun, and/or
   c) restore/alter the environment after superFun.
   
## Async functions

The code above is simple. Easy on the eyes and easy to understand.
We like that. But, sometimes the superFun original function is *async*. 
Or the pre-actions are *async*.
What then?

### `async` superFun in ES6
We start simple with the `async/await` syntax.
First, we only `await superFun()`, both pre and post actions are sync:
```javascript
const superFun = originalFunction;           

originalFunction = async function(one, two){ 
  console.log("pre");          //[i]
  await superFun(one, two);    //[ii]
  console.log("post");         //[iii]
}
```

Then, we await both pre-actions and `superFun()`:
```javascript
const superFun = originalFunction;           

originalFunction = async function(one, tjwo){ 
  await console.log("pre");    //[i]
  await superFun(one, two);    //[ii]
  console.log("post");         //[iii]
}
```
But this might be problematic. Let's say that just starting pre-actions 
changes something in the environment that we always need to revert in post actions.
To achieve this effect we add a `try{} catch(){}` clause:

```javascript
const superFun = originalFunction;          

originalFunction = async function(one, two){
  try {
    await console.log("pre");  //[i]          
    await superFun(one, two);  //[ii]          
    console.log("post");       //[iii]          
  } catch (error) {
    console.log("post");       //[iii]          
    throw(error);    
  }
}
```

### `async` superFun with Promises
We can also do this with Promises. By wrapping `superFun` in `Promise.resolve`,
the functions inside `.then()` will await `superFun` to be completed.

```javascript
var superFun = originalFunction;         

originalFunction = function(one, two){
  console.log("pre");                      //[i]
  Promise.resolve(
    superFun(one, two)                     //[ii]
  ).then(function(){
    console.log("post");                   //[iii]
  }).catch(function() {
    console.log("post");                   //[iii]    
  });
}
```
We also redo our third example when we await both the pre-actions and 
the superFun function call using `Promise`.

```javascript
var superFun = originalFunction;        

originalFunction = function(one, two){  
  Promise.resolve(
    console.log("pre")                  //[i]
  ).then(function(){
    return superFun(one, two);          //[ii]
  }).then(function(){
    console.log("post");                //[iii]
  }).catch(function() {
    console.log("post");                //[iii]    
  });
}
```
### Side note: `arguments` and `superFun.apply`

In JS, `arguments` is a reserved word akin to `function`, `this` and `var`.
Inside any function, `arguments` means the array of arguments passed into that function.
Another built-in feature of js is that a function can be called using `.apply` method on the 
function object. `.apply` takes two arguments: a) a `this` object and b) an array for the arguments.
An implemention of the SuperFun pattern using `.apply` and `arguments` looks like this:

```javascript
var superFun = originalFunction;         //[1]

originalFunction = function(one, two){   //[2]
  console.log("pre");                    //[i]
  superFun.call(null, arguments);        //[ii]
  console.log("post");                   //[iii]
}
```

When you use the SuperFun pattern, `.apply` and `arguments` is unnecessary.
The SuperFun pattern wraps a function that will be called from other locations using the 
original function name, location and argument list.
Therefore, SuperFun should not change the function signature (argument list), 
and the argument list should be known and followed.

## Opinion: SuperFun is not really fun nor super

SuperFun is one way. 
Once you have wrapped a function inside superFun, you cannot reset it back to the original.
SuperFun is brittle. Especially when you need to use resolve Promises and await results. 
It is easy to make a minor typo in the `Promise.resolve` chain that will not show an error, 
only cause it.

## References
* https://javascript.info/promise-chaining#returning-promises
* Try to find some other discussion out there on monkeypatching functions like this.