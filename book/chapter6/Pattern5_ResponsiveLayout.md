## Pattern 5: ResponsiveLayout

Sometimes, you need the layout of an element to respond to the size of the element. 
If the element gets bigger than a certain threshold, then you want to apply a certain layout and style.
If the element gets smaller than a certain threshold, then you want to apply a different layout and style.
This is "responsive design". 

## Example: A 'normal web app' layout
To show how the ResponsiveLayout pattern works, 
I will here present a normal layout structure for web pages.

```javascript
import { SizeChangedMixin } from "https://rawgit.com/orstavik/JoiComponents/master/src/SizeChangedMixin.js";

class ResponsiveLayout extends SizeChangedMixin(HTMLElement) {   //[1]
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._resizeListener = s =>
      this.sizeChangedCallback({
        width: window.innerWidth,
        height: window.innerHeight
      });
  }

  connectedCallback() {
    window.addEventListener("resize", this._resizeListener);
    this.shadowRoot.innerHTML = `                                
<style rel="stylesheet" type="text/css">                         //[2]
  :host([size="small"]){
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
    grid-template-areas: 
      "header" 
      "main"
      "aside"
      "footer";
  }
  :host([size="large"]){                                         //[2]
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    grid-template-areas: 
      "header header" 
      "main aside" 
      "footer footer";
  }
  :host([size="medium"]){
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas: 
      "header header header" 
      "footer main aside";
  }
</style>

<div style="grid-area: header;">                                 //[3]
  <slot name="header"></slot>
</div>
<div style="grid-area: main;">
  <slot name="main"></slot>
</div>
<div style="grid-area: aside;">
  <slot name="aside"></slot>
</div>
<div style="grid-area: footer">
  <slot name="footer"></slot>
</div>`;
    this.sizeChangedCallback({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._resizeListener);
  }

  sizeChangedCallback({ width, height }) {                       //[4]
    const w =
      width > 1000 ? "large" : 
      width > 800 ? "medium" : 
      /*width <= 800*/ "small";
    this.setAttribute("size", w);
  }
}

customElements.define("responsive-layout", ResponsiveLayout);
```    
[ResponsiveLayout on codepen.io](https://codepen.io/orstavik/pen/OZXZGN).

1. Adding `SizeChangedMixin` to observe and react to size changes of the element.
2. Use the `<style></style>` tag to describe the different layouts for different size 
attribute values such as `:host([size="large"])`, `:host([size="medium"])`.
3. Wrap the `<slot>`-elements in `<div>`s as slots can't be positioned in the grid directly. //verify this
4. Update the `size`-attribute on host to whenever the element's size changes.

```html
<responsive-layout>
  <header slot="header">HEADER</header>
  <span slot="main">Change size of the window</span>
  <main slot="main">MAIN</main>
  <aside slot="aside">ASIDE</aside>
  <footer slot="footer">FOOTER</footer>
</responsive-layout> 
```          
Elements are slotted as main, header, aside, footer. 
More than one element can be placed in each slot in the layout, as illustrated with main.


<!--- 
1. Make a v2 of the example that adds custom zoom behavior
2. Make a v3 of the example that also alters the shadow dom (alternative to CSS psuedo elements)
-->

### References
* More detail about [`grid-template-areas`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas)
* This [video](https://www.youtube.com/watch?v=txZq7Laz7_4) describes the benefits of applying this pattern to creating responsive pages.