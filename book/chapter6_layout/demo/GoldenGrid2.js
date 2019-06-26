import {AspectRatio} from "./AspectRatio.js";

//the golden grid is full-screen based. This means that it uses the resize event to trigger its sizing.

(function () {
  const template = document.createElement("template");
  template.innerHTML = `
<aspect-ratio>
  <slot></slot>
</aspect-ratio>

<style>
:host, * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  pointer-events: none;
}

aspect-ratio {
  position: relative;
  margin: auto;
}

slot {
  pointer-events: auto;
}
::slotted(*) {
  display: none;
}
::slotted([one]) {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 38.2%;
  bottom: 0;
}
::slotted([two]) {
  display: block;
  position: absolute;
  top: 0;
  left: 61.8%;
  right: 0;
  bottom: 0;
}
::slotted([three]) {
  display: block;
  position: absolute;
  top: 61.8%;
  left: 61.8%;
  right: 0;
  bottom: 0;
}
::slotted([three-small]) {
  display: block;
  position: absolute;
  top: 61.8%;
  left: 76.4%;
  right: 0;
  bottom: 0;
}
::slotted([four]) {
  display: block;
  position: absolute;
  top: 61.8%;
  left: 61.8%;
  right: 23.6%;
  bottom: 0;
}
::slotted([four-small]) {
  display: block;
  position: absolute;
  top: 76.4%;
  left: 61.8%;
  right: 23.6%;
  bottom: 0;
}
::slotted([five]) {
  display: block;
  position: absolute;
  top: 61.8%;
  left: 61.8%;
  right: 23.6%;
  bottom: 23.6%;
}
</style>
`;

  function postConstructionCallback(cb) {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", cb);
    } else {
      requestAnimationFrame(cb);
    }
  }

  class GoldenGrid extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this._viewportObserver = this.viewportChanged.bind(this);
    }

    //todo make stubborn attribute _five and _four that are based on slotCallback

    connectedCallback() {
      window.addEventListener("resize", this._viewportObserver);
      postConstructionCallback(this._viewportObserver);
    }

    disconnectedCallback() {
      window.removeEventListener("resize", this._viewportObserver);
    }

    viewportChanged() {
      const maxWidth = Math.floor(window.innerHeight * 1.618);
      if (window.innerWidth > maxWidth)
        this.shadowRoot.children[0].style.maxWidth = maxWidth + "px";
    }
  }

  customElements.define("golden-grid", GoldenGrid);
})();