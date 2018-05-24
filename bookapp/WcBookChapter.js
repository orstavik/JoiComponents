import {ChildrenChangedMixin} from "https://unpkg.com/children-changed-callback@1.1.0/src/ChildrenChangedMixin.js";
import {SizeChangedMixin} from "https://cdn.rawgit.com/orstavik/JoiComponents/master/src/SizeChangedMixin.js";

export class WcBook extends SizeChangedMixin(ChildrenChangedMixin(HTMLElement)) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this._newChapterListener = this.doRender.bind(this);
    this._renderChaptersInFlight = undefined;
  }

  connectedCallback() {
    super.connectedCallback();
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
  aside {                                                                                 
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
  <aside id="doMe">
    here you make an ingress of all the chapters
  </aside>
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

  sizeChangedCallback({width, height}) {
    const w = width > 1000 ? "large" : "small";
    this.setAttribute("size", w);
  }

  getChapters() {
    const chapters = [];
    this.getVisibleChildren().filter((c) => c instanceof WcChapter).forEach((c) => {
      chapters.push(c.getChapters());
    });
    return chapters;
  }

  renderChapters2(arrayPosition, chapters, result) {
    for (let i = 0; i < chapters.length; i++) {
      let chapter = chapters[i];
      let arr = arrayPosition.concat([i]);
      result.push([arr, chapter[0]]);
      let subs = chapter[1];
      if (subs)
        this.renderChapters2(arr, subs, result);
    }
    return result;
  }

  appendAside(pos, title) {
    let a = document.createElement("li");
    a.innerText = JSON.stringify(pos) + " : " + title;
    return a;
  }

  renderChapters(chapters) {
    debugger;
    let rendered = this.renderChapters2([], chapters, []);
    let lis = rendered.map(([pos, title]) => this.appendAside(pos, title));
    return lis;
  }

  doRender() {
    if (this._renderChapters)
      return;
    this._renderChapters = requestAnimationFrame(() => {
      this.shadowRoot.children[1].children[0].innerHTML = "";
      this.renderChapters(this.getChapters()).forEach(li => this.shadowRoot.children[1].children[0].appendChild(li));
      this._renderChapters = undefined;
    });
  }
}

export class WcChapter extends ChildrenChangedMixin(HTMLElement) {
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

  getChapters() {
    const childChapters = this.getVisibleChildren().filter(c => c instanceof WcChapter);
    if (childChapters.length === 0)
      return [this.getAttribute("title")];
    return [this.getAttribute("title"), childChapters.map(c => c.getChapters())];
  }
}