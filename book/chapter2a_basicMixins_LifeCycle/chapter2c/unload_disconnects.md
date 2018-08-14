# Mixin: UnloadDisconnects                      

## Problem 1: close that connection
Sometimes, when you use a database or other network resource, 
both the client and the server establishes a "connection".
The connection can store state information about the other party's location, previous transactions,
authentication, encryption, and reserve scarce resources such as network sockets and memory on each side.
By using connections the server and client can minimize both how much and how often
data needs to be sent over the network.

But, there is a problem with connections. 
If one of the parties closes their end of the connection *without* notifying the other, 
the other party will likely continue to reserve and occupy scarce resources. 
For example, a browser can open a page that establishes a connection to a server,
and then abruptly close that page without closing the connection.
As thousands of users/browsers behave in this manner,
the uninformed server starts hoarding memory and sockets for users that are no longer there,
slowing or blocking the service for active users.
 
![todo: give credit to the graphic creator](https://preview.ibb.co/nHqPyz/Corel_DRAW_X7_Graphic.png)

## Problem 2: please tell me how it ends!

The ending is not only important in a good book.
For a good app a successful ending is also important. For example:
 * A reading app needs to preserve a user's last known reading position.
   When the reading app knows your last position, it can give you smooth beginning when you return.
 * A web shop needs to know when their users leave.
   If some products or pages always triggers their customers to leave abruptly,
   you might want to consider updating the product pictures, prices and/or page template. 

## Pattern: start-and-end-of-*session* callbacks

> Finish what you start!

Programming languages such as C++ and PHP5 provide a destructor callback used when objects die.
Destructors provide the programmer with an end-of-life callback for objects
that mirrors the start-of-life callback `constructor()`.
The constructor and destructor form a pair that enables the
programmer to ensure that a session is properly initialized and properly cleaned up.
The constructor and destructor frame such sessions around the life of an object.
JS does not provide a destructor since it uses automatic garbage collection.

However, JS and `HTMLElement` provides another start-and-end-of-*session* callback pair:
`connectedCallback()` and `disconnectedCallback()`.
`connectedCallback()` and `disconnectedCallback()` frames a session 
around the period an object is connected to the DOM, not around the life of an object.
This works fine for higher order tasks such as closing database connections and 
registering the end of user interaction;
As long as we can match the session we need to monitor
with a set of start-and-end-of-*session* callbacks,
it does not matter if the session is bound to an object's life or 
while an object is connected-to-the-DOM. 

## Problem 3: Closing the browser does not trigger disconnectedCallback()
In order to remove and delete an HTMLElement that is connected to the DOM in a running app,
that element must always first be disconnected from the DOM, thus triggering `disconnectedCallback()`.
But, there is one way the user can end a session *while* an element is connected to the DOM 
*without* triggering `disconnectedCallback()`: **closing the browser (tab)**.

When the user closes a tab or browser (or other whole document), 
he destroys an entire DOM of connected elements.
But destroying the whole DOM in this way does not trigger `disconnectedCallback()`.
This is a loophole.
If we intend `connectedCallback()` and `disconnectedCallback()` to function as 
non-leaky start-and-end-of-*session* callbacks for app purposes such as closing server connections, 
we must close this loophole.

## Solution: `UnloadDisconnectsMixin`
When a page is closed, the browser dispatches an `unload` event.
This means that an element that `isConnected` to the DOM cannot be disconnected again
without one of two things occuring:
* either its `disconnectedCallback()` is triggered,
* or the `unload` event is dispatched.

Therefore, to close the loophole, we simply need to add an event listener for the `unload` event
that calls an element's `disconnectedCallback()`.
This way, in both instances, an element's `disconnectedCallback()` should always be called 

```javascript
class UnloadElement extends HTMLElement {
  constructor(){
    super();
    document.addEventListener("unload", function(){
      this.isConnected && this.disconnectedCallback();
    }.bind(this));
  }
  connectedCallback(){
    console.log("I always start a session");
  }
  disconnectedCallback(){
    console.log("I always end the session");
  }
}
```

To make this simpler to reuse and more efficient across several elements and custom element types,
we can set this up as a shared mixin.

```javascript
var disconnectUs = new WeakSet();

document.addEventListener("unload", function(){
  for (let el of disconnectUs) 
    el && el.isConnected && this.disconnectedCallback();
});


function UnloadDisconnectsMixin(Base) {
  return class UnloadDisconnectsMixin extends Base {
    constructor(){
      super();
      disconnectUs.add(this);                               
    }
  };
}

class UnloadElement extends UnloadDisconnectsMixin(HTMLElement) {
  connectedCallback(){
    console.log("I always start a session");
  }
  disconnectedCallback(){
    console.log("I always end the session");
  }
}
```
> Caveat: System crashes that causes the browser to end abruptly, 
such as a power cut, hardware failure, OS or browser crash, will of course end any session
without triggering the `disconnectedCallback()`.

## References
* [JScript Memory Leaks](http://crockford.com/javascript/memory/leak.html)
* [destructor](https://en.wikipedia.org/wiki/Destructor_(computer_programming))
* [finalizer](https://en.wikipedia.org/wiki/Finalizer)


#OLD DRAFTS

The element has initiated some ongoing activity, such as a connection to a server,
and then it should alert the server that it no longer will use that connection when the element is closed.

In some programming languages, for example C++, an object can elect to override a "destructor()"
method, the end-of-life equivalent to the start-of-life `constructor()`.
JS however does not have such a callback method.

The nearest thing to a destructor for `HTMLElements` is `disconnectedCallback()`.
If you remove an element from the DOM, and keep no other reference to it in your app,
that element will likely be garbage collected (GC) at the next GC junction. 
But, there are two problems with using `disconnectedCallback()` as a destructor:

1. `disconnectedCallback()` can be called several times. Because if you keep a reference to
   the elements you disconnect from the DOM in another JS object in your app, the element will *not*
   be removed/garbage collected, and you can therefore add it and remove it from the DOM multiple times.
   As you know, of course. So `disconnectedCallback()` will never be a true end-of-life callback, 
   but rather an end-of-session callback. 
   
   For custom elements there will therefore not be an end-of-life callback that corresponds to the
   start-of-life `constructor()`. Custom elements only has the start-of-session `connectedCallback()`
   and end-of-session `connectedCallback()` pair.
   
2. When the user closes the browser window, the end-of-session `disconnectedCallback()` is **not(!)**
   triggered. This creates a loophole in the start-of-session and end-of-session pair.
   In order to patch this hole, elements that needs a tighter start-and-end-of-session pair
   must therefore ensure that they trigger `disconnectedCallback()` when the browser is closed.
   
## Mixin: UnloadDisconnects

There is an event that is triggered when the user closes the browser: `unload`.
By listening for this event, elements can ensure that they `disconnectedCallback()` is triggered 
when the window is closed.
This will ensure that as long as the power is not cut or the underlying software such as OS and browser 
does not fail, the `disconnectedCallback()` will always end every session started.


Sure, an element can still be used in multiple sessions. 
But triggering `disconnectedCallback()` from `unload` gives us a complete start-and-end-something-pair.
If this "something" should only run once during an apps lifecycle, as might be the case of a database 
connection or user authentication session, such a session can simply be established by placing the
element in the root document and just not (re)move it.

Such a mixin does not need to provide any callbacks itself, it simply needs to ensure that:
1. when `unload` is triggered,
2. the `disconnectedCallback` of all:
   1. elements using this mixin 
   2. that are still connected to the DOM
   
   will be called.

This mixin looks like this:

```javascript
const unloadElems = [];
window.addEventListener("unload", function(){
  for (let el of unloadElems) 
    el && el.isConnected && el.disconnectedCallback();
});

export function UnloadDisconnectsMixin(Base) {
  return class UnloadDisconnectsMixin extends Base {
    constructor(){
      super();
      unloadElems.push(this);
    }
  }
}
```


This makes the disconnectCallback() a defacto destructor. 
Using this mixin disconnectCallback() will always be called, 
except for an abrupt powercut or hardware/OS/browser crash.

## Todo 
1. check if we should use `beforeUnload` instead so that removing event listeners for example does not crash.
1. integrate with the text below.

## Problem: When a tab is closed, Page is closed without disconne
Users often close web pages abruptly.
They might open a new tab with a page, take a quick look at it, and then just close the tab.
Or they might stay on a site for long, and then suddenly close the browser.
Or, they might use a site, and then 

The **`unloadCallback()`** is simple and rarely needed. 
Its main purpose is to create a destructor that ensures that the app for example 
a) disconnects database connections and/or 
b) logs out users when the user abruptly closes the tab or browser.
The `unloadCallback()` can be created by adding a code snippet 
with an event listener for the `unload` event in the `constructor()` or `setupCallback()`.
Using a code snippet is suitable when you have only a single or a few elements 
that need to ensure proper destruction.
If many elements need to ensure proper destruction, then [`UnloadMixin`](todo.md) is needed.

This mixin registers an `unloadCallback()` which will call `disconnectedCallback()` 
when the user closes the tab. It based on `unload` event which fired when the document 
or a child resource is being unloaded.

### Problem 1 
In old 
This "bug" that `disconnectedCallback` is not called when the user close a tab - 
event listeners will not be removed, then your element might leave a lot of old event 
listeners still registered, gumming up the system if the browser does not automatically 
clean up such things. 
Which old browser might not be able to do. 

is set up both on the client and the a can make changes, 
reserve resources for each other, and
Quite often, you have to establish a connection to a database or some other third-party installation 
that you want to guarantee is always closed. But what can happen if people just open your page and then 
close it immediately? 
Each database connection is an open socket plus on both sides (client and server) of the data structure 
that stores the state of that connection, and (most importantly) data caches that can grow to 
quite large sizes.

But this is not the worst. Much worse is that in the configs almost any database is marked limit active connections, 
after which the server stops accepting new connections. And this limit is set with the expectation 
that the server copes with the corresponding number of really active (that is, relatively loaded) 
connections, does not hang at the same time and would not use all the memory when trying to execute 
requests from all connections simultaneously. Accordingly, this limit is set quite low and is not 
designed to ensure that hung connections accumulate tens of thousands.

<p align="center">
</p><br>

### Solution
Each time the user closes the tab, `unloadCallback()` activates the function responsible for deactivating the connection to database. This means that the user will deactivate the connection in any case, and the probability that your database will stop responding to requests due to the exhaustion of the connection limit is significantly reduced.



***

```javascript
const unloadEvent = Symbol("unloadEvent");

const closeArray = [];

const handler = function () {                                       //[3]
  for (let entry of closeArray) {
    if (entry.unloadCallback)
      entry.unloadCallback();
  }
};
window.addEventListener("unload", handler);                         //[1]

export const UnloadCallbackMixin = (Base) => {
  return class extends Base {

    constructor() {
      super();
      this[unloadEvent] = true;
      closeArray.push(this)                                           //[2]
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();   //[4]
      window.removeEventListener("unload", handler);
      if (!this[unloadEvent]) return;
      for (let entry of closeArray) {
        closeArray.remove(entry);
      }
      this[unloadEvent] = false;
    }
  }
};

```
***
1. When the mixin is initiatized, it adds a listener for the page close event.
2. Every time the constructor runs, it adds the object to a global array in the mixin.
3. When this listener is activated, it runs the list and calls deletedCallback from outside.
4. When `disconnectedCallback` is fired it check whether there is `disconnectedCallback()` inside the implemented class and will trigger it. Then it removes an event listener and the call from the global list and also sets a local value to false, which `disconnectedCallback` itself uses to not run the same method in subsequent calls.

### Example

```javascript

  import {UnloadCallbackMixin} from "./unloadCallbackMixin.js"  //[1]

  class unloadElement extends UnloadCallbackMixin(HTMLElement) {
    constructor() {
      super();
    }

    connectedCallback(){                                         //[2]
      this.addEventListener("click", this.someFuction);
    }
    
    disconnectedCallback(){                                      //[4]
      this.removeEventListener("click", this.someFuction);
    }
    
    someFunction(){
      alert("Hello");
    }
    
    unloadCallback() {                                           //[3]
      super.disconnectedCallback();
    }

  }

  customElements.define("unload-element", unloadElement);

```
***
1. Import of mixin. First of all, it will add an element to the global array.
2. Add an event listener.
3. When the user closes the tab `unloadCallback()` will be activated. It will trigger its own `disconnectedCallback()` using the `super` keyword. Belonging to the mixin `disconnectedCallback()` will call `disconnectedCallback()` from `unloadElement` class after which the event listener will be removed. 

```no-highlight
//todo and important comments from Hangouts)
1. The layers are constructor+unload outside, then connected +disconnected on the inside.
2. And that the rule in unloadCallback is to call super.unloadCallback every time it is implemented?
3.  You might need to clean up this array.. Not sure how best to do that. It might not be necessary if it is a weakset and not an array.
4. We might need to trigger the unloadCallback from disconnectedCallback.. Or not. But to see this clearly i need to write the discussion for this thing first.

```

