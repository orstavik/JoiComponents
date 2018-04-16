## Pattern 5: How, where and why to construct a template

ATT!! This is an unfinished pattern.

This text describes different strategies to create the shadowDom of a custom element.
These strategies all have their use, but the more complex use, the more complex the pattern.
Also, these strategies can be viewed as an incremental development, as each stage adds a little
efficiency benefit.
1. `.innerHTML`,
2. `FirstConnectedMixin`,
3. `HTMLTemplateElement`, and
4. templating library such as hyperHTML or lit-html.

### Stage 1: innerHTML 
```javascript
class MyComponent1 extends HTMLElement {
  
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
to the DOM. This is ok as long as:
1. the template does not need to change (so you don't use any hackable variables in the template),
2. not many instances are made of the element (as the HTML needs to be parsed uniquely every time), and
3. the element is not attached and then reattached to the DOM often (as everything is parsed at any reconnect).

### Stage 2: innerHTML + FirstConnectedMixin
```javascript
import {FirstConnectedMixin} from "https://rawgit.com/orstavik/joicomponents/master/src/FirstConnectedMixin.js";

class MyComponent2 extends FirstConnectedMixin(HTMLElement) {
  
  constructor(){                                                    
    super();
    this.attachShadow({mode: "open"});
  }
  
  firstConnectedCallback(){
    this.shadowRoot.innerHTML = "<span>the</span> <span>basics2</span>";
  }
}
```
By adding [FirstConnectedMixin](Mixin4_FirstConnectedMixin.md) the shadowRoot is *only* instantiated
the first time the element is connected.

### Stage 3: HTMLTemplateElement + FirstConnectedMixin
```javascript
import {FirstConnectedMixin} from "https://rawgit.com/orstavik/joicomponents/master/src/FirstConnectedMixin.js";

//if(!('content' in document.createElement('template')) then polyfill?
//debugger;
const template = document.createElement("template");
template.innerHTML = "<span>the</span> <span>basics3</span>";
                                                
class MyComponent3 extends FirstConnectedMixin(HTMLElement) {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  firstConnectedCallback(){
    //while (this.shadowRoot.firstChild)this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    this.shadowRoot.append(template.content.cloneNode(true));
  }
}
```
Setting up an HTMLTemplateElement can be done outside of the custom element.
By setting up a template element, you only need to clone the content of the template element, 
and not parse it again when you need it.
If you create *many* instances of the same element, then this will give you a performance boost.                

### Stage 4: hyperHTML + FirstConnectedMixin
```javascript
import {FirstConnectedMixin} from "https://rawgit.com/orstavik/joicomponents/master/src/FirstConnectedMixin.js";
import hyperHTML from 'https://unpkg.com/hyperhtml?module';

class MyComponent4 extends FirstConnectedMixin(HTMLElement) {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.html = hyperHTML.bind(this.shadowRoot);
  }
  
  firstConnectedCallback(){
    let a = "the";
    let b = "basics4";
    this.html`<span>${a}</span> <span>${b}</span>`;
  }
}
```
hyperHTML, or lit-html, creates an efficient and safe way to include variables in your template.
Under the hood, both hyper and lit uses the templates described in stage 3.
In the constructor, an instance of the hyperHTML templating function (or equivalent lit-html function)
is bound to the shadowRoot, so that later calls to the same function will not vary.
                              
#### References
* [hyperHTML](https://viperhtml.js.org/hyper.html)
* [lit-HTML](https://github.com/Polymer/lit-html)                                                                                           