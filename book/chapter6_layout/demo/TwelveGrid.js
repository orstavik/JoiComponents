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
  left: var(--margin-leftRight);
  right: calc(calc(100% - var(--margin-leftRight)) * 0.382);
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

  //todo we have the ColumnGrid.
  //todo the ColumnGrid has a column="{'S': 12}" for example. When this is user set
  //todo the ColumnGrid has a _size="S,M,L,XL" for example.
  //todo the ColumnGrid has a _column="S,M,L,XL" for example.
  // This can either specify a column number, and the padding,
  //todo or it can inherit them from the parent.
  //todo if we place another ColumnGrid inside it, this column grid will find the max number of columns from its ancestor ColumnGrid and it will listen for changes in its own size to reflect this change. This can be resize only or layoutCallback.
  //todo


  //todo HelicopterParentChild
  //todo the grid has a certain number of columns and padding and margin. Like material grid.
  //todo these can be set as attributes, to enforce triggering of js when they change.
  //todo the children, twelve-grid-item, needs a col-span.
  //todo is it enough to say that there should be *no margin, padding, border* on any elements between
  //todo the twelve-grid and its items? If so, they will skew the layout?
  //todo I can add a function here that --debug the element and when this debug function is run, then it will locate any other element causing problems?

  //todo the grid does its own margin using CSS. The grid must also set its width? or should the grid use CSS grid?

  //todo or should I make them all siblings? If I make them all siblings, they all must define the number of columns
  //todo and margin and padding. They must also be global.

  //todo what is the purpose of the grid? simplify the css? replace a bunch of custom css with a simpler set of web components?
  //todo there is a problem that the grid does not work across iframe borders.. If it needs to do that, then we need to set a series of communication surroundings. Or.. It could be in the iframe a generic set attributes from the iframe host to the root element in the iframe..

  //todo it is not a twelve grid, but a grid with fixed sizes.. And then maybe we need to have these attributes as being reflected out into the DOM. That way, we could search for this context in the lightDOM

  //todo GlobalGrid?
  class TwelveGrid extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this._viewportObserver = this.viewportChanged.bind(this);
    }

    //todo make stubborn attribute _five and _four that are based on slotCallback??

    connectedCallback() {
      window.addEventListener("resize", this._viewportObserver);
      postConstructionCallback(this._viewportObserver);
    }

    disconnectedCallback() {
      window.removeEventListener("resize", this._viewportObserver);
    }

    viewportChanged() {
      const maxWidth = window.innerHeight * 1.618;
      const container = this.shadowRoot.children[0];
      if (window.innerWidth > maxWidth) {
        container.style.maxWidth = maxWidth + "px";
        container.style.setProperty("--m-leftRight", (window.innerWidth - maxWidth) + "px");
        container.style.setProperty("--m-left", ((window.innerWidth - maxWidth) / 2) + "px");
        container.style.setProperty("--m-bottom", 0);
      } else {
        container.style.setProperty("--m-bottom", window.innerHeight - (window.innerWidth / 1.618) + "px");
      }
    }
  }

  customElements.define("golden-grid", TwelveGrid);
})();