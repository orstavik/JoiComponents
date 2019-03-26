# HowTo: CreateShadowDOM

> This cookbook advocate setting up the shadowDOM in the `constructor()`. 
> This builds on a few premises:
> 1. If you need to delay custom element construction, use [Pattern: TemplateSwitcheroo](6_Pattern_TemplateSwitcheroo).
> 2. To select which DOM is shown based on attributes, is likely best done using 
> `:host([attribute="something"])`.
> 3. The default values of attributes is "not set". Avoid using an HTML value as a web components
> default setting
> 4. Sure, if you *really* need to know the host element attributes or delay until `connectedCallback()`, 
> you can construct the shadowDOM in `connectedCallback()` as an *alternative* strategy.

The shadowDOM is initiated in the `constructor()`. 

There are three main strategies to create a shadowDom:
1. **Basic strategy** 
2. **Template strategy**
3. **Engine strategy**

## Basic strategy: `.innerHTML`

The Basic strategy is to create and populate the shadowRoot using `.innerHTML` in the `constructor()`. 
Use this strategy when:
 * there are no (hackable) variables in your template (`.innerHTML` is unsafe with variable content),
 * the template is fairly static, and
 * few instances are made of the element (as the `.innerHTML` needs to be run for every element).

```javascript
class BasicComponent extends HTMLElement {
  
  constructor(){                                                    
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<span>the</span> <span>basics</span>";
  }
}
```

The Basic strategy is often a simple and good way to get started during development. 
Then, just refactor to one of the other two strategies when your component nears completion.

## Template strategy: `HTMLTemplateElement`

The Template strategy consists of the following steps:
1. Set up a template outside of the element.
2. set up the shadowRoot in the constructor.
3. Populate the shadowRoot by deep cloning the template. 

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

The benefit of the template strategy over the basic strategy, is that 
`this.shadowRoot.appendChild(template.content.cloneNode(true))` is more efficient than 
`this.shadowRoot.innerHTML = "<span>it takes</span>a little time<span>to parse html.</span>"`
when you create *several* instances of the same custom element.

## Engine strategy:  using LighterDOM or lit-html

LighterDOM and lit-html are two template literals engines.
Both LighterDOM and lit-html create efficient and safe ways to include variables in your template.
Under the hood, both use tagged functions for template literals.
But, LighterDOM and lit-html can also reuse templates across elements of different types,
and they also do clever analysis to:
* avoid updates of the DOM when there are no changes,
* *only* update the part of the template that change, and
* add references to listener functions using the .addEventListener API where appropriate.

Choose the Engine strategy over the other strategies when:
   * the content of the template can change (particularly in a loopy type of way) and
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