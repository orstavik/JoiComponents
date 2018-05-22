import { ChildrenChangedMixin } from "https://unpkg.com/children-changed-callback@1.1.0/src/ChildrenChangedMixin.js";

export class WcBook extends ChildrenChangedMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._newChapterListener = this.doRender.bind(this);
    this._renderChaptersInFlight = undefined;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
<style>
aside {
  background: yellow;
  width: 20%;
  float: left;
}
article {
  background: orange;
  float: left;
  width: 70%;
}
</style>
<aside id="doMe">
  here you make an ingress of all the chapters
</aside>
<article>
  <slot></slot>
</article>`;
    this.addEventListener("new-chapter", this._newChapterListener);
    setTimeout(()=>this.doRender(), 9);
  }

  disconnectedCallback() {
    this.addEventListener("new-chapter", this._newChapterListener);
  }

  getChapters(){
    const chapters = [];
    this.getVisibleChildren().filter((c)=> c instanceof WcChapter).forEach((c)=>{
      chapters.push(c.getChapters());
    });
    return chapters;
  }

  renderChapters(chapters){
    return JSON.stringify(chapters, null, "  ");
  }

  doRender() {
    if (this._renderChapters)
      return;
    this._renderChapters = requestAnimationFrame(() => {
      this.shadowRoot.children[1].innerText = this.renderChapters(this.getChapters());
      this._renderChapters = undefined;
    });
  }
}

export class WcChapter extends ChildrenChangedMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    this.dispatchEvent(
      new CustomEvent("new-chapter", { composed: true, bubbles: true })
    );
  }

  getChapters(){
    const childChapters = this.getVisibleChildren().filter(c => c instanceof WcChapter);
    if (childChapters.length === 0)
      return [this.getAttribute("title")];
    return [this.getAttribute("title"), childChapters.map(c => c.getChapters())];
  }
}