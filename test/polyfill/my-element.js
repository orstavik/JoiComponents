export class MyElement extends HTMLElement {
  connectedCallback() {
    this.style.display = "block";
    this.style.width = "20px";
    this.style.height = "20px";
    this.style.borderRadius = "50%";
    this.style.backgroundColor = "green";
  }
}

