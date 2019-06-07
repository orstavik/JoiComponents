/*
*
 * The height of the GoldenPage can be fixed as either `fixed-ratio="landscape"` or `fixed-ratio="portrait"`. `fixed-ratio` will override and negate `mode` settings. In `fixed-ratio`, the dimensions of the GoldenPage *and* the text column will be the golden ratio, the margin-left be 2/9 the width, and the dimensions of the top-left margin square be the golden-ratio.

* */

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

  #top1   { grid-area: a;}
  #left   { grid-area: b;}
  #column { grid-area: c;}
  #right  { grid-area: d;}
  #bottom { grid-area: e;}

  #top1 {
    grid-area: a;
    width: 22.22%; /*2/9 = 22.22%, 1/9 = 11.11%*/
    max-width: calc(calc(100% - var(--min-em, 30em)) * 2 / 3);
  }

  #top2 {
    padding-top: 61.8%;
  }
  
  :host([fixed-ratio="portrait"]) #column {
    position: relative;
    padding-top: 161.8%;
  }
  :host([fixed-ratio="portrait"]) #column > slot{
    position: absolute;
    display: block;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  #bottom {
    width: 100%;
  }
  #bottom2 {
    padding-top: 100%;
  }
</style>
<div id="grid">
  <div id="top1"><div id="top2"></div></div>
  <div id="left"></div>
  <div id="column"><slot></slot></div>
  <div id="right"></div>
  <div id="bottom"><div id="bottom2"></div></div>
</div>
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