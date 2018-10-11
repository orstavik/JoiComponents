import {SlottableMixin, flattenedChildren} from "../src/slot/SlottableMixin.js";
import {ResizeMixin} from "https://cdn.rawgit.com/orstavik/JoiComponents/master/src/ResizeMixin.js";

export class WcBook extends ResizeMixin(SlottableMixin(HTMLElement)) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this._newChapterListener = this.doRender.bind(this);
    this._renderChaptersInFlight = undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    customElements.define("wc-index", WcIndex);
    this.shadowRoot.innerHTML = `
<style>
  :host{
    display: block;
    width: 100%;
  }
  div#grid{
    display: grid;
    grid-template-areas: 
        "aside" 
        "article";  
    grid-template-columns: 1fr 1fr;

    width: 100%;
  }
  :host([size="large"]) > div#grid{
    grid-template-areas: "aside article";  
    grid-template-columns: 1fr 3fr;
  }
  :host([size="small"]) > div#grid {
    font-size: 4vw;
  }
  wc-index {                                                                                 
    grid-area: aside;
    background: #c2ecf9;
    cursor: default; 
  }
  article {
    grid-area: article;
    overflow-wrap: break-word;
    background: #fff1c2;
    float: left;
  }
</style>
<div id="grid">
  <wc-index id="doMe">
    Index
  </wc-index>
  <article>
    <slot></slot>
  </article>
</div>
`;
    this.addEventListener("new-chapter", this._newChapterListener);
    setTimeout(() => this.doRender(), 9);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.addEventListener("new-chapter", this._newChapterListener);
  }

  resizeCallback({width, height}) {
    const w = width > 1000 ? "large" : "small";
    this.setAttribute("size", w);
  }

  getChapters() {
    let result = [];
    let chapters = flattenedChildren(this).filter((c) => c instanceof WcChapter);
    for (let i = 0; i < chapters.length; i++) {
      let c = chapters[i];
      result = result.concat(c.getChapters([i+1]));
    }
    return result;
  }

  doRender() {
    if (this._renderChapters)
      return;
    this._renderChapters = requestAnimationFrame(() => {
      this.shadowRoot.children[1].children[0].appendChildren(this.getChapters());
      this._renderChapters = undefined;
    });
  }
}

export class WcChapter extends SlottableMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    this.dispatchEvent(
      new CustomEvent("new-chapter", {composed: true, bubbles: true})
    );
  }

  getChapters(pos) {
    this.id = "chapter_" +pos.join(".");
    let result = [[pos, this.getAttribute("title")]];
    const childChapters = flattenedChildren(this).filter(c => c instanceof WcChapter);
    for (let i = 0; i < childChapters.length; i++) {
      let child = childChapters[i];
      result = result.concat(child.getChapters(pos.concat([i+1])));
    }
    return result;
  }
}

class WcIndex extends HTMLElement {

  makeLink(pos, title) {
    let a = document.createElement("a");
    a.innerText = pos.length === 1 ? "Chapter " + pos[0] + ": " + title: pos.join(".") + " "+ title;
    a.href = "#chapter_" +pos.join(".");
    a.style ="display: block";
    return a;
  }

  appendChildren(flatChapters) {
    this.innerHTML = "";
    const lis = flatChapters.map(([pos, title]) => this.makeLink(pos, title));
    lis.forEach(li => this.appendChild(li));
  }
}