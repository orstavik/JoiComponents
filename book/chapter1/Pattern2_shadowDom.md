# Pattern 2: How to create a shadowDom

There are many different ways to create a shadowDom. It is easy to get confused. 
Here I will describe four different strategies to make a shadowDom in quick succession 
in order to give you a quick overview of the alternatives.
These strategies go from the basic to the most complex and elaborate:
1. Raw strategy: `.innerHTML`,
2. Basic strategy: `.innerHTML` + `firstConnectedCallback`,
3. Template strategy: `HTMLTemplateElement` + `.firstConnectedCallback()`, and
4. template engine such as hyperHTML or lit-html.

These strategies all have their use. Sometimes the element does not require neither a template 
nor a mixin nor a template engine such as hyperHTML or lit-html. 
In such instances, the basic `HTMLElement.innerHTML` method can and should be used.
Other times, more complex operations or use should be alleviated using templates, mixins, or 
a template engine.

## Raw strategy: .innerHTML
```javascript
class RawComponent extends HTMLElement {
  
  constructor(){                                                    
    super();
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback(){
    this.shadowRoot.innerHTML = "<span>the</span> <span>basics1</span>";
  }
}
```
This basic setup creates and sets the content of the shadowRoot every time the element is attached 
to the DOM. Choose this strategy when:
1. there are no (hackable) variables in your template (innerHTML is not safe with variables),
2. the template does not need to change,
3. few instances are made of the element (as the innerHTML needs to be run for every element), and
4. the element is not attached and then reattached to the DOM (as everything is parsed at any reconnect).

## Basic strategy: .innerHTML + .firstConnectedCallback()
```javascript
class BasicComponent extends HTMLElement {
  
  constructor(){                                                    
    super();
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback() {                                             //[1]
    this.__firstTimeConnected || ((this.__firstTimeConnected = true) && this.firstConnectedCallback());
  }
  
  firstConnectedCallback(){                                         //[2]
    this.shadowRoot.innerHTML = "<span>the</span> <span>basics2</span>";
  }
}
```
1. we add the [`.firstConnectedCallback()` pattern](../chapter3/Mixin4_FirstConnectedMixin.md). 
2. This pattern adds a check that triggers a method `.firstConnectedCallback()` *only* the first time is connected to the DOM.

Choose **Basic strategy** over the **Raw strategy** when elements can be reattached to the DOM multiple times.
In [chapter 3, .firstConnectedCallback()](../chapter3/Mixin4_FirstConnectedMixin.md) you can read more 
about why and how you need to relate to a custom elements life cycle methods 
`constructor()`, `connectedCallback()` and  `disconnectedCallback()`.

## Template strategy: HTMLTemplateElement + .firstConnectedCallback()
```javascript
const template = document.createElement("template");            //[1]
template.innerHTML = "<span>the</span> <span>basics3</span>";   //[2]
                                                
class TemplateComponent extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback() {
    this.__firstTimeConnected || (this.__firstTimeConnected = true && this.firstConnectedCallback());
  }
  
  firstConnectedCallback(){
    this.shadowRoot.append(template.content.cloneNode(true));   //[3]
  }
}
```
1. An `HTMLTemplateElement` object is setup outside of the custom element.
2. A set of elements is added to the template using `.innerHTML`.
3. A *clone* of the `template.content` is added to each element. 
This means that only the clone is performed is only performed per element instance, 
while the more expensive .innerHTML is performed only one time for all elements of this type.

Choose `**Template strategy** over **Basic strategy** if you create *many* instances of the same element.                

## Template engine strategy: hyperHTML
```javascript
import hyperHTML from 'https://unpkg.com/hyperhtml?module';

class HyperComponent extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.html = hyperHTML.bind(this.shadowRoot);            //[1]
  }
  
  connectedCallback() {
    let a = "the";
    let b = "basics4";
    this.html`<span>${a}</span> <span>${b}</span>`;         //[2]
  }
}
```
1. Adds the custom template engine for this element as a tag-function for string literals called `this.html`.
2. use `this.html` to update the element shadowDom.

Both hyperHTML and lit-html create efficient and safe ways to include variables in your template.
Under the hood, both use the templates described in Template strategy.
But, hyperHTML and lit-html reuse templates across elements of different types,
and they use clever analysis to:
* do zero updates when zero variables changes,
* *only* update the part of the template that change, and
* add references to listener functions using the .addEventListener API where appropriate.

Choose **Template engine strategy** when the content of the template might change.
                              
#### References
* [hyperHTML](https://viperhtml.js.org/hyper.html)
* [lit-HTML](https://github.com/Polymer/lit-html)                                                                                           