# FirstConnectedMixin
The purpose of `FirstConnectedMixin` is to add a callback hook the first time, 
and only first time, an element is connected to the DOM.
`FirstConnectedMixin` is inspired by the Polymer.ready() callback.

<!--
todo add an image of the lifecycle methods constructor, connectedCallback, disconnectedCallback.
-->

Why do we need a callback at both **constructor-time**, **firstConnectedCallback-time**, 
and (repeated) **connectedCallback-time**?
1. Browsers can create new HTMLElement instances in three ways: 
   * Using constructor `new MyHTMLElement()`,
   * `document.createElement("my-html-element")`, and
   * from parsed HTML text.

2. If you create the element via `document.createElement`, 
then the element's constructor **cannot add any attributes to the element**.
This restriction does not apply to elements created via the `constructor()` 
or parsed from text. Because of this restriction, 
the initial setup of attributes must be moved from constructor-time to connectedCallback-time.

3. If an element is taken out and added to the DOM often, and 
the element is doing the initial set up in its `connectedCallback()` method all the time,
then you are both wasting time and resources and cluttering up the logic of the `connectedCallback()`
function with code that you ideally would like to run only once at constructor-time.

4. In such cases, you would like to have a callback hook that is only triggered the 
*first time* connectedCallback is called: `firstConnectedCallback()`.

### Example of use:

```javascript
import {FirstConnectedMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/FirstConnectedMixin.js";

class AlloAllo extends FirstConnectedMixin(HTMLElement) {

  firstConnectedCallback(){
    console.log("1. I will tell this only once.");
  }
  
  connectedCallback(){
    super.connectedCallback();
    console.log("2. Do you remember what I told you.");
  }
}
customElements.define("allo-allo", AlloAllo);
```                                                                   
and you can test it like this:

```javascript
const allo = document.createElement("allo-allo");
const body = document.querySelector("body");
setTimeout(()=> body.appendChild(allo), 0);
//1. I will tell this only once.
//2. Do you remember what I told you.
setTimeout(()=> body.removeChild(allo), 1000);                           
setTimeout(()=> body.appendChild(allo), 2000);
//2. Do you remember what I told you.
setTimeout(()=> body.removeChild(allo), 3000);
setTimeout(()=> body.appendChild(allo), 4000);
//2. Do you remember what I told you.
```                      

Test it out on [codepen](https://codepen.io/orstavik/pen/pLmYEM).

## `firstConnectedCallback()` as a single line plug (alternative to mixin).
To create a `firstConnectedCallback()` that runs just *before* the first 
`connectedCallback()` can be set up with a single line [*] in `connectedCallback()`.

```javascript
class MyElement extends HTMLElement {

    connectedCallback() {
      this.__firstTimeConnected || ((this.__firstTimeConnected = true) && this.firstConnectedCallback()); //[*]
      if (super.connectedCallback) super.connectedCallback();
    }
    
    firstConnectedCallback(){
      this.style = {your: "initialOneTimeStyles"};
      this.shadowRoot.innerHTML ="<p>Set up things you never change</p>";
      this.setAttribute("your-attribute", "initialValue");
    }
  }

```
This line [*] should be placed above calls to `super.connectedCallback()` 
and the rest of the body of `connectedCallback()`. 
This position will make `firstConnectedCallback()` run before the body of `connectedCallback()`, 
and it makes more sense that the body of `firstConnectedCallback()` runs first 
and the body of `connectedCallback()` second. The full implementation is equally simple.

```javascript
const firstConnect = Symbol("firstConnect");
class FirstConnectedMixin extends HTMLElement {

    constructor() {
      super();
      this[firstConnect] = true;
    }

    connectedCallback() {
      if(this[firstConnect]) {          //ATT!!
        this[firstConnect] = false;
        this.firstConnectedCallback();
      }
      if (super.connectedCallback) super.connectedCallback();
    }
  }
```

## When not to use FirstConnectedMixin 
1. If your element is not reconnected to the DOM multiple times, but is added once, and 
then left alone, then a separation of `firstConnectedCallback()` and regular `connectedCallback()`is
unnecessary.

2. If your custom element uses hyper, lit-html or some other DOM-based templating tool that 
provide efficient rewiring of DOM nodes, the efficiency benefits of adding 
`firstConnectedCallback()` might not outweigh the complexity of splitting 
`connectedCallback()` in two.

## Opinionated advice
1. Consider if you really need to split `connectedCallback()`, and don't use it if you don't need it.
2. Use the single line plug if it is just a one time thing, and add a reference in your code to this page.
3. Use the FirstConnectedMixin if your element is already using several FunctionalMixins.
4. Use the FirstConnectedMixin if you set up `firstConnectedCallback()` in several different 
components in your app.

## Reference
 * find documentation on Polymer .ready()