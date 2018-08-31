# How to override `HTMLElement.constructor()`

> TLDR; In the `HTMLElement.constructor()`:
> 1. do not access HTML attributes 
> 3. set up event listener objects

The `constructor()` of custom element classes is not as simple as it might seem.
There are three important, implied contextual bindings to the constructor of custom elements:

1. Attributes can neither be safely read nor safely set in the `constructor()`
   (cf. [Problem: Attributes In Constructor](Problem1_attributesInConstructor.md).
   This means that a second `setupCallback()` should be set up.

2. `this.attachShadow({mode: "open"});` should always be called in the `constructor()`.
   If the `shadowDOM` should evaluate some (startup) attributes in order to decide its structure,
   then `this.shadowRoot` should be populated later in `setupCallback()`.

3. Event listener objects should be recycled when an element disconnects and connects again to the DOM.
   Custom elements can therefor create event listener objects in the `constructor()` and 
   then subsequently add/remove the same event listener objects when the element connects/disconnects to the DOM.
                                                       
4. All other known properties and types should be initialized in the constructor so that the type 
   definition of the class remains as static as possible.

Adhering to these contextual bindings make the elements more efficient.

## References

* [the article on dynamic types and classes in V8]()
