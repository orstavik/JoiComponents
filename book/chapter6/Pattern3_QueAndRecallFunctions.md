# Pattern 3: QueAndRecallFunctions

To que and recall function calls are done like this:
1. A list for the function que is set up.
2. Functions to be queued are added to this list using a function.
3. When ready, all the functions in the que are run in their order of insertion.
Once completed, the que is removed and the 'WebComponentsReady' event is dispatched from the document. 
4. If a function is attempted added to the que after the que has been emptied, 
it is simply run immediately.

```javascript
window.MyFunctionQue = {
  _que: [],
  waitFor: function(fn){
    if (!fn) 
      return;
    this._que? this._que.push(fn) : fn();
  },
  flushAndReady: function(){
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

## window.WebComponents - QueAndRecallFunctions relying on web component features
As described in the previous chapter, there are two reasons to QueAndRecallFunctions 
when using web components.

1. you might need to delay calls to functions that require web component APIs to be present,
such as:
   * `customElements.define`, calls that you need to register new html-tags
   * `myCustomElement.shadowRoot`, queries or manipulation of DOM that require shadowDom API,
   * `.children` or `.querySelector()` calls that anticipates a structure of the DOM 
      not yet set up.

2. Polyfilling web components is heavily interfering with the DOM.
Queries and manipulation of the DOM can therefore in some instances be affected 
by the polyfill, and such functions should therefore also be queued and run *after*
the polyfill has loaded.
         
Both such needs require the setup of a QueAndRecallFunctions we by convention 
call `windows.WebComponents`.
In this que all functions requiring web components APIs being present or 
benefiting from being batched and called as a group.
This que can then be flushed either when:
* the polyfills are loaded or native support has been verified, or 
* the document is finished loading (for for example batching purposes).  

Functions that require WebComponent support can now be added 
using the `WebComponents.waitFor()` method.

```javascript
//step 3a: safely use both `customElements.define` and access the dom and shadowDom.
window.WebComponents.waitFor(() => {
  customElements.define("my-component", MyComponent);
  document.querySelector("my-component").shadowRoot.innerHTML;
});
window.WebComponents.waitFor(() => {
  customElements.define("my-component", MyComponent);
  document.querySelector("my-component").shadowRoot.innerHTML;
});
//step 3b: recall and flush methods added to the window.WebComponents que at the time of your choosing.
document.addEventListener("DOMContentLoaded", window.WebComponents.flushAndReady);
```

### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
