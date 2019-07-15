# Pattern: NoShadowPointerEvents

The shadowDOM is real. From the point of view of the lightDOM template, the elements and DOM nodes in the shadowDOM "don't exist". But, on screen they appear. And the user *can* click them. Hover them. Scroll on them. On screen, shadowDOM elements *can be interacted with*. Technically, shadowDOM elements will trigger `pointer-events`. 

Sometimes, this is what you want. And then you don't really need to do anything. But, often, you wan't to *disable the `pointer-events` for shadowDOM elements*. To do this, you need to:
1. disable `pointer-events` for all (or a select group of) shadowDOM elements, and 
2. re-enable `pointer-events` for all `::slotted` elements.

And this is simple. It is no trick at all. You just add a `<style>` element like this in the shadowDOM of the web component.

```html
<style>
  * {
    pointer-events: none; /*turn pointer-events off for all elements*/
  }
  .select.group {
    pointer-events: none; /*turn pointer-events off for a select group of elements*/
  }
  ::slotted(*) {          /*REMEMBER ME?! turn pointer-events back on for slotted elements*/
    pointer-events: auto;
  }
</style>
```

## Example: AlertBorder

`<alert-border>` is an element that will highlight a border around the whole screen according to a `code` attribute:
1. `code="red"` paints a wide, red border,
2. `code="yellow"` paints a thin, orange border, and
3. `code="green"` paints no border.

To get the border visible on top of everything else, it will be given a high `z-index`. Usually, it is a bad idea to play around with `z-index` inside a shadowDOM, but this time an exception is granted as we want the border to grab attention and be visible above all other content. (And because this is only an example to illustrate the perils of *not* disabling pointer-events for shadowDOM elements.) 

```html
<style>
  margin: 0;
  padding: 0;
</style>
<alert-border>
  <h1>hello red</h1>
  <h1>hello yellow</h1>
  <h1>hello sunshine</h1>
</alert-border>

<script >
  class AlertBorder extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
  <style>
    * {
      pointer-events: none;
    }
    ::slotted(*) {
      pointer-events: auto;
    }
    div {
      position: fixed;
      margin: 0;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    :host([code="red"]) div {
      border: solid 10px red;
    }
    :host([code="yellow"]) div {
      border: solid 3px orange;
    }
  </style>    
  <div></div>
  <slot></slot>
      `;
    }
  }
  
  customElements.define("alert-border", AlertBorder);

  document.querySelector("body").addEventListener("click", function(e){
    if (e.target.innerHTML === "hello red")
      document.querySelector("alert-border").setAttribute("code", "red");
    else if (e.target.innerHTML === "hello yellow")
      document.querySelector("alert-border").setAttribute("code", "yellow");
    else if (e.target.innerHTML === "hello sunshine")
      document.querySelector("alert-border").removeAttribute("code");
  })                                                     
</script>
```

Now, you might protest. "There is no reason to use this pattern here! We can simply set `pointer-events: none` on the `<div>` with the colored border, and then we don't have to set and reset `pointer-events: none` for the `<slot>` and `:slotted(*)` elements." And yes, this is true. And yields cleaner code. But. In many circumstances the elements you need to turn off pointer-events for is on the same branch as the `::slotted(*)` elements, and then this pattern is what you need.

## References

 * 