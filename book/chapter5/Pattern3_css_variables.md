# Pattern: CSS variables

Most elements need to be customized to their style to their context.
To achieve this we use CSS variables. The CSS variables allow us to set 
the value of one or a group of identical style properties.

(( Outside of from CSS variables, there is little builtin support for customizing 
  styles in web components. 
))

## Example: tricolor text
Let's say a Dane wanted to use our NorwegianTextComponent2 from our previous example,
only with the colors of the Danish colors instead of the Norwegian.
To make our web component accessible for different contexts, 
we need to expose the values for the three colors as CSS variables.

```html
<script>  
class TricolorTextComponent extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }
                                                                                                       
  connectedCallback(){
    this.shadowRoot.innerHTML = ` 
    <style>
      :host {
        text-shadow: -3px 0 var(--tricolorTextMiddle, white), 0 3px var(--tricolorTextMiddle, white), 3px 0 var(--tricolorTextMiddle, white), 0 -3px var(--tricolorTextMiddle, white); 
        font-weight: bold; 
        color: var(--tricolorTextMiddle, blue);
        background: var(--tricolorTextMiddle, red);
      }
    </style>
    <slot></slot>`;
  }
}

customElements.define("tricolor-text", TricolorTextComponent);
</script>

<style>
  --tricolorTextMiddle: yellow;
  --tricolorTextInner: yellow;
  --tricolorTextOuter: blue;
</style>
<tricolor-text>
  Can you spot the pun?
</tricolor-text>
```

### Customize the CSS variable names to the component.

Do not attempt to find or make general CSS variable names in your reusable web component.
It is better to connect all the apps colors and styles in app specific components, 
and then bind app wide CSS variables to different compononent specific variable names there. 