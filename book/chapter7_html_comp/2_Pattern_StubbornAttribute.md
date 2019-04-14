# Pattern: StubbornAttribute

A StubbornAttribute is *only controlled from the inside* and cannot be set from the outside. 
If you try, the web component will immediately reset it. Stubbornly. 
To accomplish these goals the web component:

1. keeps an internal property of the state;
2. updates the attribute, every time it changes this internal property; and
3. every time the attribute is updated from the outside, 
   the `attributeChangedCallback()` checks to see if the value is the same as the internal property, 
   and if they differ, changes the attribute back to match the internal property.

<code-demo src="demo/StubbornAttribute.html"></code-demo>

<code-demo src="demo/BiPolar.html"></code-demo>

```html
<script>
  class StubbornComponent extends HTMLElement {

    constructor() {
      super();
      this.__stubborn = null;
      setInterval(this.flip.bind(this), 2000);
    }

    static get observedAttributes() {
      return ["_stubborn", "_just_dont"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "_stubborn") {
        if (newValue !== this.__stubborn)
          this.__stubborn !== null ? this.setAttribute(name, this.__stubborn) : this.removeAttribute(name);
      }
      if (name === "_just_dont") {
        if (newValue !== null)
          this.removeAttribute(name);
      }
    }

    flip() {
      this.__stubborn === null ?
        this.setAttribute("_stubborn", this.__stubborn = "") :
        (this.__stubborn = null ) || this.removeAttribute("_stubborn");
    }
  }

  customElements.define("stubborn-component", StubbornComponent);
</script>

<style>
  stubborn-component[sunshine] {
    border: 2px solid yellow;
  }
  stubborn-component[_stubborn] {
    border-bottom: 2px solid orange;
  }
  stubborn-component[_just_dont] {
    border-top: 20px solid red;
  }
</style>

<stubborn-component _stubborn _just_dont sunshine>Hello sunshine!</stubborn-component>

<script>
  setInterval(function () {
    var el = document.querySelector("stubborn-component");
    el.hasAttribute("sunshine") ? el.removeAttribute("sunshine") : el.setAttribute("sunshine", "");
    el.hasAttribute("_just_dont") ? el.removeAttribute("_just_dont") : el.setAttribute("_just_dont", "");
    el.hasAttribute("_stubborn") ? el.removeAttribute("_stubborn") : el.setAttribute("_stubborn", "");
  }, 1000);
</script>
```

### Tip: When the going gets though: split!

If it is difficult to make your StubbornAttribute, the solution might be that you are trying to cram
too many purposes into the same attribute. Try to split the attribute into two, and see if it helps.

## Why StubbornAttributes?

Or, why should a web component communicate an inner state to its lightDOM context in the form of
an HTML attribute? Why communicate an inner state? And why as an attribute?

Usually, HTML attributes are used to *share* state control of a web component. 
HTML attributes can be set in the lightDOM HTML template, and from JS both within and outside 
the web component. HTML attributes can be read from *everywhere*. They can: 
1. control CSS selectors in the lightDOM, 
2. trigger `MutationObserver`s in the lightDOM, 
3. control CSS selectors in the shadowDOM, and 
4. trigger `attributeChangedCallback(...)`s in the shadowDOM.

But, what is the purpose of stubborn HTML attributes, HTML attributes that cannot be *set* from 
neither HTML template nor JS `setAttribute(...)` calls in the lightDOM context?

The purpose of StubbornAttributes is to *be read*. A StubbornAttribute is *always* set from within
the web component, even if you try to do it from the outside. And as with any other HTML attribute,
you are guaranteed that it will trigger CSS rules , `MutationObserver`s and 
`attributeChangedCallback(...)`s with the same value both in the lightDOM and shadowDOM context.

Especially CSS readability from the lightDOM is a *big* use-case for StubbornAttributes. 
HTML attributes can be used to turn on/off CSS rules on:

1. The host element. As the web component *shares* its inner state (in a manner that cannot accidentally 
   be overridden from outside), the user of the web component can apply different CSS styles to it
   in its lightDOM context. By adding a StubbornAttribute to a web component, lots of styles can be 
   set dependning on its inner state without having to pass in any CSS variable.
   
2. Slotted children. StubbornAttributes enable the lightDOM context to style 
   elements it slots into the shadowDOM of a web component via attribute CSS selectors. This enables
   the lightDOM to set CSS properties with strong CSS priority, quite simply.

3. Slotted descendants. This is were StubbornAttributes really shines. `::slotted(...)` selectors
   doesn't enable the web component to apply styles to transposed elements. If and when a web 
   component needs to apply styles to descendants of its children, then setting a StubbornAttribute
   on the host element and then apply CSS attribute selectors to its descendants in the lightDOM is 
   the way to go.

The MediaQueryAttribute pattern illustrate how StubbornAttributes can be used to control the style
of lightDOM and shadowDOM children and descendants.

## References

 * 