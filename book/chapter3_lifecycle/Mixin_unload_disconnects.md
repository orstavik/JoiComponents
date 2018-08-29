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
 
![Why close db connections](https://preview.ibb.co/nHqPyz/Corel_DRAW_X7_Graphic.png)

## Problem 2: please tell me how it ends!

The ending is not only important in a good book.
For a good app a successful ending is also important. For example:
 * A reading app needs to preserve a user's last known reading position.
   When the reading app knows your last position, it can give you smooth beginning when you return.
 * A web shop needs to know when their users leave.
   If some products or pages always trigger their customers to leave abruptly,
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
This pair frames their session around the period an object is connected to the DOM, 
not around the life of an object.
This works fine for higher order tasks such as closing database connections and 
registering the end of user interaction;
as long as we can match the session we need to monitor
with a set of start-and-end-of-*session* callbacks,
it does not matter if the session is bound to an object's life or 
an object-connected-to-DOM-period. 

## Problem 3: Closing the browser does not trigger `disconnectedCallback()`
In order to remove and delete an HTMLElement that is connected to the DOM in a running app,
that element must always first be disconnected from the DOM, thus triggering `disconnectedCallback()`.
But, there is one way the user can end a session *while* an element is connected to the DOM 
*without* triggering `disconnectedCallback()`: **closing the browser (tab)**.

When the user closes a tab or browser (or other document), 
he destroys an entire DOM of connected elements.
But destroying the whole DOM in this way does not trigger `disconnectedCallback()`.
And this is a loophole.
If we intend `connectedCallback()` and `disconnectedCallback()` to function as 
non-leaky start-and-end-of-*session* callbacks for app purposes such as closing server connections, 
we must close this loophole.

## Pattern: `unload` disconnects
When a page is closed, the browser dispatches an `unload` event.
This means that an element that `isConnected` to the DOM cannot be disconnected again
without one of two things occuring:
* either its `disconnectedCallback()` is triggered,
* or the `unload` event is dispatched.

Therefore, to close the loophole, we simply need to add an event listener for the `unload` event
that calls an element's `disconnectedCallback()` that is active as long as the element is connected.
This way, in both instances, an element's `disconnectedCallback()` should always be called. 

```javascript
class UnloadElement extends HTMLElement {

  connectedCallback(){
    document.addEventListener("unload", this.disconnectedCallback.bind(this));
    console.log("I always start a session");
  }
  disconnectedCallback(){
    document.removeEventListener("unload", this.disconnectedCallback.bind(this));
    console.log("I always end the session");
  }
}
```

## Mixin: `UnloadDisconnects`
To simplify the element code, we can setup an `UnloadDisconnects` mixin.

```javascript
function UnloadDisconnectsMixin(Base) {
  return class UnloadDisconnectsMixin extends Base {
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      document.addEventListener("unload", this.disconnectedCallback.bind(this));
    }
    disconnectedCallback(){
      super.disconnectedCallback && super.disconnectedCallback();
      document.removeEventListener("unload", this.disconnectedCallback.bind(this));
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