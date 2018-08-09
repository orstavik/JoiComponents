# How to override `HTMLElement.constructor()`

> TLDR; In the `HTMLElement.constructor()`:
> 1. do not access HTML attributes 
> 2. initialize `.shadowRoot`, but do not populate it and
> 3. set up event listener objects

The `constructor()` of custom element classes is not as simple as it might seem.
There are three important, implied contextual bindings to the constructor of custom elements:

1. Attributes can neither be safely read nor safely set in the `constructor()`
   (cf. [Problem: Attributes In Constructor](Problem1_attributesInConstructor.md).
   This means that a second `setupCallback()` should be set up.

2. `this.attachShadow({mode: "open"});` should always be called in the `constructor()`.
   But, `this.shadowRoot` should be populated later, preferably in `setupCallback()`.
   The reason is that the **lightDOM children** of an element with a `.shadowRoot` are not directly
   connected to the DOM.
   Instead, the lightDOM children of elements with a `.shadowRoot` can only be **slotted** into the DOM.
   This means that while the element's `.shadowRoot` remains without a `<slot>` element,
   **none of the children will be connected**. 

   Thus, by initializing a `.shadowRoot`, but not populating it,
   the `connectedCallback()` (and for example `setupCallback()`) of all children elements *can be delayed*.
   Both shadowDOM and lightDOM children(!).
   To delay the setup of non-critical elements are useful to free up resources for critical elements and behavior 
   (cf. ["above and below the fold"](Problem2_setupElement.md)).

3. Event listener objects should be recycled when an element disconnects and connects again to the DOM.
   Custom elements can therefor create event listener objects in the `constructor()` and 
   then subsequently add and remove these event listeners when the element connects and disconnects to the DOM.

   However, it is slightly better to create event listener objects in `setupCallback()` than in `constructor()`.
   Although not very resource demanding, if the element is delayed, it is better to also delay the creation 
   of event listener objects.
                                                          
4. All other known properties and types should be initialized in the constructor so that the type 
   definition of the class remains as static as possible.

Adhering to these contextual bindings make the elements more efficient.

## References

* [the article on dynamic types and classes in V8]()
