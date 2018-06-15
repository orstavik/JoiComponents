# Advanced: Chaining `<slot>`

Custom elements *can* use each other in their shadowDOM.
When used in this way, things get a bit more complicated and 
require some further explanations.
We start by looking at a new example.

## Example: BlueFrame with PassePartout
In this example we will make a blue frame with a white passe-partout and a little label.
`BlueFrame` is similar to our simple `GreenFrame` example, 
but instead of just displaying the image directly,
`BlueFrame` also wraps its content in another custom element `PassePartout`.

In addition, `BlueFrame` also adds a custom attribute `sold`. 
If `BlueFrame` is marked `sold`, then a little red dot will 
appear in the bottom right corner of the `PassePartout`.

```html
<script>
  class BlueFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =             
        `<style>
          :host {
            display: inline-block;                                  
            border: 10px solid blue;
          }
          #sold {
            display: none;
            background: red;
            border-radius: 50%;
            width: 10px;
            height: 10px;
            position: absolute;
            bottom: 5px;
            right: 5px;
          }
          :host([sold]) #sold {
            display: block;
          }
        </style>
        <passe-partout>                            <!-- [1] /-->
          <slot></slot>                            <!-- [2] /-->
          <slot name="label" slot="label"></slot>  <!-- [3] /-->
          <div id="sold"></div>                    <!-- [4] /-->
        </passe-partout>
        `;                      
    }
  }
  class PassePartout extends HTMLElement {       
    
    constructor(){                                      
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =             
        `<style>
          :host {
            display: inline-block;
            position: relative;                                  
            background: white;
            padding: 12px;
          }
          div {
            text-align: center;
          }
        </style>
        <slot></slot>
        <div id="label">
          <slot name="label"></slot>               <!-- [3b] /-->
        </div>
        `;                      
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("blue-frame", BlueFrame);
</script>

<blue-frame sold>
  <img src="theSea.jpg">
  <span slot="label">Picture of the ocean</span>
</blue-frame>
```

We imagine the flattened DOM of these two elements:
```html
<blue-frame sold>
  <style>
    /*__only_applies_to_some_particular_nodes__*/
  </style>
  <passe-partout>                          
    <style>
      /*__only_applies_to_some_particular_nodes__*/    
    </style>
    <img src="theSea.jpg">
    <div id="sold"></div>                  
    <div id="label">
      <span slot="label">Picture of the ocean</span>
    </div>
  </passe-partout>
</blue-frame>
```

[Play with BlueFrame with PassePartout on codepen.io.](https://codepen.io/orstavik/pen/aKWyjV)

To see what is going on here, look at the shadowDOM of `BlueFrame`:

1. `<blue-frame>` uses `<passe-partout>` as an element inside itself.
Our two custom elements are nested.
The `host` node of `<passe-partout>` is placed inside the shadowDOM of `<blue-frame>`,
while the `host` node of `<blue-frame>` is placed as an HTML tag directly in our HTML document.
   1. Two different shadowDOMs are set up.
   Innermost, we have the shadowDOM of the `<passe-partout>` element.
   Then, outside this shadowDOM, we have the shadowDOM of the `<blue-frame>` element.
   2. We also have two lightDOMs.
   The `host` node of `<passe-partout>` resides in the shadowDOM of `<blue-frame>`.
   Therefore, from the perspective of `<passe-partout>`, 
   its lightDOM is the shadowDOM of `<blue-frame>`, *not* the main html document.
   The `host` node of `<blue-frame>` resides in the main html document.
   From the perspective of `<blue-frame>`, the lightDOM is the main document.

2. The empty-name `<slot>` of `<blue-frame>` is put as a direct child of the `host` node of `<passe-partout>`.
This means that all nodes assigned to the empty-name `<slot>` of `<blue-frame>` will also be 
assigned to the empty-name `<slot>` of `<passe-partout>`.
We say that the two `<slot>` elements of `<blue-frame>` and `<passe-partout>` are chained,
and that the `<img>` is *transposed* from the top-level document, 
via the `<slot>` in `<blue-frame>` shadowDOM, and into the shadowDOM of `<passe-partout>`.

3. A similar chaining of named `<slot>`s can also be performed.
The `<span slot="label">` in top level document (3b) is transposed
*via* the `<slot name="label" slot="label">` in `<blue-frame>` *into*
`<slot name="label">` in the shadowDOM of `<passe-partout>`.

4. When chaining `<slot>`s, it is possible to also add nodes along the way.
The little red dot that signals if the picture in the frame has been sold, 
is added in the shadowDOM of `<blue-frame>`. 
This means that the `.assignedNodes()` of the innermost `<slot>` in `<passe-partout>` originate 
from two different lightDOMs. This technique I call "multi-sourced-slots".