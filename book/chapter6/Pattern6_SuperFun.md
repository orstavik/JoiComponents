# Pattern: SuperFun

The SuperFun pattern wraps an existing, original function inside another new function.
The new function is given *the same signature* and put back *at the exact same location*,
the new function *extends* the original function.
Yet other functions in the code that call this signature at that location,
will then instead of calling the original function, 
call the new extended function that wraps the original function.

The SuperFun pattern resembles class inheritance for functions.
In the new, extended function we can add 
 * pre-actions before the original function logic and
 * post-actions after .

It looks like this:

```javascript
var superFun = originalFunction;         //[1]

originalFunction = function(one, two){   //[2]
  console.log("pre");                    //[3]
  superFun(one, two);                    //[4]
  console.log("post");                   //[5]
}
```
1. a reference to the original function is stored in a local variable called `superFun`.
2. a new function with the same signature is placed at the same location as the original function:
3. actions done *prior to* calling `superFun`. 
These pre-actions can:
   * augment or reduce the arguments, and/or 
   * capture the state of the environment before superFun is called, and/or
   * to alter the environment in preparation of calling superFun.
4. the original superFun is called with the same arguments.
5. actions done *after* calling `superFun`.
These post-actions can: 
   * capture the state immediately after superFun, and/or
   * restore/alter the environment after superFun.
   
## `async` superFun with `async/await`
The above example is simple. And *sync*.
But, sometimes the original function is *async*. 
Or the pre-actions are *async*.
What then?

We look at a simplistic example first.

```javascript
const superFun = originalFunction;           

originalFunction = async function(one, two){    //[1]
  console.log("pre");          
  await superFun(one, two);                     //[2]
  console.log("post");         
}
```
1. We mark the new, extended function `async`.
2. We `await superFun()` before calling post-actions.  

But this might be problematic. Let's say that pre-actions 
changes something in the environment that we *must* revert in post actions.
To achieve this effect we add a `try{} catch(){}` clause:

```javascript
const superFun = originalFunction;          

originalFunction = async function(one, two){
  try {                        //[1]
    await console.log("pre");  //[2]          
    await superFun(one, two);  //[3]          
    console.log("post");       //[4]          
  } catch (error) {
    console.log("post");       //[5]          
    throw(error);    
  }
}
```
1. We add a try catch clause around the functions.
2. We `await` pre-actions before calling `superFun()`.
3. We `await superFun()` before calling post-actions.
4. If all goes well, post-actions are run.
5. If something goes wrong during pre-actions or superFun(), post-actions are run anyway.

## `async` superFun with `Promise`
But `async/await` might not always be available. 
Then, you might want to downgrade to `Promise` and `Promise.resolve`.
We look at the two examples from above again using `Promise`s.

```javascript
var superFun = originalFunction;         

originalFunction = function(one, two){     //[1]
  console.log("pre");                      
  Promise.resolve(                         //[2]
    superFun(one, two)                     
  ).then(function(){                       //[3]
    console.log("post");                   
  });
}
```
1. The function signature is not affected. 
2. The call to `superFun()` is wrapped inside `Promise.resolve`.
3. Post-actions are called in an anonymous function inside `.then()`. 
This function awaits `superFun` to be completed.

```javascript
var superFun = originalFunction;        

originalFunction = function(one, two){  
  Promise.resolve(function(){           //[1]
    console.log("pre")                  
  }).then(function(){                   //[2]
    return superFun(one, two);          
  }).then(function(){                   //[3]
    console.log("post");                
  }).catch(function() {                 //[4]
    console.log("post");                    
  });
}
```
1. Pre-actions are wrapped in an anonymous function.
2. The `Promise` chain awaits pre-actions, and then calls an anonymous function that call `superFun()`.
3. Post-actions awaits the completion of superFun() before calling post-actions. 
4. If anything goes wrong along the way, post-actions are called again.

### Side note: `arguments` and `superFun.apply`

In JS, `arguments` is a reserved word akin to `function`, `this` and `var`.
Inside any function, `arguments` means the array of arguments passed into that function.
Another built-in feature of js is that a function can be called using `.apply` method on the 
function object. `.apply` takes two arguments: a) a `this` object and b) an array for the arguments.
An implemention of the SuperFun pattern using `.apply` and `arguments` looks like this:

```javascript
var superFun = originalFunction;         

originalFunction = function(one, two){   
  console.log("pre");                    
  superFun.apply(null, arguments);      //[1]
  console.log("post");                   
}
```
1. The call to superFun is made using the default `arguments` property of the current function 
and the `Function.apply` method.

Most often, `.apply` and `arguments` is unnecessary in combination with the SuperFun pattern.
The SuperFun pattern wraps a function whose location and signature you should know.
The SuperFun pattern also should not change the argument list of the original function.
`.apply` and `arguments` are there to help you when you don't know the argument list or 
when the argument list is dynamic. 
Therefore, avoid `.apply` and `arguments` when you use SuperFun if you can.

## Drawbacks: SuperFun is not really fun nor super

1. SuperFun is a one way street. 
Once you have wrapped a function inside superFun, you cannot reset it back to the original. 
To make the SuperFun reversable, you must make two locations and/or two signatures.
And that is another pattern.
2. SuperFun is brittle. Especially when you need to use resolve Promises and await results. 
It is easy to make minor mistakes in the `Promise.resolve` chain, and 
such mistakes will likely cause errors somewhere else in your code that might be hard to track down.
Use this pattern with caution, SuperFun can often be considered an antipattern.

## References
* https://javascript.info/promise-chaining#returning-promises
* Try to find some other discussion out there on monkeypatching functions like this.