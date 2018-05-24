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
    here you make an ingress of all the chapters
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

  sizeChangedCallback({width, height}) {
    const w = width > 1000 ? "large" : "small";
    this.setAttribute("size", w);
  }

  getChapters() {
    let result = [];
    let chapters = this.getVisibleChildren().filter((c) => c instanceof WcChapter);
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

  getChapters(pos) {
    let id = "chapter_" +pos.join(".");
    this.id = id;
    let result = [[pos, this.getAttribute("title")]];
    const childChapters = this.getVisibleChildren().filter(c => c instanceof WcChapter);
    for (let i = 0; i < childChapters.length; i++) {
      let child = childChapters[i];
      result = result.concat(child.getChapters(pos.concat([i+1])));
    }
    return result;
  }
}

class WcIndex extends HTMLElement {

  // renderChapters2(arrayPosition, chapters, result) {
  //   for (let i = 0; i < chapters.length; i++) {
  //     let chapter = chapters[i];
  //     let arr = arrayPosition.concat([i + 1]);
  //     result.push([arr, chapter[0]]);
  //     let subs = chapter[1];
  //     if (subs)
  //       this.renderChapters2(arr, subs, result);
  //   }
  //   return result;
  // }
  //
  makeLi(pos, title) {
    let a = document.createElement("a");
    a.innerText = pos.length === 1 ? "Chapter " + pos[0] + ": " + title: pos.join(".") + " "+ title;
    a.href = "#chapter_" +pos.join(".");
    a.style ="display: block";
    return a;
  }

  appendChildren(flatChapters) {
    this.innerHTML = "";
    // const flatChapters = this.renderChapters2([], chapters, []);
    const lis = flatChapters.map(([pos, title]) => this.makeLi(pos, title));
    lis.forEach(li => this.appendChild(li));
  }
}