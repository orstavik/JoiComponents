# Pattern: QueAndRecallFunctions

To que and recall function calls is done like this:
1. An array for the function que is set up.
2. Functions to be queued are added to this array using a function.
3. When ready, all the functions in the que are run in their order of insertion.
Once completed, the que is removed. 
4. If a function is attempted added to the que after the que has been emptied, 
it is simply run immediately.
5. If the que is attempted to be flushed more than once, it simply does nothing.

```javascript
window.MyFunctionQue = {
  _que: [],
  ready: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  runWhenReady: function(){
    if (this._que === undefined)
      return;
    var que = this._que;
    this._que = undefined;
    for (var i = 0; i < que.length; i++) {
      if (que[i] instanceof Function)
        que[i]();                     
    }
  }
};
```
Functions can now be added using `MyFunctionQue.ready()`,
and then recalled and flushed later using `MyFunctionQue.runWhenReady()`.
```javascript
window.MyFunctionQue.ready(function(){
  console.log("a");
});
console.log("b");                 
MyFunctionQue.runWhenReady();     
console.log("c");                 //b, a, c
```

## Adding a `Promise`/`async function` to the QueAndRecallFunctions
The above que is simple, nice and functional. 
But, it does not support for `async function` nor `Promise`.
To support this, we update the runWhenReady method to also accept and await 
all promises before exiting.

```javascript
window.MyFunctionQue = {
  _que: [],
  ready: function(fn) {                 //returns true when the function is run
    if (!fn)
      return;
    if (que)
      return que.push(fn);
    if (fn instanceof Function)
      fn();
  },
  runWhenReady: function(){
    if (this._que === undefined)
      return;
    var que = this._que;
    this._que = undefined;
    return Promise.all(que.map(function(fn) {
      return fn instanceof Function ? fn(): fn;
    }));
  }
};
```
Both sync and async functions can now be queued and recalled like this:

```javascript
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.MyFunctionQue.ready(async function(){
  console.log("a1");
  await sleep(2000);
  console.log("a2");
});
window.MyFunctionQue.ready(function(){
  console.log("b");
});
console.log("c");                 
MyFunctionQue.runWhenReady();     
console.log("d");                 //c, a1, b, d, a2
```

## Adding flaggs to complete
Sometimes, you might need more than one criteria to be active before calling `runWhenReady`.
To achieve this effect, we use a set of flags:
 * We add a flag using the `await(flag)` function.
 * We remove flags when we pass them as arguments to `runWhenReady(flag)`.
 * When `runWhenReady(flag)` has removed all the flags, it also flushes the `ready` que.

Finally, we wrap everything in a self invoking function (SIF).
The SIF creates a local scope in which locally defined variables cannot be accessed from the outside.
Both `que` and `flags` can thereby be encapsulated from outside interference, 
while still be accessed from both `window.polyfill.runWhenReady` and `window.polyfill.await`
that are defined within the SIF.

```javascript
(function () {
  'use strict';
  var que = [];
  var flags = [];
  window.MyFunctionQue = {
    ready: function (fn) {            
      if (!fn)
        return;
      if (que)
        return que.push(fn);
      if (fn instanceof Function)
        fn();
    },
    runWhenReady: function (pf) {     
      if (flags.length > 0) {
        if (!pf)
          return;
        var index = flags.indexOf(pf);
        if (index > -1)
          flags.splice(index, 1);               //att! mutates flags
        else
          console.error("Check your polyfills.");
        if (flags.length > 0)
          return;
      }
      var q = que;
      que = undefined;
      return Promise.all(q.map(function (fn) {
        return fn instanceof Function ? fn() : fn;
      }));
    },
    await: function (pf) {
      flags.push(pf);
    }
  }
})();
```
This can be used like this:

```javascript
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.MyFunctionQue.await("one");             //adding two flags "one" and "two" to the que
window.MyFunctionQue.await("two");

window.MyFunctionQue.ready(async function(){   //adding a function to the que
  console.log("a1");
  await sleep(2000);
  console.log("a2");
});

window.MyFunctionQue.ready(function(){         //adding another function to the que
  console.log("b");
});
console.log("c");                 //c
MyFunctionQue.runWhenReady();     //nothing happens, because flags "one" and "two" are set.
console.log("d");                 //d
MyFunctionQue.runWhenReady("two");//nothing happens, because flag "one" is set.
MyFunctionQue.runWhenReady("one");//a1, b, a2     //all flags are removed, the que flushes
```

### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
