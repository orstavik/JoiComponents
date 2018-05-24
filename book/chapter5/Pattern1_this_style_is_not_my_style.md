# Pattern: `this.style` is not *my* style

The first thing a web component can do is to style itself.
All HTML elements have their own default style.
`<span>` elements are `display: inline` by default, `<div>` elements are `display: block`.
`<b>` elements have `font-weight: bold` by default, `<li>` elements have a pseudo element `::before {content: bullet}` 
(todo check what code the bullet is).
These default style values are encapsulated in the HTML tag. 
We want something that is `display: block` by default, that's a `<div>`.   
We want something bold, let's wrap that in `<b>`.
                 
There are two ways to set the default style of a component: 
1. using `this.style` and 
2. adding a `<style>` tag to the shadowRoot of an element with `:host()` rules.

The problem with the 1. approach, is that default style added under `this.style`
will come into conflict with the style attribute of a the element in its context of use.
That means that you either must check to make sure you are not overwriting any style rules
set in that context by the element tag author, or be prepared to have your authors styles 
be overwritten by the element's default style. 
                                                                   
Because of the possible confusion that can occur with different styles, 
it is not recommended to use `this.style` as a mechanism to provide the default style of an element.
Use `this.style` rather as a mechanism to deliberately override external style set from the outside.

### Example: anti-pattern: Norwegian styled text: setting the default style using `this.style`
```html
<script>  
class NorwegianTextComponent1 extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback(){
    this.style.textShadow = this.style.textShadow || "-3px 0 white, 0 3px white, 3px 0 white, 0 -3px white";
    this.style.fontWeight = this.style.fontWeight || "bold";
    this.style.color = this.style.color || "blue";
    this.style.background = this.style.background || "red";
    
    this.shadowRoot.innerHTML = "<slot></slot>";
  }
}

customElements.define("norwegian-text-one", NorwegianTextComponent1);
</script>

<norwegian-text-one>
  Everything written here will look sooooo Norwegian!
</norwegian-text-one>
```

By associating default, custom styles to a specific type of HTML element, 
we can encapsulate and hide the obvious properties that we associate with that element.
`<norwegian-text-one>` is obviously blue, on white, on red. Like the flag.

### Drawback of this.style in web components
If you use this.style to set the style in web components, you will: 
* overwrite the style of the user when you reconnect your element.
Therefore, it is better to use a custom style tag inside the element.
This makes the "default" style of the web component overwriteable by specific style tags 
associated with the element in its context of use.

### Extending the example. 
### adding sound on :hover
### add a thumbs up before the text

