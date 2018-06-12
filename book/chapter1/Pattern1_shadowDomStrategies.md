# Pattern: shadowDOMStrategies

When? Commonly, the shadowDOM is set up in the `constructor()`.

How? There are three main strategies to create a shadowDom:
1. **Basic strategy** 
2. **Template strategy**
3. Template literals **Engine strategy**

## Basic strategy: `.innerHTML`
The Basic strategy is to create and populate the shadowRoot using `.innerHTML` 
in the `constructor()`. Use this strategy when:
 * there are no (hackable) variables in your template (`.innerHTML` is not safe with variables),
 * the template does not need to change (much), and
 * few instances are made of the element (as the `.innerHTML` needs to be run for every element), and

```javascript
class BasicComponent extends HTMLElement {
  
  constructor(){                                                    
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<span>the</span> <span>basics</span>";
  }
}
```

## Template strategy: `HTMLTemplateElement`
The Template strategy first sets up a template outside of the element.
It then creates a shadowRoot in the constructor, and populates the shadowRoot by deep cloning 
the template. `this.shadowRoot.appendChild(template.content.cloneNode(true))` is more efficient 
than `this.shadowRoot.innerHTML = "<span>it takes</span>a little time<span>to parse html.</span>"`.
Therefore, when many elements using the same template are created, 
the browser saves a little time.

Choose Template strategy over Basic strategy when:
 * you create *many* instances of the same element.

```javascript
const template = document.createElement("template");            //[1]
template.innerHTML = "<span>the</span> <span>template</span>";   //[2]
                                                
class TemplateComponent extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(template.content.cloneNode(true));   //[3]
  }
}
```
1. An `HTMLTemplateElement` object is setup outside of the custom element.
2. A set of elements is added to the template using `.innerHTML`.
3. A *clone* of the `template.content` is added to the shadowRoot of each element. 

## Engine strategy: hyperHTML or lit-html
hyperHTML or lit-html are two template literals engines.
Both hyperHTML and lit-html create efficient and safe ways to include variables in your template.
Under the hood, both use the templates described in Template strategy, caching and 
tagged functions for template literals.
But, hyperHTML and lit-html can also reuse templates across elements of different types,
and they also do clever analysis to:
* avoid updates of the DOM when there are no changes,
* *only* update the part of the template that change, and
* add references to listener functions using the .addEventListener API where appropriate.

Choose the Engine strategy over the other strategies when:
   * the content of the template can change and
   * the template might contain variables provided from the outside.

```javascript
import hyperHTML from 'https://unpkg.com/hyperhtml?module';

class HyperComponent extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    let a = "the";
    let b = "engine";
    this.html = hyperHTML.bind(this.shadowRoot);            //[1]
    this.html`<span>${a}</span> <span>${b}</span>`;         //[2]
  }
}
```
1. Adds the custom template engine for this element as a 
tag-function for string literals called `this.html`.
2. Then use `this.html` to update the element shadowDom.
                              
#### References
* [MDN: Using custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
* [MDN: Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots)
* [hyperHTML](https://viperhtml.js.org/hyper.html)
* [lit-HTML](https://github.com/Polymer/lit-html)                                                                                           