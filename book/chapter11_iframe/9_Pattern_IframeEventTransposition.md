# Pattern: IframeEventTransposition

The IframeEventTransposition pattern illustrate how to make events propagate from within an `<iframe>`.
This can enable a parent frame browsing context to react to events such as navigation.

The example below implements a script for the JoiEvent composed event: `browse`.

## WebComp: `<overflow-iframe>`

```html
<script>
  const innerTemplate = `
<script src="https://unpkg.com/joievents@1.0.16/src/link-click-es6.js"></scrip` + `t>
<script src="https://unpkg.com/joievents@1.0.16/src/browse.js"></scrip` + `t>
<script>(function(){
  window.addEventListener("browse", function(e){
    e.preventDefault();
    let event = {type: e.type, timeStamp: e.timeStamp, href: e.getHref()};
    parent.postMessage(JSON.stringify({event}), "*");
  }, true);
})();</scrip` + `t>`;

  const outerTemplate = document.createElement("template");
  outerTemplate.innerHTML = `
<style>
  :host, iframe {
    border: none;
    margin: 0;
    padding: 0;
  }
  :host{
    overflow: visible;
    display: inline-block;
  }
  iframe {
    overflow: hidden;
    height: 100%;     /*initial value only, will be overwritten later*/
    width: 100%;      /*initial value only, will be overwritten later*/
  }
</style>
<iframe sandbox="allow-scripts" scrolling="no" frameborder="0"></iframe>`;

  class OverflowIframe extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(outerTemplate.content.cloneNode(true));
      this._iframe = this.shadowRoot.children[1];
      window.addEventListener("message", this.onMessage.bind(this))
    }

    static get observedAttributes() {
      return ["srcdoc"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "srcdoc") {
        this._iframe.setAttribute("srcdoc", (newValue || "") + innerTemplate);
      }
    }

    onMessage(e) {
      if (e.source !== this._iframe.contentWindow)
        return;
      const res = JSON.parse(e.data);
      if (res.event)
        this.dispatchEvent(new CustomEvent(res.event.type, {bubbles: true, composed: true, detail: {href: res.event.href}}));
    }
  }

  customElements.define("overflow-iframe", OverflowIframe);
</script>

<h1>Hello world!</h1>
<hr>
<overflow-iframe srcdoc="<a href='//bbc.com'>bbc.com</a><hr><a href='//google.com'>google.com</a>"></overflow-iframe>
<script>
  window.addEventListener("browse", function(e){
    console.log("browsing to: ", e);
  });
</script>

<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## Use with: `base`

If don't set the `base` of the content inside the iframe, and you use blob to add its content, then
relative links will be interpreted against blob which will not work. Thus, transposing navigation
events should always also set the base to at minimum `https:`.

## References

 * 