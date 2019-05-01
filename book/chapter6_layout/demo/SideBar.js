(function () {
  const template = document.createElement("template");
  template.innerHTML = `
<div id="container">
  <div id="menu">
  <slot name="menu">the menu</slot>
</div>
<div id="content">
  <div id="menuSpacer"></div>
  <slot>the page content</slot>
</div>
</div>
<style>
/*mobile */
div {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
:host([_size="S"]) #menuSpacer {
  height: var(--responsive-element-menu-s-height, 100px);
}
:host([_size="S"]) #menu {
  position: fixed;
  height: var(--responsive-element-menu-s-height, 100px);
  background-color: grey;
}
:host([_size="S"]) #content {
  background-color: #DDDDDD;
  min-height: calc(100% - var(--responsive-element-menu-s-height, 100px));
}
/*desktop*/
:host([_size="L"]) #menu {
  position: fixed;
  height: 100%;
  width: var(--responsive-element-menu-l-width, 250px);
  background-color: grey;
}
:host([_size="L"]) #menuSpacer {
  float: left;
  width: var(--responsive-element-menu-l-width, 250px);
  height: 100%;
}
:host([_size="L"]) #content {
  float: left;
  min-height: 100%;
  background-color: #DDDDDD;
}
</style>
`;

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
    L: 800
  };

  class SideBar extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      /* _size and size-settings*/
      this.__size = undefined;
      this._sizeSettings = defaultSizes;
      this._viewportObserver = this.viewportChanged.bind(this);
      postConstructionCallback(this._viewportObserver);

      /*scroller*/
      this._onScrollListener = this.onScroll.bind(this);
      this._prevScrollpos = undefined;
      this._prevMargin = undefined;
    }

    connectedCallback() {
      window.addEventListener("resize", this._viewportObserver);
    }

    disconnectedCallback() {
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
      const newSize = sorted.length ? sorted[sorted.length - 1][0] : null;
      if (this.__size === newSize)
        return;
      this.__size = newSize;
      this.__size === null ? this.removeAttribute("_size") : this.setAttribute("_size", this.__size);

      /* setup listeners */
      if (this.__size === "S") {
        window.addEventListener("scroll", this._onScrollListener);
        this._prevScrollpos = window.pageYOffset;
        this._prevMargin = 0;
      } else {
        window.removeEventListener("scroll", this._onScrollListener);
        this.shadowRoot.querySelector("#menu").style.transform = undefined;
      }
    }

    onScroll() {
      //todo 2. when we scroll up, the menu is coming down again. But, if you scrolled up to actually see the content
      //todo    above, then you would have to scroll down the whole menu before it made an impact.
      //todo    Therefore, when we scroll up (movement is less than 0), maybe we would like to double the scroll effect
      //todo    while the newMargin is less than menuHeight?

      //todo to fix this, I can add a _doubleDistortion. translateY with a positive value for the
      //
      // when we scroll up, the menu is coming down again. But, if you scrolled up to actually see the content
      // and while the menu is coming down, i.e. for the first 100px,
      if (this._skipMe) {
        this._skipMe = false;
        return;
      }
      const menuHeight = this.shadowRoot.children[0].children[0].offsetHeight;
      const movement = window.pageYOffset - this._prevScrollpos;
      this._prevScrollpos = window.pageYOffset;
      const newMargin = this._prevMargin + movement;
      if (newMargin <= 0) {
        this._prevMargin = 0;
        this.shadowRoot.querySelector("#menu").style.transform = "";
      } else if (newMargin > 0) {
        if (movement < 0 && window.pageYOffset > 0) {
          console.log("boo");
//          debugger;
          this._skipMe = true;
          this._prevScrollpos = window.pageYOffset + movement;
          scroll(window.pageXOffset, this._prevScrollpos);
//          window.pageYOffset = window.pageYOffset + movement;
        }
        this._prevMargin = newMargin >= menuHeight ? menuHeight : newMargin;
        this.shadowRoot.querySelector("#menu").style.transform = "translateY(-" + this._prevMargin + "px)";
      }
    }
  }

  customElements.define("side-bar", SideBar);
})();