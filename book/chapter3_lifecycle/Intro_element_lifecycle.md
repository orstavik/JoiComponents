# Intro: wc lifecycle

> TLDR: First, WC are setup using the `constructor()`.
> To delay setup of WC (and native HTML elements), use `<template>`.
> Native callbacks can be called irregularly.
> `unload` does not trigger `disconnectedCallback()` automatically.

![lifecycle illustration](Lifecycle_raw.jpg)

## `constructor()`

The `constructor()` is the first lifecycle callback of a custom element.
It is called when the element is first created.
In the `constructor()` you must first call `super()`, and 
then you can set up and populate a shadowDOM and create event listener objects.
For efficiency, regular JS properties on the custom element should also be initialized in the constructor.
Below is an example of a custom element `constructor()`:

```
constructor(){
  super();
  this.attachShadow({mode: "open"});
  this.shadowRoot.innerHTML = "<h1>I'm setup in the constructor.</h1>";
  this._reuseableEventListener = (e) => this.myEventFunction(e);
  this.aDataProperty = null;
}
```

There are two issues are concerning the custom element `constructor()`:
1. Initial HTML attributes cannot be safely read nor set in the `constructor()`.
This is solved using the [Pattern: .initialAttributesCallback](todo).
2. When custom elements are added under a `<template>` element, then *only* 
the HTMLElement's constructor() is triggered, and 
the custom elements own constructor and setup is delayed until connected.
This can be used to delay the construction of elements with the [Pattern: temporaryTemplate](todo).

## native callbacks

Some **callbacks** already exist on the `HTMLElement` class. 
These callbacks are triggered synchronously when they occur, ie. irregularly:
1. `connectedCallback()` and `disconnectedCallback()`
2. [`attributeChangedCallback()`](HowTo_attributeChangedCallback.md)
3. `adoptedCallback()`

## mixin callbacks

There are two key lifecycle moments that are not natively supported by callbacks.

### `slotchangeCallback()` 

LightDOM children elements of the host node are important.
Custom elements can show children as part of their content, either:
* directly, if the custom element does not hold a shadowDOM, or 
* via `<slot>` elements within a shadowDOM.
   
LightDOM children can also function as input parameter such as the `<source>` children of
`<audio>` and `<video>`.

LightDOM children can be dynamically styled using the CSS selector `::slotted()`.
But, there are limits to what can be styled in CSS. 
And when children elements are used as input parameters, the element should respond to such changes.
Thus, changes in the number or type of child elements might require a reaction, an update of the shadowDOM or
actions towards the children elements added (cf. [HelicopterParentChild](../chapter6_html_comp/Pattern2_HelicopterParentChild.md)).

This lifecycle event can be understood as **changes to slottables, ie. the list of flattened children nodes**.
Natively, this event is supported by the `slotchange` event, 
but this event is very cumbersome to manage and cannot be used by custom elements without a shadowDOM.
So, SlotchangeMixin captures any **changes to slottables, ie. the list of flattened children nodes**,
regardless of origin, and provides a simple `slotchangeCallback(slotname, newValue, oldValue)` reactive method.

### `initialAttributesCallback()`
When constructing elements via the HTML parser, there is one important issue with the native callbacks.
The HTML parser in the browser automatically creates elements when it parses the main HTML document or 
when it is invoked using `.innerHTML`.
If the element being parsed contains one or more (observed) html attributes,
then the parser must also trigger one or more `attributeChangedCallback()`s.
(`.cloneNode` will also automatically trigger `attributeChangedCallback()` if necessary.)
The parser must also connect the elements to the DOM, thus automatically triggering `connectedCallback()`
(unless `.innerHTML` is performed on a disconnected element).
In practice, this means that there is no fixed sequence of these three callbacks when constructing an element.
Therefore, the developer must anticipate that the browser can automatically trigger any one of these callback 
combinations when constructing an element:
 * `constructor()`
 * `constructor()` + `connectedCallback()`
 * `constructor()` + `attributeChangedCallback()`
 * `constructor()` + `attributeChangedCallback()` + `connectedCallback()`

To address the issues that follow this multitude of setup combinations, 
a custom callback `initialAttributesCallback()` setup via [`InitialAttributesMixin`](Mixin2_InitialAttributes.md). 

## end of life

To delete and remove an elements and all its components from the browsers memory,
the element must be disconnected from the DOM and all strong object references to the element must be removed.
This will trigger `disconnectedCallback()`.

However, when the browser "unloads" and in a sense "disconnects" the entire DOM, 
the browser does not trigger `disconnectedCallback()` on the connected elements.
The `unload` event is triggered when the browser itself or a tab or iframe in the browser is closed.
Most often this is not a problem, there is no needs to for example remove event listeners 
(the most common `disconnectedCallback()` task) when the browser closes a tab.
But, sometimes, the element might need to perform actions before the tab closes.
These use-cases and their solution are presented in [Mixin: UnloadDisconnects](Mixin3_unload_disconnects.md).

![lifecycle with JOI mixins illustration](Lifecycle_joi.jpg)

## References