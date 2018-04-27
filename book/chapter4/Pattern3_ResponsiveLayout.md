## Pattern 7: ResponsiveLayout

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

## Reasons to use the ResponsiveLayout pattern: 
TLDR; The ResponsiveLayout pattern:
* removes grid/layout/css media queries and css pseudo elements from the global css
* And opens up for gestures for layout to be modularized together with the layout.

### 1. media queries per element size, not window size
Most web apps today implement this using CSS media queries. 
But, CSS media queries has its limitation that it only listens to the size of the entire window.
If you have an individual element which you would like to lay itself out differently based on its size,
CSS media queries doesn't really help. Here, you would need to observe the size of the element in 
question and react to `sizeChangedCallback()`. 

### 2. encapsulate css media queries
Even though CSS media queries can complete the task, 
there are benefits to applying the ResponsiveLayout pattern on elements that fill the window size. 
By using a custom element with the ResponsiveLayout on the app window,
all the CSS code needed for responsive layout of the app is encapsulated.
This makes the code simpler to move, strips the layout CSS rules from the often-crowded global CSS styles,
and makes the layout simpler to test and demo independently.

### 3. add complex custom behavior for UIX (such as response to scrolling, gestures etc.)
Often, UIX behavior related to scrolling and gestures to zoom and drag are tightly related to layout.
For example, elements in a given layout might be rearranged by the user dragging them around.
Or, gestures that zoom might affect the size of the element at which it should rearrange itself 
(An element is 100px wide and should change to "small" layout when it is 80px wide. 
The user zooms in 30%. The element readjusts its calculation for when to convert to "small" to 
be 80px*130% and therefore changes its layout to "small").
If both css layout styles *and* such custom UIX behavior should be added to the global scope of the app,
it quickly becomes both very complex and difficult to develop, test, and maintain in combination with 
the rest of the app.

### 4. provide a more familiar, more transparent and more powerful alternative to CSS pseudo elements 
CSS such as :before and :after are... neither pretty nor powerful.
By using shadowDom to hide recurring boilerplate from the rest of the HTML application,
also encapsulated properly in the context where it is relevant, 
developers get a more familiar (dom elements described in HTML),
more powerful (no limitations on where, how many, with attributes, ++ shadowDom elements might be added),
and more transparent (the pseudo elements are visible and can for example be manipulated in dev tools 
alongside other shadowDom elements).


<!--- 
1. Show the "normal", global-css way of doing this.
To illustrate how this pattern would normally be handled, 
the example is also implemented as a normal HTML+CSS demo.
2. Make a v2 of the example that adds custom zoom behavior
3. Make a v3 of the example that also alters the shadow dom (alternative to CSS psuedo elements)
-->

### References
* More detail about [`grid-template-areas`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas)
* This [video](https://www.youtube.com/watch?v=txZq7Laz7_4) describes the benefits of applying this pattern to creating responsive pages.