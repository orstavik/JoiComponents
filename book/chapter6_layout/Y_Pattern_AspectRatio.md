# Pattern: AspectRatio

AspectRatio pattern uses the trick of setting `padding-top` on an empty container `<div>` element to be a `%` of the width of the `<div>`. Inside this container element another element is then placed whose borders are bound to the empty container with the fixed and correct aspect ratio. All this CSS is then wrapped inside a nice and tidy web component called `<aspect-ratio>`.

To control the aspect ratio of `<aspect-ratio>`, set a CSS variable on the element called `--aspect-ratio` (default: `--aspect-ratio: 0.618`, the golden ratio, landscape mode). Other likely `--aspect-ratio` values are:

1. `--aspect-ratio: 1.618`: The golden ratio portrait mode.
2. `--aspect-ratio: 0.75`: 4:3, old television mode.
3. `--aspect-ratio: 0.5625`: 16:9, new television mode.

## Implementation

```javascript
const templ = document.createElement("template");
templ.innerHTML = `<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
#container {
  width: 100%;
  padding-top: calc(100% * var(--aspect-ratio, 0.618));
  position: relative;
}

#content {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style><div id="container"><div id="content"><slot></slot></div></div>`;

class AspectRatio extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(templ.content.cloneNode(true));
  }
}
customElements.define("aspect-ratio", AspectRatio);
```

## Demo: AspectRatio

```html
<script src="AspectRatio.js"></script>

<aspect-ratio style="--aspect-ratio: 0.75; background: yellow; display: block;">test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test </aspect-ratio>

<aspect-ratio style="background: orange; display: block;">test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test </aspect-ratio>
```

## References

 * [w3schools: aspect ratio](https://www.w3schools.com/howto/howto_css_aspect_ratio.asp)