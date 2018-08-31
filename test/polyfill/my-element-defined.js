class MyElement extends HTMLElement {

  // constructor(){
  //   super();
  // }
  connectedCallback() {
    this.style.display = "block";
    this.style.width = "200px";
    this.style.height = "200px";
    this.style.borderRadius = "50%";
    this.style.backgroundColor = "purple";
  }
}
// window.WebComponents.waitFor(() => {
  customElements.define("my-element", MyElement);
// });
