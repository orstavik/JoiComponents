# Pattern: MediaQueryAttribute

The MediaQueryAttribute is a pattern for controlling the layout and behavior of a web component 
depending on the viewport size. 

CSS Media queries is a method to coordinate the setting of an element's:
1. inner style (CSS rules in the shadowDOM),
2. shadowDOM structure (if changes of style and layout cannot be accomplished with CSS alone),
3. inner event listeners (different states of the element require different reactions to events),
4. and outer styles of the host element, its children and/or its descendant elements in the lightDOM.

## Implementation

A web component that implements the MediaQueryAttribute pattern consists of:

 * `size-settings`: a JsonAttribute describing the different thresholds for the media queries.
   The `size-settings` is given on the form `{"XS": 0, "S": 600, "M": 800, "L": 1024}`.
   The MediaQueryAttribute has a static, default settings object to fall back on.

 * `_size`: a StubbornAttribute that reflects the current state of the web component.
   Every time the viewport passes one of the thresholds specified in `size-settings`, 
   the web component updates the `_size` attribute.

 * To observe the viewport, the pattern uses the `MediaQueryList.addListener` interface.
   Every time the `size-settings` changes, the web component updates its list of MediaQuery listeners.
   Every time the MediaQuery listener is triggered, the web component updates its `_size` attribute.

<code-demo src="demo/SmallMediumLarge.html"></code-demo>

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

      /*media query listener*/
      this.__size = undefined;
      this._sizeSettings = undefined;
      this._viewportObserver = this.viewportChanged.bind(this);
      this._mql = undefined;
      postConstructionCallback(function () {
        if (!this._mql)      //only triggers at startup if no size-setting attribute was given at startup
          this.setUpMQL();
      }.bind(this));

      /*event listener*/
      this._onScrollListener = this.onScroll.bind(this);
    }

    static get observedAttributes() {
      return ["_size", "size-settings"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "_size" && newValue !== this.__size)
        this.setAttribute("_size", this.__size);
      if (name === "size-settings")
        this.setUpMQL();
    }

    setUpMQL() {
      //remove old mql listeners (if any)
      if (this._mql) {
        for (let mq of this._mql)
          mq.removeListener(this._viewportObserver);
      }
      //add new mql listeners
      this._mql = [];
      const settings = this.getAttribute("size-settings");
      this._sizeSettings = settings ? JSON.parse(settings) : defaultSizes;
      for (let value of Object.values(this._sizeSettings)) {
        let mq = window.matchMedia('(max-width: ' + value + 'px)');
        mq.addListener(this._viewportObserver);
        this._mql.push(mq);
      }
      this.viewportChanged();
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
##


## References

 * [Stackoverflow: viewport dimensions](https://stackoverflow.com/questions/1248081/get-the-browser-viewport-dimensions-with-javascript#answer-8876069)