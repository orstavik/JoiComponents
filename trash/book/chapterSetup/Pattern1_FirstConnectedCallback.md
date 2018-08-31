# Pattern: FirstConnectedCallback

Instead of using the `constructor()`, we can run setup task from `connectedCallback()`.
However, the main problem with using `connectedCallback()` for `setup` tasks is 
that `connectedCallback()` can be called several times.

This might not seem all that critical at first. 
After all, you often do not *intend* to disconnect and reconnect your elements.
However, there are some use-cases where elements are connected and disconnected many times
without us thinking of it.
To connect a branch of cached DOM elements is much faster than having to recreate the whole branch from 
scratch and then connecting them.
Caching disconnected elements is therefore a strategy that many template libraries 
(such as hyperHTML and lit-html) rely on, and therefore your elements can be disconnected and 
reconnected many times without you thinking about it.

> ATT! caching of elements also cache their current state. 
An important task for `connectedCallback()` is therefore to *reset* the element so that
any old state lingering from a previous session does not leak into and disturb a new session.

## First `connectedCallback()`

Therefore, if we use `connectedCallback()` to trigger our `setup` task, we must ensure that 
our `setup` task is *only* called the *first* time `connectedCallback()` is run.
In addition, our `connectedCallback()` might need access to attributes or other resources 
constructed in the `setup` task. We must therefore also ensure that our `setup` task is run *before*
any other `connectedCallback()` tasks.

To do so is simpler than it sounds. In fact, it can be achieved with a single line of code placed
at the very beginning of your custom elements `connectedCallback()`:
```javascript
this._wasConnected || ((this._wasConnected = true) && this.setupCallback());
```
This single line of code, when placed at the very beginning of `connectedCallback()`, 
will make sure that:
* a reactive callback method `setupCallback()`
* will be called *only once*
* immediately before other `connectedCallback()`tasks
* the first time the element is connected to the DOM.

## Example: GoBananas
In this example, we create a custom element called `GoBananas` with a `setupCallback()` method.
`GoBananas` uses the `setupCallback()` to setup its default attribute values, and 
prints them to the console every time it is connected to the DOM.

```html
<script>
  class GoBananas extends HTMLElement {
  
    constructor(){
      super();
      this.mentalState = "bananas";                                                //[1]
    }
    
    setupCallback(){                                                               //[2]
      this.hasAttribute("go") || this.setAttribute("go", this.mentalState);        //[3]
    }
    
    connectedCallback(){
      this._wasConnected || ((this._wasConnected = true) && this.setupCallback()); //[4]
      //if (super.connectedCallback) super.connectedCallback();                    //[5]
      console.log("go " + this.getAttribute("go"));                                //[6]
    }
  }
  customElements.define("go-bananas", GoBananas);
</script>

<go-bananas id="one"></go-bananas>                                                <!--7 go bananas-->
<go-bananas id="two" go="crazy"></go-bananas>                                     <!--8 go crazy-->

<script>
  const body = document.querySelector("body");
  const one = document.querySelector("#one");
  setTimeout(()=> body.removeChild(one), 1000);                                    //   go bananas
  setTimeout(()=> body.appendChild(one), 2000);                                    //[9]
  setTimeout(()=> body.removeChild(one), 3000);                           
  setTimeout(()=> one.setAttribute("go", "insane"), 4000);                         //[10]
  setTimeout(()=> body.appendChild(one), 5000);                                    //   go insane
</script>
```                                                                   
1. In the `constructor()` a property `mentalState` is set to "bananas" by default.
2. The custom element adds a reactive callback method `setupCallback()` to itself.
3. When `setupCallback()` is triggered, it will check to see if the user of the custom element
has not already set the attribute in the template. 
If no attribute value is set, it will set the attribute to `"bananas"`.
4. At the *absolute beginning* of `connectedCallback()` a single line check and call to `setupCallback()` is added.
The first time `connectedCallback()` is called, `this._wasConnected` is `undefined`.
`this._wasConnected` is then immediately set to true, and `this.setupCallback()` is called.
The next time connectedCallback() runs, `this._wasConnected` is true and `||` check will return *before* 
`this.setupCallback()` is triggered again.
5. Place this line also *above* any call to `super.connectedCallback()`.
6. `connectedCallback()` prints the value of the `go` attribute to the screen.
7. A custom element `<go-bananas#one>` is created via the HTML parser,
*after* the custom element definition is registered. The custom element is immediately connected to the DOM.
As the `go`-attribute is not set on the element, it will therefore get the default value `"bananas"`.
As the custom element is connected to the DOM, it prints `go bananas`. 
8. `<go-bananas#two>` has a `go`-attribute set to `"crazy"`. It prints `go crazy`.
9. After a second, `<go-bananas#one>` is removed from the DOM.
After two seconds, the same `<go-bananas#one>` element is then readded to the DOM.
As `this._wasConnected` has been set to true on the element, `setupCallback()` is not triggered.
The rest of `connectedCallback()` is run as expected and prints `go bananas`.
10. The next time `<go-bananas#one>` is disconnected and then re-connected to the DOM, 
the `go` attribute is set to `"insane"`. Setup is not called now neither, and 
the `connectedCallback()` prints `go insane`.

## FirstConnectedCallback is sync with `connectedCallback()`

When we run `setupCallback()` as an immediate precursor to the first `connectedCallback()`,
`setupCallback()` is in **sync** with the current timeline between the of the native callbacks.
It is not sync with the `constructor()`, as this is impossible to achieve.
But it *is* sync with `connectedCallback()`, and as we can and do trust that the browser manages
the timeline of our custom element callbacks correctly, we can trust the timing of
`setupCallback()` using the FirstConnectedCallback pattern.

But. We like **async** too. Async can enable us to do more things at the same time, 
and thus achieve our users' objectives faster. In the next chapter we will therefore look at
executing `setupCallback()` async.

## References


<!--
Therefore, if your custom element needs to add or organize its attributes at creation-time, 
and you only have the `constructor()` and `.connectedCallback()` to choose from,
you must organize your elements every time the element is connected to the DOM.
But, an element can be connected and reconnected multiple times during its lifecycle.
And these times are likely to be performance sensitive, 
as elements can often be attached to the DOM as part of a bigger branch. 
Hence, it is less than ideal to do more work than strictly necessary at `connectedCallback()`.
So, If you only need to set up your attributes once, 
you would like to have a callback hook that is triggered sometime *after* the 
`constructor()` but *before* the `connectedCallback()`: `firstConnectedCallback()`.
-->