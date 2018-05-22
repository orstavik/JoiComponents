//!! depends on:
//https://cdn.jsdelivr.net/npm/marked/marked.min.js
export class MarkDown extends HTMLElement {

  constructor(){
    super();
    this.attachShadow({mode: "open"});
  }

  async connectedCallback(){
    let src = this.getAttribute("src");
    if (!src)
      this.shadowRoot.innerHTML = "no link in mark-down element";
    let md = await (await fetch(src)).text();
    this.shadowRoot.innerHTML = marked(md);
  }
}