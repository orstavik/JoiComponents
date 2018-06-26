## Pattern 5: ResponsiveLayout

Sometimes, you need the layout of an element to respond to the size of the element. 
If the element gets bigger than a certain threshold, then you want to apply a certain layout and style.
If the element gets smaller than a certain threshold, then you want to apply a different layout and style.
This is "responsive design". 

## Example: A 'normal web app' layout
To show how the ResponsiveLayout pattern works, 
I will here present a normal layout structure for web pages.

```javascript
import { ResizeMixin } from "https://rawgit.com/orstavik/JoiComponents/master/src/ResizeMixin.js";

class ResponsiveLayout extends ResizeMixin(HTMLElement) {   //[1]
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._resizeListener = s =>
      this.resizeCallback({
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
    this.resizeCallback({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._resizeListener);
  }

  resizeCallback({ width, height }) {                       //[4]
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

1. Adding `ResizeMixin` to observe and react to size changes of the element.
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

## `<meta name="viewport" content="width=device-width">`
On mobile devices, you need to specify the width of [the layout viewport](https://www.quirksmode.org/mobile/viewports2.html), 
ie. the width of the HTML document in CSS pixels.
This is done using the `<meta name="viewport" content="width=device-width">` tag.
If you are using a `ResponsiveLayout` to control the layout of the whole page,
you want to add a the following `<meta name="viewport" content="width=device-width">`
(or `<meta name="viewport" content="width=500">` if you want the layout of the html document 
to be minimum 500px wide.

The tag `<meta name="viewport" content="width=device-width">` is also used to [disable the 
native double-tap to zoom gesture](https://developers.google.com/web/updates/2013/12/300ms-tap-delay-gone-away).
For more on this see [Conflicting gestures](../chapter3/Discussion_conflicting_gestures.md).

<!--- 
todo 
There is a question if we should use HelicopterParentChild instead of <slot name="xyz"> pattern.
The problem is finding and moving the position of the children in the view, without moving them around in the lightDOM.
One possibility is to assign slots to the children of certain types/names. That is doable. That might be good.
That will also make it HTML composeable, useable when the thing that is to be put somewhere is a slot itself.
But, then again. The slots can also just be put inside a div. and then placed. Maybe both works well.

1. Make a v2 of the example that adds custom zoom behavior
2. Make a v3 of the example that also alters the shadow dom (alternative to CSS psuedo elements)
-->

### References
* More detail about [`grid-template-areas`](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas)
* This [video](https://www.youtube.com/watch?v=txZq7Laz7_4) describes the benefits of applying this pattern to creating responsive pages.
* [Mdn on `<meta name="viewport">`](<meta name="viewport" content="width=device-width, initial-scale=1">)
* Old discussion about `<meta name="viewport">`: [part1](https://www.quirksmode.org/mobile/viewports.html),
[part2](https://www.quirksmode.org/mobile/viewports2.html)
* [300ms-tap-delay and the viewport]()