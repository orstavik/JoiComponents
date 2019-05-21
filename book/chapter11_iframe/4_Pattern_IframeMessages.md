# Pattern: IframeMessages

The IframeMessages pattern illustrate how to send messages back and forth between a web component 
and an inner `<iframe>` that both `allow-scripts`, but that are *not* `same-origin`.

To do so, simply use `.postMessage("stringMessage", "*")` on the `innerIframe.contentWindow` and
`parent` from the parent and `<iframe>` browsing context respectively. The only catch is that the
child might not be ready when the first message is sent. It might take 3-4 animation frames 
*before* the child `<iframe>` has run its script. Thus, a `requestAnimationFrame` que is set up
to delay any message sent before child is ready.

## WebComp: `<iframe-updater>`

```html
<h1>Hello world!</h1>
<hr>
<iframe-updater srcdoc="<h1>Hello sunshine!</h1>"></iframe-updater>

<script type="module">
  (function () {
    const iframeScript = `
<script>
(function(){
  parent.postMessage("ready", "*");
  window.addEventListener("message", function(e){
    console.log("inside iframe: ", JSON.parse(e.data));
  });

  setTimeout(function(){parent.postMessage("one", "*")}, 1000);
  setTimeout(function(){parent.postMessage("two", "*")}, 2000);
  setTimeout(function(){parent.postMessage("three", "*")}, 3000);
})();
</scrip` + "t>";

    class IframeUpdater extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(document.createElement("iframe"));
        this._iframe = this.shadowRoot.children[0];
        this._iframe.setAttribute("sandbox", "allow-scripts");

        this._ready = false;
        window.addEventListener("message", this.onMessage.bind(this))
      }

      static get observedAttributes() {
        return ["srcdoc"];
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (name === "srcdoc") {
          const src =
            iframeScript +
            (newValue || "");
          const blob = new Blob([src], {type: "text/html"});
          this._iframe.setAttribute("src", URL.createObjectURL(blob));
        }
      }

      sendMessage(value) {
        if (!this._ready) {                                                      //delay sending this message until
          console.log("delaying 1 rAF...");
          return requestAnimationFrame(this.sendMessage.bind(this, value));    //inner iframe is ready to receive messages
        }
        this._iframe.contentWindow.postMessage(value, "*");
      }

      onMessage(e) {
        if (e.source !== this._iframe.contentWindow)
          return;
        if (e.data === "ready")
          return this._ready = true;
        console.log("message received in parent: ", e.data);
      }
    }

    customElements.define("iframe-updater", IframeUpdater);

    const iframeUpdater = document.querySelector("iframe-updater");
    iframeUpdater.sendMessage(JSON.stringify(0));
    setTimeout(() => iframeUpdater.sendMessage(JSON.stringify(1)), 1000);
    setTimeout(() => iframeUpdater.sendMessage(JSON.stringify(2)), 2000);
    setTimeout(() => iframeUpdater.sendMessage(JSON.stringify(3)), 3000);
  })();
</script>
<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## References

 * 