# Pattern: TheEnd

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
If thousands of users/browsers behave in this manner,
the poor server starts hoarding memory and sockets for users that are no longer connected,
slowing or blocking the service for users that are still connected.
 
![Why close db connections](https://preview.ibb.co/nHqPyz/Corel_DRAW_X7_Graphic.png)

## Problem 2: please tell me how it ends!

The ending is not only important in a good book.
For a good app a successful ending is also important. For example:

 * A reading app needs to preserve a user's last known reading position.
   When the reading app knows your last position, it can give you smooth beginning when you return.

 * A web shop needs to know when their users leave.
   If some products or pages always trigger their customers to leave abruptly,
   you might want to consider updating the product pictures, prices and/or page template. 

## (dis)connectedCallback as alternative to constructor/destructor-pair

Programming languages such as C++ and PHP5 provide a destructor callback used when objects die.
Destructors provide the programmer with an end-of-life callback for objects
that mirrors the start-of-life callback `constructor()`.
The constructor and destructor form a pair that enables the
programmer to ensure that a session is properly initialized and properly cleaned up.
The constructor and destructor frame such sessions around the life of an object.
JS does not provide a destructor since it uses automatic garbage collection.

However, JS and `HTMLElement` provides another start-and-end-of-*session* callback pair:
the (dis)connectedCallback-pair: ie. `connectedCallback()` and `disconnectedCallback()`.
This pair frames their session around the period an object is connected to the DOM, 
not around the life of an object.

The (dis)connectedCallback-pair is a good alternative lifecycle for higher order tasks such 
as closing database connections and registering the end of user interaction:
as long as we can match the session we need to monitor
with a set of start-and-end-of-*session* callbacks,
it does not matter if the session is bound to an object's life or 
an object-connected-to-DOM-period. 

## Problem 3: `unload` skips `disconnectedCallback()`

But, there is one way the user can end a session *while* an element is connected to the DOM 
*without* triggering `disconnectedCallback()`: **closing the browser window/tab**.

When the user closes a tab or browser (or other document), 
he destroys an entire DOM of connected elements.
But destroying the whole DOM in this way does not trigger `disconnectedCallback()`.
So, this is a crack in the (dis)connectedCallback lifecycle.
And if we intend `connectedCallback()` and `disconnectedCallback()` to function as 
non-leaky, complete  start-and-end-of-*session* callbacks, then we must fill in this crack.

## Pattern: TheEnd

When a page is closed, the browser dispatches an `unload` event.
Thus, with the exceptions of software or hardware crash (which we in any case cannot work around),
an element is never deleted without either:
* its `disconnectedCallback()` being called, or
* an `unload` event is dispatched on the `document` object.

Therefore, to close the loophole, we simply need to add an event listener for the `unload` event
listener that calls an element's `disconnectedCallback()` that remains active as long as the element 
`isConnected`.

```javascript
class UnloadElement extends HTMLElement {

  constructor(){
    super();
    this._theEnd = this.disconnectedCallback.bind(this);
  }
  connectedCallback(){
    document.addEventListener("unload", this._theEnd);
  }
  disconnectedCallback(){
    document.removeEventListener("unload", this._theEnd);
  }
}
```

## References
* [JScript Memory Leaks](http://crockford.com/javascript/memory/leak.html)
* [destructor](https://en.wikipedia.org/wiki/Destructor_(computer_programming))
* [finalizer](https://en.wikipedia.org/wiki/Finalizer)