
class MyDelay extends window.setupMixin(HTMLElement) {

  setupCallback() {
    this.attachShadow({mode: "open"});
    let delay = parseInt(this.getAttribute("delay") || 10);
    for (let start = new Date().getTime(); (new Date().getTime() - start) < delay;) ;    //delay
    this.shadowRoot.innerHTML = delay +"ms";
    window.tstFun();
  }
}

//MyPage has a 10 x 10ms counters
class MyPage extends window.setupMixin(HTMLElement) {
  setupCallback() {
    let start = performance.now();
    let counters = parseInt(this.getAttribute("counters") || 10);
    let delay = parseInt(this.getAttribute("delay") || 10);
    let src = `
<style>
  my-delay{
    float: left;
    border: 1px solid blue;
    width: 36px;
    height: 18px;
    overflow: hidden;
  }
</style>
<h5>page TTST: </h5>
`;
    for (var i = 0; i < counters; i++)
      src += "<my-delay delay='"+delay+"'></my-delay>";
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = src;
    this.shadowRoot.children[1].innerText += performance.now() - start;
  }
}

customElements.define("my-delay", MyDelay);
customElements.define("my-page", MyPage);