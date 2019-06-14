# Pattern: ResponsiveElements

Most modern web apps and pages share one ideal: responsiveness. With CSS media queries, a handful of HTML elements, 10 - 20 CSS rules and a little JS, they make the app be manageable both on a small mobile screen or a larger desktop screen.

To make a web app responsive is not particularly difficult. The problem with responsiveness is that it adds detail to the code. These details gets mixed in with all the other details in the app, building complexity and reducing readability. And, when the app becomes too complex and opaque, it spawns bugs and stops features from being added.

The problem of responsiveness is:
 * How *encapsulate* its details so as to reduce template code in the app to reduce complexity?
 * How hide the details and nuances of responsive behavior and style, while at the same time give the user simple, conventional means to direct it?

The pattern ResponsiveElements is, in my opinion, best practice for how to best encapsulate the main layout responsiveness for an app. 

## Implementation

The ResponsiveElements pattern is built around the ResizeAttribute pattern. In addition to a `_size` StubbornAttribute and a `size-setting` JsonAttribute, ResponsiveElements uses a small shadowDOM that itself uses the `_size` attribute to control its style, and add custom event listeners for the different layout modes.

In the lightDOM, there are *two* relationships between the host ResponsiveElement and its children:

1. The host element has the stubborn `_size` attribute which can be used to style the lightDOM children, in addition to the elements in the shadowDOM.

2. The children elements can be slotted into the `slot=""` (the default) or the `slot="menu"`. The default `slot` is for the larger, page content area, and the `slot="menu"` is for the smaller area.
   
In addition, a set of CSS variables such as `--responsive-element-menu-s-width` and `--responsive-element-menu-l-height` are exposed so the user can control relevant aspects of the ResponsiveElements shadowDOM.

## Example: SideBar

Sidebar is a classical responsive web page/app layout where the menu is placed in a:
 1. a left nav bar on larger screens (`L` mode)
 2. a top nav nar on smaller screens (`S` mode)

The Sidebar is *not* the menu; The ResponsiveSidebar only divides the page layout into two areas: a smaller area called `menu` placed either top or left and a larger default area for page content. In `S` mode, the SideBar will hide/show the `menu` area as the user scrolls down/up.

```html
<template>
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
      height: 100px;
    }
    :host([_size="S"]) #menu {
      position: fixed;
      height: 100px;
      background-color: grey;
    }
    :host([_size="S"]) #content {
      background-color: #DDDDDD;
      min-height: calc(100% - 100px);
    }
    /*desktop*/
    :host([_size="L"]) #menu {
      position: fixed;
      height: 100%;
      width: 250px;
      background-color: grey;
    }
    :host([_size="L"]) #menuSpacer {
      float: left;
      width: 250px;
      height: 100%;
    }
    :host([_size="L"]) #content {
      float: left;
      min-height: 100%;
      background-color: #DDDDDD;
    }
  </style>
</template>

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
    L: 800
  };

  class SideBar extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const template = document.querySelector("template").content;
      this.shadowRoot.appendChild(template.cloneNode(true));

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
      //todo find a smoother alternative for this one
      const movement = window.pageYOffset - this._prevScrollpos;
      this._prevScrollpos = window.pageYOffset;
      const newMargin = this._prevMargin + movement;
      if (newMargin <= 0) {
        this._prevMargin = 0;
        this.shadowRoot.querySelector("#menu").style.transform = "";
      } else {
        this._prevMargin = newMargin >= 100 ? 100 : newMargin;
        this.shadowRoot.querySelector("#menu").style.transform = "translateY(-" + this._prevMargin + "px)";
      }
    }
  }

  customElements.define("side-bar", SideBar);
</script>

<style>
  body {
    margin: 0; padding: 0;
  }
  side-bar {
    display: block;
  }
  side-bar[_size="S"] {
    border-right: 5px solid red;
  }
  side-bar[_size="M"] {
    border-right: 5px solid orange;
  }
  side-bar[_size="L"] {
    border-right: 5px solid green;
  }
  [slot="menu"] {
    background-color: lightblue;
  }
  div#content {
    background-color: pink;
  }
</style>

<side-bar size-settings='{"S": 0, "L": 600}'>
  <div slot="menu">Here comes the menu</div>
  <div id="content" style="height: 125vh;">content</div>
</side-bar>
```

## References

 * [W3c: Responsive SideBar](https://www.w3schools.com/howto/howto_css_sidebar_responsive.asp)
