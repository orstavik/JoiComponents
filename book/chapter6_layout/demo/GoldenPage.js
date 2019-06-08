const templ = document.createElement("template");
templ.innerHTML = `
<style>
  ::slotted(:first-child) {
    margin-top: 0;
  }
  #grid {
    display: grid;
    max-width: calc(var(--max-em, 40em) * 1.5);
    grid-template-areas: "a . ."
                        "b c d"
                        "e . .";
    grid-template-rows: 0.618fr auto 1fr;
    grid-template-columns: minmax(0, 2fr) minmax(var(--min-em, 30em), 6fr) minmax(0, 1fr);
  }

  #top {
    grid-area: a;
    width: 22.22%;
    max-width: calc(calc(100% - var(--min-em, 30em)) * 2 / 3);
  }

  #top > div {
    padding-top: 61.8%;
  }

  #left   { grid-area: b;}

  #column { 
    grid-area: c;
    background: var(--column-background, none);
  }

  :host([fixed-length]) #column {
    position: relative;
    padding-top: 161.8%;
  }
  :host([fixed-length]) #column > slot{
    position: absolute;
    display: block;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  #right  { grid-area: d;}

  #bottom {
    grid-area: e;
    width: 100%;
  }
  #bottom > div {
    padding-top: 100%;
  }
</style>
<div id="grid">
  <div id="top"><div></div></div>
  <div id="left"></div>
  <div id="column"><slot></slot></div>
  <div id="right"></div>
  <div id="bottom"><div></div></div>
</div>
`;

class GoldenPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(templ.content.cloneNode(true));
  }
}

customElements.define("golden-page", GoldenPage);