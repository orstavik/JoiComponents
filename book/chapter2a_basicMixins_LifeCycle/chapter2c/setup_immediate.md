# Setup: Immediate

> TLDR: trigger `setupCallback()` *immediately before* the `connectedCallback()` is executed.
> Add `this.isSetup || (this.setupCallback(), this.isSetup = true);`
> at the *very* beginning of `connectedCallback()`.
> The `.isSetup` property is added to the element, and set to true once the element has set up.

When an element is created and immediately added to the DOM, 
the element must be setup:
1. *after* the `constructor()` has completed,
2. *after* attributes from HTML template has been set on an element, and
3. *before* the `connectedCallback()` has been executed.

This gives us two alternatives for triggering a `setupCallback()`:
1. queued *after* the constructor has run *and* the HTML template attributes has been set, or
2. triggered *immediately before* the `connectedCallback()` is executed.

We try both alternatives.

## Anti-pattern: Trigger `setupCallback()` immediately from the `constructor()`

First, a `setupCallback()` could be queued from the `constructor()` in the micro-task que:

```html
<script>
class MyElement extends HTMLElement {
  
  constructor(){
    super();
    Promise.resolve().then(()=> this.setupCallback());
  }
  
  setupCallback(){
    console.log("is already connected? " + this.isConnected);
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//is already connected? false
//html-attribute? null
//"Uncaught DOMException: Failed to construct 'CustomElement': The result must not have attributes"
</script>

<my-element html-attribute="yes"></my-element>
```

As this example shows, the micro-task que is triggered *before* HTML attributes has been set.
This both fails to detect the `html-attribute` in the template, *and* throws the
`"Uncaught DOMException: Failed to construct 'CustomElement': The result must not have attributes"`. 

Second, we try to trigger `setupCallback()` from the `constructor()` using `requestAnimationFrame`:
```html
<script>
class MyElement extends HTMLElement {
  
  constructor(){
    super();
    requestAnimationFrame(()=> this.setupCallback());      //same example, only this line changed
  }
  
  setupCallback(){
    console.log("is already connected? " + this.isConnected);
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//is already connected? true
//html-attribute? yes
</script>

<my-element html-attribute="yes"></my-element>
```

As this example shows, `setupCallback()` is now correctly executed *after* the attributes has been set,
but now also *after* the element has been connected to the DOM, which is too late.

No other task ques or events or callbacks (except `connectedCallback()`)
will trigger `setupCallback()` *after* HTML attributes has been set and *before* 
`connectedCallback()` has been executed (without delaying `connectedCallback()`).
Triggering `setupCallback()` immediately from the `constructor()` therefore fails.

## Pattern: `setupCallback()` immediately before the very first `connectedCallback()`

However, `connectedCallback()` is always triggered *after* HTML attributes have been set.
And, to ensure that a method will run immediately *before* the execution of other logic 
in `connectedCallback()`, we simply have to place a call to this method at the *very* beginning 
of the `connectedCallback()`.

```javascript
connectedCallback() {
  this.isSetup || (this.isSetup = true, this.setupCallback());
  super.connectedCallback();
  //do your other stuff here
}
```
This approach uses a "punchline".
A punchline is one or two lines of dense, minified code.
Punchlines are designed to be directly copied into the code, 
not used via function calls or class extensions.
Although rarely funny, a punchline should "pack a punch" and 
do more than you would expect of a regular line of code.

Below is the same code punchline written with more familiar punctuation and comments:
```javascript
connectedCallback() {
  if (!this.isSetup){     //this.isSetup is assumed to be undefined the first time 
    this.isSetup = true;  //set this.isSetup to true, 
    this.setupCallback(); //so that the setupCallback() is only called once, the first time
  }
  super.connectedCallback();
  //do your other stuff here
}
```

## Example: FirstConnected

```html
<script>
class MyElement extends HTMLElement {
  
  connectedCallback(){
    this.isSetup || (this.setupCallback(), this.isSetup = true);     //[1]
    //super.connectedCallback();                                     //[2]
    console.log("running connectedCallback");
  }
  
  setupCallback(){
    console.log("running setupCallback");
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//running setupCallback
//html-attribute? yes
//running connectedCallback
</script>

<my-element html-attribute="yes"></my-element>
```
1. `this.isSetup || (this.setupCallback(), this.isSetup = true);` runs `setupCallback()` 
*only the first time* and *before* `connectedCallback()` executes.
It also sets the property `.isSetup` to true on the element.
2. Even calls to `super.connectedCallback();` must be placed after this one line wonder.
Although mixins that rely on the element calling `super.connectedCallback();` should be
isolated from any dependencies from the elements `setupCallback()` 
(and thus probably would remain unaffected),
placing the single line wonder at the very beginning of `connectedCallback()`
clearly states the two lifecycle callbacks position against each other.

## Example: SetupFirstConnectedMixin
The above solution can also be implemented as a mixin.

```html
<script>
function SetupFirstConnectedMixin(Base){
  return class SetupFirstConnected extends Base {
    connectedCallback(){
      this.isSetup || (this.setupCallback(), this.isSetup = true);
      super.connectedCallback && super.connectedCallback();
    }
  }
}

class MyElement extends SetupFirstConnectedMixin(HTMLElement) {
  
  connectedCallback(){
    super.connectedCallback();                                     
    console.log("running connectedCallback");
  }
  
  setupCallback(){
    console.log("running setupCallback");
    console.log("html-attribute? " + this.getAttribute("html-attribute"));
    this.setAttribute("is-this", "ok?");
  }
}
customElements.define("my-element", MyElement);
//running setupCallback
//html-attribute? yes
//running connectedCallback
</script>

<my-element html-attribute="yes"></my-element>
```

## Discussion: Benefits of using a "punchline" for immediate setupCallback()

There is a complexity issue both when using the mixin and a punchline.
If you are familiar with the mixin concept and perhaps use several other mixins in your project
and around the same element, mixin might sound appealing at first.
But, here I will try to convince you why you should give the punchline approach a chance here.

First. **Complexity**. 
At first sight, the punchline *looks too clever*. 
It formally oozes I'm-too-smart-for-my own good, and thus *feels fragile*. 
All your instincts tell you to back off.
I feel you. And I feel the code the same way.

But. It is actually a punchline. A single line.             
To understand it and feel confident in it, you likely want to re-write it out in normal notation.
But since it is just a single line, that is actually ok.
Think of such re-write of a punchline as the equivalent of quick reading the source of a similar mixin.

Second. **Context**.
The punchline is used inside the `connectedCallback()` of custom elements.
It is meant to intercept the flow of control *from* the `connectedCallback()` even *before*
that control is passed on to any of the other mixins (*before* `super.connectedCallback()`).

But, using a mixin this is hard to accomplish.
If one of the other mixins also breaks the isolation rules and 
*do* perform another action before passing the control to the `setupCallback()` mixin, 
the mixin approach cannot fully control this context and timing.

By using the punchline directly in the `connectedCallback()` and not via a mixin,
this context that setupCallback will be run at the *very* beginning can be guaranteed.

Third. **delayed setupCallback needs the punchline approach**.
This will be explained in a later chapter.

Fourth. **Documented**. 
The hallmark of too clever code is lack of documentation. This is not the case here.
On the contrary. This single line is made with intent. 
It is backed by several hundred lines of documentation describing the problem it solves, 
its logic and pitfalls.
Yes, it is a minified punchline. 
But no, it is not obfuscated.

All these reasons point to the fact that an immediate setupCallback implementation is best
implemented with a punchline.

## Reference
 * todo find documentation on Polymer .ready()
 * todo have anyone else described how to write punchlines for others to use? guidelines here i can reference?