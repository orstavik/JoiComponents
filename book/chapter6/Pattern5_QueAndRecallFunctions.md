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
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
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
Functions can now be added using `MyFunctionQue.waitFor()`,
and then recalled and flushed later using `MyFunctionQue.flushAndReady()`.
```javascript
window.MyFunctionQue.waitFor(function(){
  console.log("a");
});
console.log("b");                 //b
MyFunctionQue.flushAndReady();    //a
console.log("c");                 //c
```

## Adding `Promise`s and `async` functions to the QueAndRecallFunctions
The above que is simple, nice and functional. 
But, it does not support for `async` functions.
With the advent of `async function` and `Promise` in JS, 
both functions and `Promise`s might be added to the function que.
To support this, we update the flushAndReady method to also accept and await 
all promises before exiting.

```javascript
window.MyFunctionQue = {
  _que: [],
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
    if (this._que === undefined)
      return;
    var que = this._que;
    this._que = undefined;
    Promise.all(que.map(function(fn) {
      return fn instanceof Function ? fn(): fn;
    }))
    .then(function() {
      //at this point the que is empty!!
    })
    .catch(function(err) {
      console.error(err);       //todo should I throw an Error here instead?
    });
  }
};
```
Both synced and async functions can now be queued and recalled like this:

```javascript
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.MyFunctionQue.waitFor(async function(){
  console.log("a1");
  await sleep(2000);
  console.log("a2");
});
window.MyFunctionQue.waitFor(function(){
  console.log("b");
});
console.log("c");                 //c
MyFunctionQue.flushAndReady();    //a1, b, a2
console.log("d");                 //c
```

### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
