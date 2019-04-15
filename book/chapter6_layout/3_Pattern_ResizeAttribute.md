# Pattern: ResizeAttribute

The ResizeAttribute is a pattern for controlling the layout and behavior of a web component 
depending on the viewport size, very similar to MediaQueryAttribute. But, instead of using
the MediaQuery interface, the ResizeAttribute pattern listens only for the `resize` event.

Currently, due to flaws in the MediaQuery library in Chrome, the ResizeAttribute pattern is safer 
and thus more efficient than the MediaQueryAttribute pattern. It also yields much simpler code.

## Implementation

A web component that implements the ResizeAttribute pattern consists of:

 * `size-settings`: a JsonAttribute describing the different thresholds for the media queries.
   The `size-settings` is given on the form `{"XS": 0, "S": 600, "M": 800, "L": 1024}`.
   The MediaQueryAttribute has a static, default settings object to fall back on.

 * `_size`: a StubbornAttribute that reflects the current state of the web component 
   (`.__size` property). Every time the viewport passes one of the thresholds specified in 
   `size-settings`, the web component updates the `_size` attribute.

 * `resize` event listener. For all changes of the viewport, check against the current `size-setting`
   and `__size` prop. If the current size of the viewport would require the web component to update the
   `_size` StubbornAttribute, then do so.
   
<code-demo src="demo/ResizeSmallMediumLarge.html"></code-demo>

```html
<script>

  function postConstructionCallback(cb) {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", cb);
    } else {
      Promise.resolve().then(function () {
        Promise.resolve().then(cb)
      });
    }
  }

  const defaultSizes = {
    S: 0,
    M: 400,
    L: 800
  };

  class SmallMediumLarge extends HTMLElement {
    constructor() {
      super();
      this.__size = undefined;
      this._sizeSettings = defaultSizes;
      this._viewportObserver = this.viewportChanged.bind(this);
      postConstructionCallback(this._viewportObserver);

      /*event listener*/
      this._onScrollListener = this.onScroll.bind(this);
    }

    connectedCallback(){
      window.addEventListener("resize", this._viewportObserver);
    }

    disconnectedCallback(){
      window.removeEventListener("resize", this._viewportObserver);
    }

    static get observedAttributes() {
      return ["_size", "size-settings"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "_size" && newValue !== this.__size)
        this.setAttribute("_size", this.__size);
      if (name === "size-settings")
        this._sizeSettings = newValue ? JSON.parse(newValue) : defaultSizes;
    }

    viewportChanged() {
      const sorted = Object
        .entries(this._sizeSettings)
        .sort(([aKey, aValue], [bKey, bValue]) => aValue <= bValue)
        .filter(([key, value]) => value <= window.innerWidth);
      if (!sorted.length) {
        this.__size = null;
        this.removeAttribute("_size");
      } else {
        this.__size = sorted[sorted.length - 1][0];
        this.setAttribute("_size", this.__size);
        if (this.__size === "S")
          window.addEventListener("scroll", this._onScrollListener);
        else
          window.removeEventListener("scroll", this._onScrollListener);
      }
    }

    onScroll() {
      console.log(this.id, "only observes scroll when its _size is small");
    }
  }

  customElements.define("small-medium-large", SmallMediumLarge);
</script>

<style>
  small-medium-large {
    display: block;
    height: 60%;
  }
  small-medium-large[_size="S"] {
    border-bottom: 5px solid red;
  }
  small-medium-large[_size="M"] {
    border-right: 5px solid orange;
  }
  small-medium-large[_size="L"] {
    border-top: 5px solid green;
  }
</style>

<small-medium-large id="one">
  default sizes
</small-medium-large>
<small-medium-large id="two" size-settings='{"S": 0, "M": 200, "L": 400}'>
  custom sizes
</small-medium-large>
```   

## References

 * [Stackoverflow: viewport dimensions](https://stackoverflow.com/questions/1248081/get-the-browser-viewport-dimensions-with-javascript#answer-8876069)