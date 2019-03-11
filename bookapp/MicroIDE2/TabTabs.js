import {SlotchangeMixin} from "https://cdn.rawgit.com/orstavik/JoiComponents/master/src/SlottableMixin.js";

const tabsTemplate = document.createElement("template");
tabsTemplate.innerHTML = `
<style>
  #top {
    height: 30px;
    background: lightgrey;
  }
  span {
    display: inline-block;
    margin: 3px;
    border: 2px solid white
  }
  span[active] {
    background: white;
  }
  #bottom {
    height: 400px;
    border: 2px  solid lightgrey;
  }
</style>
<div id="top">.</div>
<div id="bottom">
  <slot></slot>
</div>`;

export class TabsTabs extends SlotchangeMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(tabsTemplate.content.cloneNode(true));
    this.$top = this.shadowRoot.children[1];
    this.tabs = undefined;
    this.active = undefined;
    this.addEventListener("click", (e) => this.onClick(e));
  }

  childActivated(child, toActive){
    if (toActive === (this.active === child)) //no change, the child either was inactive + becoming inactive
      return;                                 //or was active + becoming active
    this.updateActive(toActive ? child : undefined);
  }

  onClick(e) {
    if (!(e.path[3] === this) && e.path[0].tagName === "span")
      return;
    e.stopPropagation();
    e.preventDefault();
    let activeNr = Array.from(this.$top.children).findIndex(span => e.path[0] === span);
    this.updateActive(this.tabs[activeNr]);
  }

  slotchangedCallback(name, newValue) {
    this.tabs = newValue.filter(n => n instanceof HTMLElement && n.constructor.name === "TabTab");
    this.active = undefined;
    this.updateActive();
  }

  updateActive(newActive) {
    if (!this.tabs)
      return;
    this.active = newActive ?
      newActive :
      this.tabs.find(n => n.hasAttribute("active")) || this.tabs[0];
    for (let tab of this.tabs)
      tab.toggleActive(tab === this.active);
    this.updateLabels();
  }

  updateLabels() {
    if (!this.tabs)
      return;
    let miniMe = "";
    for (let tab of this.tabs)
      miniMe += `<span ${this.active === tab ? "active" : ""}>${tab.getAttribute("name") || undefined}</span>`;
    this.$top.innerHTML = miniMe;
  }
}

const tabTemplate = document.createElement("template");
tabTemplate.innerHTML = `
  <style>
    :host(:not([active])) ::slotted(*){ visibility: hidden; }
  </style>
  <slot></slot>`;

export class TabTab extends HTMLElement {
  static get observedAttributes() {
    return ["name", "active"];
  }

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(tabTemplate.content.cloneNode(true));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "active")
      this.parentNode.childActivated && this.parentNode.childActivated(this, newValue !== null);
    if (name === "name")
      this.parentNode.updateLabels && this.parentNode.updateLabels();
  }

  toggleActive(bool) {
    if (this.hasAttribute("active") !== bool)
      bool ? this.setAttribute("active", "") : this.removeAttribute("active");
  }
}