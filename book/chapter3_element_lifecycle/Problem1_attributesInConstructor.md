# Problem: No attributes can be set in `constructor` of `HTMLElement` subclasses

> TLDR: **You cannot set default HTML attributes values in your custom elements' `constructor`.**

## What's the point of HTML attributes?

HTML attributes are useful since they can be accessed from both HTML, CSS and JS.
HTML attributes can be set in HTML template directly.
HTML attrbiutes and their value can be used to toggle CSS rules.
And in JS `.getAttribute`, `.setAttribute` and `.attributeChangedCallback` can be used to
update and respond to attribute values. 

Sure. HTML attributes has its limitations. HTML attributes are string values only.
And if you store too much or complex data in your HTML attributes, you obfuscate your HTML template.
Therefore, in some situations we store data concerning an element's state as regular JS object properties.
JS object properties can hold other primitive datatypes and bigger objects.

But. Regular JS object properties cannot be directly accessed from neither HTML nor CSS.
So, if you store some part of the state of an HTML element as a regular property,
then if that state change needs to be reflected in the view or set from the HTML side,
then that property needs to be translated or marshalled into an underlying attribute.
The complexity, redundancy and processing associated with such translation and marshalling is
something we in general would like to avoid.

Therefore:
 * if the state of the HTML element might be settable from HTML template or read from CSS in a future use-case, 
 * and the drawbacks of storing the state as a string are not too big (ie. big data value or structure), 
 * then HTML attributes should be used to store the state information.

HTML attributes is the default property structure of HTML elements/DOM nodes.

## Different ways to create an `HTMLElement`?

Browsers can create new `HTMLElement` instances in five ways. 
1. constructor: `var el = new MyHTMLElement();` (JS).
2. `document.createElement`: `var el = document.createElement("my-element");` (JS).
3. By parsing HTML text using `innerHTML`: `el.innerHTML = "<my-element></my-element>";` (JS).
4. By parsing HTML text when loading the html document `<my-element></my-element>` (HTML).
5. By cloning an element: `.cloneNode(deep)` (JS).

When you make a new custom element definition, it `extends HTMLElement`, and 
you want your custom element to be constructable in all five ways.

But. There is a problem. An invisible constraint.
Sometimes you are not allowed to set attribute values in the constructor of `HTMLElement`.
Here we will go through some examples to pinpoint this problem.

## Example 1: Attributes in constructor when parsing HTML.
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

## Example 2: Attributes in constructor when using .innerHTML
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
    
## Example 3: Attributes in constructor when `new` and `document.createElement`
                                                    
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

## Conclusion: setupCallback() is needed

As the failing examples in 1 and 3 above show, 
a custom element cannot safely read or set default attribute values in the constructor.
We therefore need a "second" `constructor()` to setup the element.
This is a little bit disappointing. From the outset it feels.. wrong.
The problem is, as long as the normal `constructor()` of HTML element does not know of its attributes,
then there is no better way forward.

In the next chapter, we look in detail at *when* we want to setup elements.
Then, we look at how we can implement a second constructor as `setupCallback()`.
In this chapter, we also look at the problem of constructing elements from `.cloneNode(deep)`
and how to solve it.

## References
 * todo
 
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