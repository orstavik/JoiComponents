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