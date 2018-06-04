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
We start simple with the new, beautiful `async/await` ES6 syntax.
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

### `async` superFun in ES5
`async/await` truly is beautiful. 
But it is much easier to see this beauty when it stands next to its friend: `Promise`.
Again, we start the repeat the first example:

```javascript
var superFun = originalFunction;         

originalFunction = function(one, two){
  console.log("pre");                      //[i]
  new Promise(function(resolve, reject){
    try {
      superFun(one, two);                  //[ii]
      resolve();              
    } catch (error){
      reject(error);
    }
  }).then(function(){
    console.log("post");                   //[iii]
  }).catch(function() {
    console.log("post");                   //[iii]    
  });
}
```
This, in my book, is not beautiful. Just count the number of scopes and layers.
To see how this code becomes even more complex and convoluted, 
we redo our third example when we await both the pre-actions and the superFun function call
using `Promise`.

```javascript
var superFun = originalFunction;        

originalFunction = function(one, two){  
  new Promise(function(resolve, reject){
    console.log("pre");                 //[i]
    resolve();
  }).then(function(){
    return new Promise(
      function(resolve2, reject2){
        superFun(one, two);             //[ii]
        resolve2();
      });
  }).then(function(){
    console.log("post");                //[iii]
  }).catch(function() {
    console.log("post");                //[iii]    
  });
}
```
The code above is complex and hard to read, both syntactically (many scopes) and 
semantically (return a new Promise inside a then function, how, what, when, why?).
The "secret sauce" to understanding the example above, is semantics. 
If a `.then()` call receives a function that returns a promise, 
the next `.then()` function will trigger the next `.then()` function in the chain
before this returned `Promise` is resolved.

### `Promises` is the engine behind `async/await`
I do not intend here to bad-talk `Promises` in general. 
`Promises` are good. We *need* `Promises`. 
In fact, `Promises` is the API backbone of the beautiful `async/await` grammar.
But, there is inherent complexity in the lexical and syntactic structure of `Promises`
that cannot be removed unless the syntax of the programming language is changed like with
`async/await`. 

To make the principle of `Promises` simpler, 
you have to extend the meaning of what a "function" in JS can return:
* *from* 2 types of results (a) normal value and b) try-catch error) 
* *to* 3 types (a) normal value, b) try-catch error and c) `Promise`).

Then, in addition to this augmented meaning of possible return types of "function",
you also need a mechanism to halt the execution of later statements pending the 
resolution of a `Promise`, and vice versa, to continue on with the execution of later statements. 

In ES6, the choice to grammatically implement this fell on:
1. stating that functions who might return a Promise be marked as async,
2. that statements that should halt the execution of later statements be marked `await`, and
3. that all statements not marked await should continue execution of later statements 
regardless if the result is a Promise or not.

There could be alternative ways to achieve this. 
One could have said that all sync functions be marked `sync`, and 
statements deliberately not awaited are marked `thread` or something.
One could also have elected not to mark anything, assuming all functions be potentially async 
and `await`-ing all statements if they return a `Promise`.
But due to consideration of existing code and performance and the use-case of distinguishing 
statements you want to await and continue, `async/await` was considered the best compromise.

However, one small point. When writing `async/await`, 
it might be argued that the developer might find it easy to forget adding the `await` keyword.
It might also be possible to argue that if a function returns a Promise, the choice of awaiting that 
Promise should be the default option, while the choice of continuing on with the following statements 
in the block be the more active choice.
Such a choice is much more costly performance wise, and purely a fairytale world. 
But still understanding this "grammatical potential" and fairytale of `async/thread` is useful
both to better understand the nature of `async/await`, the evolution of programming language grammar, and
to better remember the **active** choice you are making when you **do not `await`** the result 
of an `async` function.

### Side note: `arguments` and `superFun.call`

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
Therefore, SuperFun should not change the function signature (argument list) coming into the wrapper function, 
and the argument list should be known and followed.


## References
* https://javascript.info/promise-chaining#returning-promises
* Try to find some other discussion out there on monkeypatching functions like this.