# Pattern: `this.style` will grow on you (the JS way)

The first thing a web component can do is to style itself.
All HTML elements have their own default style.
`<span>` elements are `display: inline` by default, `<div>` elements are `display: block`.
`<b>` elements have `font-weight: bold` by default, `<li>` elements have a pseudo element `::before {content: bullet}` 
(todo check what code the bullet is).
These default style values are encapsulated in the HTML tag. 
We want something that is `display: block` by default, that's a `<div>`.   
We want something bold, let's wrap that in `<b>`.

### Example: Norwegian styled text
```html
<script>  
class NorwegianTextComponent1 extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
  
  connectedCallback(){
    this.style.textShadow = "-3px 0 white, 0 3px white, 3px 0 white, 0 -3px white";
    this.style.fontWeight = "bold";
    this.style.color = "blue";
    this.style.background = "red";
    
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
These colors can be overridden from the outside, 
but if we split the declaration of the web component from its context of use, 
we will have little reason to worry about the management of the text and background color.

Funny point, me being defensive about the flag.

### Extending the example. 
### adding sound on :hover
### add a thumbs up before the text

