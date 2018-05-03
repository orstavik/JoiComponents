# Pattern: `:host(.with[style])` (the CSS way)

There is another way to style a custom element: using CSS. 
In CSS a special selector `:host()` allows you to specify CSS rules that applies 
to the host element in a web component.

## Example: Norwegian styled text (again)
```html
<script>  
class NorwegianTextComponent2 extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
                                                                                                       
  connectedCallback(){
    this.shadowRoot.innerHTML = ` 
    <style>
      :host {
        text-shadow: -3px 0 white, 0 3px white, 3px 0 white, 0 -3px white; 
        font-weight: bold; 
        color: blue; 
        background: red;
      }
    </style>
    <slot></slot>`;
  }
}

customElements.define("norwegian-text-two", NorwegianTextComponent2);
</script>

<norwegian-text-two>
  Wait a minute, I am getting confused. 
  Are you sure this text is not English? 
  Or maybe French?
</norwegian-text-two>
```

### :host(.minor[details="easyToForget"])

In CSS, the :host selector is not a normal type selector. 
[:host() is a CSS pseudo-class function](https://developer.mozilla.org/en-US/docs/Web/CSS/:host()).
This means that if you want to query to check for a certain class or attribute, 
you have to wrap the class- and attribute specifiers in parenthesis.
If you want to get the host element only when it has: a) the CSS class "minor" and 
b) the attribute "details" with value "easyToForget", you write the CSS selector like this:
`:host(.minor[details="easyToForget"])`.