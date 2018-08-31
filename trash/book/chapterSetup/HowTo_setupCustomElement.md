# How to: setup a CustomElement?

Browsers can create new `HTMLElement` instances in four ways. 
1. constructor: `var el = new MyHTMLElement();` (JS).
2. `document.createElement`: `var el = document.createElement("my-element");` (JS).
3. By parsing HTML text using `el.innerHTML = "<my-element></my-element>";` (JS).
4. By parsing HTML text when loading the html document `<my-element></my-element>` (HTML).

When you make a new custom element definition, it `extends HTMLElement`, and 
you want your custom element to be constructable in all these four ways.

## Problem: No attributes can be set in `constructor`
But. There is a problem. An invisible constraint.
You are not allowed to set attribute values in the constructor of `HTMLElement`. Sometimes. 
Let's see it in action:

### Example 1: Attributes in constructor when parsing HTML.
```html
<att-con id="one" can-i-do-this="A"></att-con>                      <!--[1]-->
<script>
  const one = document.querySelector("att-con#one");                  //[2]
  console.log("one", one.getAttribute("can-i-do-this"), one.isSetup, one.constructor.name);
  //one A undefined HTMLElement

  class AttributeConstructor extends HTMLElement {
    constructor(){
      super();
      console.log("*", this.getAttribute("can-i-do-this"));           //[*]     
      this.hasAttribute("can-i-do-this") || this.setAttribute("can-i-do-this", "NoNoNo");//[3]
      this.isSetup = "OK";
    }
  }
  customElements.define("att-con", AttributeConstructor);             //[4]
</script>
                                                     
<att-con id="two" can-i-do-this="B"></att-con>                      <!--[5]-->
<script>
  const two = document.querySelector("att-con#two");                  //[6]
  console.log("two", two.getAttribute("can-i-do-this"), two.isSetup, two.constructor.name); 
  //two B undefined HTMLUnknownElement
</script>
```
1. We create a custom element `att-con#one` using the HTML parser.
`att-con#one` is created *before* any definition for `<att-con>` has been 
registered by `customElements.define`.
2. We check to see what `att-con#one` is.
The element as an attribute as is 
registered as an `HTMLElement`.
3. In the `constructor` of our custom element, 
we try to set a default value for an attribute. 
We expect that the user of the element might have given the attribute a value in his template, and
so we do the proper thing and first check to see if the `can-i-do-this` attribute is already set
before we give it our default value `"NoNoNo"`.
4. When the custom element is registered, 
this triggers the browser to `upgrade` any such custom elements already added to the dom, ie. `att-con#one`.
When `att-con#one` is upgraded, the `constructor` is called on the object.
`att-con#one` already has `can-i-do-this` set to `"A"`. So, `att-con#one` prints `* A`.
`connectedCallback()` would also have been called on `att-con#one` as it is already connected to the DOM.
5. First, the parser starts the `constructor`. 
But, this time, the `constructor` finds no `can-i-do-this` attribute on itself, 
as it did during the previous `upgrade` process, and logs `* null`.               
Then the parser throws an `Error`:
`Uncaught DOMException: Failed to construct 'CustomElement': The result must not have attributes` (Chrome).
The browser then falls back to the `HTMLUnkownElement` as the previous element definition failed,
and completes the construction of `att-con#two` as an `HTMLUnkownElement` and setting the 
`can-i-do-this` attribute with the value it gets from the template `B`.
6. We can see the results from the failed `constructor` here.

We see from this example that when we add an attribute to a custom element in the `constructor`, 
the element:
* **works** when the element is `upgraded`, but
* **fails** when the browser already has registered the custom element definition.

### Example 2: Attributes in constructor when using .innerHTML
```html
<script>
  const div = document.createElement("div");
  div.innerHTML = "<att-con id='three' can-i-do-this='C'></att-con>"; //[1]
  const three = div.children[0];
  console.log("three", three.getAttribute("can-i-do-this"), three.isSetup, three.constructor.name);
  //three C undefined HTMLUnknownElement

  class AttributeConstructor extends HTMLElement {
    constructor(){
      super();
      console.log("*", this.getAttribute("can-i-do-this"));           //[*]     
      this.hasAttribute("can-i-do-this") || this.setAttribute("can-i-do-this", "NoNoNo");
      this.isSetup = "OK";
    }
  }
  customElements.define("att-con", AttributeConstructor);             //[2]
  console.log("three", three.getAttribute("can-i-do-this"), three.isSetup, three.constructor.name); 
  //three C undefined HTMLUnknownElement
  
  document.querySelector("body").appendChild(three);                  //[3]
  //* C
  console.log("three", three.getAttribute("can-i-do-this"), three.isSetup, three.constructor.name);
  //three C OK AttributeConstructor
  
  div.innerHTML = "<att-con id='four' can-i-do-this='D'></att-con>";  //[4]
  //* D
  const four = div.children[0];
  console.log("four", four.getAttribute("can-i-do-this"), four.isSetup, four.constructor.name);
  //four D OK AttributeConstructor
  
  div.innerHTML = "";  
  document.querySelector("body").appendChild(div);                  
  div.innerHTML = "<att-con id='five' can-i-do-this='E'></att-con>";  //[5]
  //* E
  const five = div.children[0];
  console.log("five", five.getAttribute("can-i-do-this"), five.isSetup, five.constructor.name);
  //five E OK AttributeConstructor
</script>
```
1. We create a new `att-con` element using the parser via the `.innerHTML` function.
*Before* the custom element definition is registered the element is an `HTMLUnkownElement` 
with attribute values set from the template.
2. As `att-con#three` is not connected to the DOM, the element is not yet `upgraded`.
3. As soon as `att-con#three` connects to the DOM, the element is `upgraded`.
This runs the `constructor` with no errors.
4. We make a new `att-con` element using the parser via the `.innerHTML` function.
*After* the custom element definition is registered the element is an `AttributeConstructor` 
with attribute values set from the template.
5. Finally we check to see that `.innerHTML` has no problem managing attributes in the `constructor`
even when the parser creates elements that are immediately connected to the DOM.

From this example we see that adding attributes in the `constructor` **works** when we create 
custom elements via `.innerHTML`.
    
### Example 3: Attributes in constructor when `new` and `document.createElement`
                                                    
```html
<script>
  class AttributeConstructor extends HTMLElement {                    //[1]
    constructor(){
      super();
      console.log("*", this.getAttribute("can-i-do-this"));                
      this.hasAttribute("can-i-do-this") || this.setAttribute("can-i-do-this", "NoNoNo");
      this.isSetup = "OK";
    }
  }
  
  try {
    const six = new AttributeConstructor();                           //[2]
  } catch (err){
    console.log(err);
    //TypeError: Illegal constructor
  }
  
  customElements.define("att-con", AttributeConstructor);             
  const seven = new AttributeConstructor();                           //[3]
  //* null
  console.log("seven", seven.getAttribute("can-i-do-this"), seven.isSetup, seven.constructor.name);
  //seven NoNoNo OK AttributeConstructor
  
  const eight = document.createElement("att-con");                    //[4]
  //* null
  //Uncaught DOMException: Failed to construct 'CustomElement'
  console.log("eight", eight.getAttribute("can-i-do-this"), eight.isSetup, eight.constructor.name);
  //eight null undefined HTMLUnknownElement
</script>
```
1. First we define the `AttributeConstructor` class.
2. We then try to create an instance of `AttributeConstructor` using `new` *before* the class is
registered with `customElements.define`. This fails and throws a `TypeError: Illegal constructor`.
This Error is not connected with the attributes set in the constructor, but 
is thrown whenever you try to create a `new` element of a subclass of `HTMLElement` that has not yet 
been registered with `customElements.define`.
3. We then register the `AttributeConstructor` class with `customElements.define` and try again.
This time it works fine.
4. When we try to use `document.createElement` it fails and falls back to the `HTMLUnknownElement`
constructor in the same way as the main document HTML parser did in example 1.

From this example we see that setting attributes in the constructor:
* **works** when we create custom elements using `new`, but
* **fails** when we create custom elements using `document.createElement`.

## Solution 1: sync `setupCallback()` (first `connectedCallback()`)

A simple alternative is to trigger `setup` tasks from `connectedCallback()`.
The problem with using `connectedCallback()` for `setup` tasks is that it can be called several times.
This might not seem all that relevant to begin with, but if you use a template manager such as 
lit-html, it caches and reuses elements that it connects and reconnects to the dom as needed. 
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

## Example: GoBananas using first `connectedCallback()`
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

## Solution 2: async `setupCallback()` (`requestAnimationFrame()`)

Another alternative trigger for `setupCallback()` is `requestAnimationFrame()`.
When the `constructor()` runs, we can que a callback to `setupCallback()` to be triggered 
before the next render. Like this:

```javascript
  constructor(){
    super();
    ...
    requestAnimationFrame(() => this.setupCallback());
  }
  
  setupCallback() {
    ...
  }
```
By placing `setupCallback()` in the `requestAnimationFrame` task que, 
we are exerting more control over when the `setupCallback()` task will be executed.
This control is useful, and can be used to control the setup of the custom element asynchronously.
The use of this control will be demonstrated later in this chapter.

## Race condition: `setupCallback()` vs `connectedCallback()`
But, what if the custom element is connected to the DOM *before* the next `requestAnimationFrame`?
And, the tasks in `connectedCallback()` depends on `setupCallback()` having been executed?
This scenario is not only very problematic, it is also very likely.

To solve this scenario requires an adaptation to both `setupCallback()` and `connectedCallback()`.
1. If `connectedCallback()` is called before `setupCallback()` has been executed, 
then we should abort the `connectedCallback()` while awaiting `setupCallback()`.
2. If `setupCallback()` is called after the element has already been connected to the DOM
(and thus had its `connectedCallback()` aborted), `setupCallback()` should trigger `connectedCallback()`
itself when it completes.

```javascript
  constructor(){
    super();
    ...
    requestAnimationFrame(() => this.setupCallback());
  }
  
  setupCallback() {
    ...
    this.isSetup = true;
    if (this.isConnected) this.connectedCallback();
  }

  connectedCallback() {
    if (!this.isSetup) return;
    ...
  }
```

## Example: GoBananas using `requestAnimationCallback()`
In this example, we create the same custom element `GoBananas` and `setupCallback()` method.
The only difference here is that instead of triggering `setupCallback()` from the first 
`connectedCallback()`, we will essentially que both using `requestAnimationCallback()`.

```html
<script>
  class GoBananasRAF extends HTMLElement {
  
    constructor(){
      super();
      this.mentalState = "bananas";                                                
      requestAnimationFrame(() => this.setupCallback());                           //[1]
    }
    
    setupCallback(){                                                               
      this.hasAttribute("go") || this.setAttribute("go", this.mentalState);        
      this.isSetup = true;                                                         //[2]
      if (this.isConnected) this.connectedCallback();                              //[3]
    }
    
    connectedCallback(){
      if (!this.isSetup) return;                                                   //[4]
      //if (super.connectedCallback) super.connectedCallback();                    
      console.log("go " + this.getAttribute("go"));                                
    }
  }
  customElements.define("go-bananas-raf", GoBananasRAF);
</script>

<go-bananas-raf id="one"></go-bananas-raf>                                                
<go-bananas-raf id="two" go="crazy"></go-bananas-raf>                                     

<script>
  const body = document.querySelector("body");
  const one = document.querySelector("#one");
  setTimeout(()=> body.removeChild(one), 1000);                                    
  setTimeout(()=> body.appendChild(one), 2000);                                    
  setTimeout(()=> body.removeChild(one), 3000);                           
  setTimeout(()=> one.setAttribute("go", "insane"), 4000);                         
  setTimeout(()=> body.appendChild(one), 5000);                                    
</script>
<!--
 go bananas                                                        //[5]
 go crazy
 go bananas                                                        //[6]
 go insane
-->
```                                                                   
1. In the `constructor()` a the `this.setupCallback()` is qued in `requestAnimationFrame`.
2. When `setupCallback()` has executed, this is registered using the property `isSetup`.
3. If the element has already been connected to the DOM when `setupCallback()` runs,
`connectedCallback()` is triggered. 
4. At the *absolute beginning* of `connectedCallback()`,
the `isSetup` state of the element is checked. If the element is not yet setup, 
the `connectedCallback()` aborts.
5. The browser does not trigger its `requestAnimationFrame` until all the synchronous scripts
in the document has completed. Therefore, the `setupCallback()` and `connectedCallback()` are not 
run while the page loads, but after.

## Problem: Mixin Isolation 

To control the timing of `setupCallback()` has many benefits. 
And if we could store the 
The act of *aborting* `connectedCallback()` in lieu of `setupCallback()` by checking the elements 
`isSetup` state is problematic. 

There is no getting around the `if(!this.setup) return;` when making a mixin of this.
All the other complexity regarding `setupCallback` can be encapsulated in a mixin, but 
*not* `if(!this.setup) return;`. 
We can mask the value as a symbol with a getter, like this:
`get isSetup(){
  return this[isSetup];
}`
And, this becomes an extra dependency for the custom element.

But, we don't get away from the 

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