## StubbornAttribute

A StubbornAttribute cannot be set from the outside. 
If you try, the web component will only immediately reset it. Stubbornly. 
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

## References

 * 