# WhatIs: upgrade

Web components are special. Like spoiled children, they demand their own unique set of rules from
their JS mommy and HTML daddy. Upgrade is one such unique rule. A unique rule that JS mommy follows
when she constructs web components in *two* separate phases. Yes, you heard right: 
**splits(!!) the construction of a JS object(!!)**. 
If that's not being a spoiled little object, I don't know what is.

So, how does mommy JS pamper her web components?

## Empty HTMLElement shell objects

First, when the JS run-time creates a web component, JS first creates an **empty shell** HTMLElement
object. The JS run-time does not create the full web component, it only creates half: 
a minimum, incomplete, generic object of what will become the full custom element object.

These empty shell objects can be created in two scenarios, ie. when custom elements are:
 * specified in the DOM before the browser has had time to load and register
   its definition with `customElements.define(...)`, or
 * added as children in a `<template>` element, via HTML template (including `.innerHTML`).

The empty shell custom element objects can therefore also be understood as only being in their 
**template state**, and not yet their *full state*.

From an implementation stand-point, the empty shell, template state can be understood as *only* 
calling the `HTMLElement.constructor()`, and not the whole constructor for the custom element.
Even though the JS run time creates an object for the custom element, it does not call its constructor
yet. It only calls the first, compulsory statement `super();` in the constructor.

This is strange. But, it might not be so strange after all, if we think of the situation from the
point of view of the browser. When the browser loads an HTML document, it might take longer for all the
custom element JS scripts to load and register, than it takes for the browser to parse and process the
HTML template with all the custom element tags. If the browser was forced to *wait* until all the custom
element definitions was registered *before* it created objects of the custom element tags, it could 
take many seconds extra before the browser could render a view. Thus, better to create the HTML elements
as dummy placeholders that can be styled, layd out and painted temporarily, than blocking the construction
all together.

Second, once these dummy placeholders are in place, why not use them for the `.content` of the `<template>`
element too? Indeed, why not! That makes the `<template>` element lighter, and we can delay the work of
instantiating the template clones until we actually use them. Thus, empty shell objects in a template
state is a good strategy to speed up first paint and delay work with template elements until needed.

## Upgrade: empty shell => full state custom elements

Once created, the empty shell objects in template state has been given pointers and positions in the DOM.
The pointers can be stored and used for dirty checking or whatever. And their position in the DOM is 
already mapped out and ready to go. 

This means that when we later want to *complete* the construction of the empty shell, template state 
custom element objects, we cannot simply throw the temporary object away and create a new one. No, we 
must keep the pointer, we must keep the shell, and instead "fill its inside with what it needs". We must
upgrade the partially constructed object with the output from the rest of the constructor. That means
that we must:
1. run the constructor, but
2. instead of putting its output into a new object, put its output into the shell object, and
3. except for the output from the `HTMLElement.constructor()` as this data we already have in the
   shell object.
   
This process of:
1. running the constructor of a custom element,
2. after a shell object version of the custom element has already been created and exists,
3. fill the shell object with the full output of the custom element constructor,

is called **upgrade**.

The *upgrade* process is run at *two* points in time, as part of:
1. the `customElements.define(...)` method, that will upgrade all the custom elements of 
   that type that already has been placed in the DOM, and
2. `someElement.appendChild(templateCustomElement)` (or similar DOM method) that puts the element 
   into a "normal" DOM context.

## Backlog lifecycle callbacks

When the *upgrade* process runs, it fills the custom element object with the full content of its 
constructor. But, that is not all. As stated before, the custom element might already be put in the DOM. 
The custom element template state object might already have been given HTML attributes.

Being connected to the DOM should trigger the `connectedCallback()` of the custom element now fully
registered. And being given an HTML attribute could trigger an `attributeChangedCallback(...)`.
For elements being upgraded, there can therefore exist a backlog of lifecycle callbacks.

Therefore, as soon as the upgrade process has put the result from the constructor into the empty shell
object, it runs the backlog of lifecycle callbacks. Upgrade therefore often feels like not only
invoking the `constructor()` of the custom element, but also its `connectedCallback()` and
`attributeChangedCallback(...)` at a later time.

Also, if the element includes a `.shadowRoot` with a `<slot>` element, then any `slotchange` event
triggered by an element being slotted will of course also be triggered. But, being a separate event,
`slotchange` event listeners will be queued in the event loop, and thus not triggered synchronously
as `connectedCallback()` and `attributeChangedCallback(...)`. 

## Demo: <upgrade-one>

In this demo, we upgrade an element that are placed in the DOM before their definition is known.

```html
<upgrade-one punctuation="!">hello world</upgrade-one>

<script>
  class UpgradeOne extends HTMLElement{
    constructor(){
      super();
      console.log("UpgradeOne constructor");
      console.log("UpgradeOne constructor dirty check: ", emptyShell === this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<slot></slot><span></span>";
    }

    static get observedAttributes(){
      console.log("UpgradeOne observedAttributes");
      return ["punctuation"];
    }

    attributeChangedCallback(name, oldValue, newValue){
      console.log("UpgradeOne attributesChangedCallback");
      if (name === "punctuation"){
        this.shadowRoot.querySelector("span").innerText = newValue;
      }
    }
    connectedCallback(){
      console.log("UpgradeOne connectedCallback");
      console.log("UpgradeOne connectedCallback dirty check: ", emptyShell === this);
    }
  }
  console.log("App start");
  var emptyShell = document.querySelector("upgrade-one");
  customElements.define("upgrade-one", UpgradeOne);
  console.log("App dirty check: ", emptyShell === document.querySelector("upgrade-one"));
  console.log("App end");
</script>
```

## Demo: <upgrade-two>

In this demo, we upgrade a custom element first constructed as a child of a `<template>` element.

```html
<body>
<script>
  class UpgradeTwo extends HTMLElement {
    constructor() {
      super();
      console.log("UpgradeTwo constructor");
      console.log("UpgradeTwo constructor dirty check: ", emptyShell === this);
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<slot></slot><span></span>";
    }

    static get observedAttributes() {
      console.log("UpgradeTwo observedAttributes");
      return ["punctuation"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      console.log("UpgradeTwo attributesChangedCallback");
      if (name === "punctuation") {
        this.shadowRoot.querySelector("span").innerText = newValue;
      }
    }

    connectedCallback() {
      console.log("UpgradeTwo connectedCallback");
      console.log("UpgradeTwo connectedCallback dirty check: ", emptyShell === this);
    }
  }

  console.log("App start");
  customElements.define("upgrade-two", UpgradeTwo);
  console.log("App upgrade-two defined");
</script>
<template>
  <upgrade-two punctuation=".">hello norway</upgrade-two>
</template>
<script>
  var emptyShell = document.querySelector("template").content.children[0];
  console.log("App before appending upgrade-two");
  document.querySelector("body").appendChild(emptyShell);
  console.log("App after appending upgrade-two");
</script>
</body>
```


## Demo: <upgrade-three>

In this demo, we upgrade a custom element that is a cloned out from a `<template>` element.

```html
<body>
<script>
  class UpgradeThree extends HTMLElement {
    constructor() {
      super();
      console.log("UpgradeThree constructor");
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<slot></slot><span></span>";
      this.shadowRoot.addEventListener("slotchange", function(){
        console.log("UpgradeThree slotchange");
      })
    }

    static get observedAttributes() {
      console.log("UpgradeThree observedAttributes");
      return ["punctuation"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      console.log("UpgradeThree attributesChangedCallback");
      if (name === "punctuation") {
        this.shadowRoot.querySelector("span").innerText = newValue;
      }
    }

    connectedCallback() {
      console.log("UpgradeThree connectedCallback");
    }
  }

  console.log("App start");
  customElements.define("upgrade-three", UpgradeThree);
  console.log("App after upgrade-two defined");
  var template = document.createElement("template");
  template.innerHTML = '<upgrade-three punctuation=")">Hello Ukraine</upgrade-three>';
  console.log("App after template instantiating upgrade-three");
  var clone = template.content.cloneNode(true);
  console.log("App after cloning upgrade-three");
  document.querySelector("body").appendChild(clone);
  console.log("App after appending upgrade-three");
</script>
</body>
```

## References
 * [whatwg: upgrade](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-upgrades-examples)