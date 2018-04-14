# FirstConnectedMixin
The purpose of `FirstConnectedMixin` is to add a callback hook the first time, and only first time, 
the Element is connected to a DOM.
`FirstConnectedMixin` is inspired by the Polymer.ready() callback.

Why do we need 3(!) methods to separate between **constructor-time**, **firstConnectedCallback-time**, 
and (subsequent) **connectedCallback-time**? Well, it is actually not that hard.
1. Browsers can create new HTMLElement instances in two ways: a) Using constructor `new MyHTMLElement()` 
or b) `document.createElement("my-html-element")`. If you create the element via `document.createElement`
the constructor is **not allowed to alter style, attributes, nor shadowDom**.
2. This causes the initial setup of style, attributes and shadowDom (setup of inner content) 
to be moved to `connectedCallback()`, the next callback function supplied by the platform. 
However, connectedCallback is called every time you also re-connect the element to a dom.
So, if you have an element that you often take in and out of the dom, you can end up 
setting up the inner content of your elements multiple times, even though you don't need to rerun 
the setup.
3. Therefore, you would like to have a callback hook that is only triggered the *first time* 
connectedCallback is called, hence `firstConnectedCallback()`.

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
`connectedCallback()` can be achieved by adding a single line [*] inside 
`connectedCallback()`.

```javascript
class MyElement extends HTMLElement {

    connectedCallback() {
      this.__firstTimeConnected || (this.__firstTimeConnected = true && this.firstConnectedCallback()); //[*]
      if (super.connectedCallback) super.connectedCallback();
    }
    
    firstConnectedCallback(){
      this.style = {your: "initialOneTimeStyles"};
      this.shadowRoot.innerHTML ="<p>Set up things you never change</p>";
      this.setAttribute("your-attribute", "initialValue");
    }
  }

```
This line [*] should be placed above calls to `super.connectedCallback()` and the rest of the body
of `connectedCallback()`. This position will make `firstConnectedCallback()` run before the body of 
`connectedCallback()`, and it makes more sense that the body of `firstConnectedCallback()` runs first 
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

## Reasons not to use FirstConnectedMixin 
1. If your element is not reconnected to the DOM multiple times, but is added once, and 
then left alone, then a separation of `firstConnectedCallback()` and regular `connectedCallback()`is
unnecessary.

2. If your custom element uses hyper, lit-html or some other dom-based templating tool that provide 
efficient rewiring of dom, the efficiency benefits of adding `firstConnectedCallback()` might not
outweigh the complexity of splitting `connectedCallback()` in two.

My recommendation is to:
1. Consider if you really need to split `connectedCallback()`, and then don't do it if you don't need to.
2. Use the single line plug if it is just a one time thing, and add a reference in your code to this page.
3. Use the FirstConnectedMixin if you are using several FunctionalMixins or if you use it in several different 
components in your app.