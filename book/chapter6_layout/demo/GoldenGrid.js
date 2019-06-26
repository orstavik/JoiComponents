import {AspectRatio} from "./AspectRatio.js";

//the golden grid is full-screen based. This means that it uses the resize event to trigger its sizing.

(function () {
  const template = document.createElement("template");
  template.innerHTML = `
<aspect-ratio>
  <div class="container">
    <slot></slot>
  </div>
</aspect-ratio>

<style>
:host, * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  pointer-events: none;
}

aspect-ratio {
  display: block;
  margin: auto;
}

slot {
  pointer-events: auto;
}

.container{
  display: grid;
  grid-template-areas: 
  "one two two"  
  "one three three"
  "one three three";  
  grid-template-columns: 1.618fr 0.382fr 0.618fr; 
  grid-template-rows: 1.618fr 0.382fr 0.618fr; 
  width: 100%;
  height: 100%;
}
:host([four]) .container{
  grid-template-areas: 
  "one two two"  
  "one four three"
  "one four three";  
}
:host([five]) .container{
  grid-template-areas: 
  "one two two"  
  "one five three"
  "one four three";  
}
::slotted(*:not([one]):not([two]):not([three]):not([four]):not([five])) {
  display: none;
}
:host(:not([five])) ::slotted([five]){
  display: none;  
}
:host(:not([four])) ::slotted([four]),
:host(:not([four])) ::slotted([four])
{
  display: none;  
}
::slotted([one]) {
  grid-area: one;
}
::slotted([two]) {
  grid-area: two;
}
::slotted([three]) {
  grid-area: three;
}
::slotted([four]) {
  grid-area: four;
}
::slotted([five]) {
  grid-area: five;
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