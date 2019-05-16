# Pattern: IframeEventTransposition

The IframeEventTransposition pattern illustrate how to make events propagate from within an `<iframe>`.
This can enable a parent frame browsing context to react to events such as navigation and scrolling.

Be aware that scripts inside the 

## WebComp: `<overflow-iframe>`

```html
<script>
  const innerTemplate = `
<script>(function(){
  var pW = undefined;
  var pH = undefined;
  const r = document.children[0];
  r.style.border = "none";
  r.style.margin = 0;
  r.style.padding = 0;
  r.style.overflow = "hidden";

  function alertSize() {
    const w = r.scrollWidth, h = r.scrollHeight;
    if (pW === w && pH === h)
      return setTimeout(alertSize, 150);
    parent.postMessage(JSON.stringify({w, h}), "*");
    requestAnimationFrame(alertSize);
  }
  alertSize();
})();</scrip` + `t>`;

  const outerTemplate = document.createElement("template");
  outerTemplate.innerHTML = `
<style>
  :host, iframe {
    border: none;
    margin: 0;
    padding: 0;
    overflow: visible;
  }
  :host{
    display: inline-block;
  }
  iframe {
    height: 100%;
    width: 100%;
  }
</style>
<iframe sandbox="allow-scripts" frameborder="0"></iframe>`;

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
        this._iframe.setAttribute("srcdoc", innerTemplate + (newValue || ""));
      }
    }

    onMessage(e) {
      if (e.source !== this._iframe.contentWindow)
        return;
      const dim = JSON.parse(e.data);
      this._iframe.style.width = dim.w + "px";
      this._iframe.style.height = dim.h + "px";
    }
  }

  customElements.define("overflow-iframe", OverflowIframe);
</script>

<h1>Hello world!</h1>
<hr>
<overflow-iframe
    style="background: lightblue; width: 100%"
    srcdoc="<h1>Hello sunshine!</h1><script>setInterval(()=> document.querySelector('h1').innerText += ' goodbye rain! ', 1000);</script>"
></overflow-iframe>

<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## Todo

There are problems with the overflow here. I am not sure how to control the max width of the iframe
best.

Not implemented yet: The OverflowIframe pattern is controlled via an attribute `allow-overflow` that 
can be given one or two directions in the xy-axis such as: `n`, `e`, `s`, `w`, `ne`, `we`. 

Currently only top left overflow is happening, flowing from top left corner out bottom right.

## References

 * 