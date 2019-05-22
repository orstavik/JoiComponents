# Pattern: OverflowIframe

The OverflowIframe pattern makes it possible for a safely sandboxed `<iframe>` to overflow in a
given direction deemed safe for user confusion in the parent browsing context.

The OverflowIframe pattern basically transpose the style of an `<overflow-iframe>` into the root 
`<html>` element inside the `document` in the inner `<iframe>`. The inner `<iframe>` then transpose
back out the `scrollWidth` and `scrollHeight` of its `document`, which the inner `<iframe>` uses to
grow or shrink.

To accomplish this, the OverflowIframe pattern uses the following resources:
1. The outer `<overflow-iframe>` element observes the `getComputedStyle(this)` dimensions of
   itself using the `LayoutAttributesMixin`. Whenever its height and/or width changes (which depends 
   on which way it is allowed to overflow), the outer `<overflow-iframe>` sends a message to its
   inner `<iframe>` about the change.
2. The inner `<iframe>` sets a rule in its default stylesheet specifying the updated width and height.
3. The inner `<iframe>` also observes the `scrollWidth` and `scrollHeight` of its root `<html>` 
   element, and sends a message to its parent `<overflow-iframe>` whenever these dimensions change.
   * The inner `<iframe>` polls its `scrollWidth` and `scrollHeight` every 150ms.
     When these dimensions changes it switches to polling every `requestAnimationFrame()`.
     When the dimensions do not change, it switches back to polling every 150ms.
     It only sendMessage to parent browsing context when the dimensions change.

4. The parent `<overflow-iframe>` then sets these new dimensions as the width and height of its 
   inner `<iframe>` element, which is allowed to overflow the boundaries of the outer `<overflow-iframe>`
   element.

As long as the user will not be confused in that the content originates from the `<iframe>` browsing
context and not the parent browsing context, it is unlikely that `<overflow-iframe>` poses a security
risk. For example, in a normal web page flowing left to right, top to bottom, with an `<iframe>` 
positioned bottom right, is unlikely to encounter much problems if it allows the content of this `<iframe>`
overflow on its right or bottom. As far as I can tell.

## WebComp: `<overflow-iframe>`

```html
<script type="module">
  const innerTemplate = `
<style>
html {
  border: none;
  margin: 0;
  padding: 0;
  overflow: visible;
}
</style>
<script>(function(){
  var pW = undefined;
  var pH = undefined;
  const r = document.children[0];
  const s = document.styleSheets[0].cssRules[0];

  window.addEventListener("message", function(e){
    const data = JSON.parse(e.data);
    for (let [key, value] of Object.entries(data)){
      console.log(key, value);
      s.style[key] = value;
    }
    alertSize();
  });

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

  import {OnceLayoutAttributesMixin} from "https://unpkg.com/joicomponents@1.2.30/src/layout/LayoutAttributesMixin.js";

  class OverflowIframe extends OnceLayoutAttributesMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(outerTemplate.content.cloneNode(true));
      this._iframe = this.shadowRoot.children[1];
      window.addEventListener("message", this.onMessage.bind(this))
      this._ready = false;
    }

    static get observedAttributes() {
      return ["srcdoc", "_layout-width"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "_layout-width") {
        console.log(newValue);
        this.sendMessage(JSON.stringify({width: newValue}));
      }
      if (name === "srcdoc") {
        const src = innerTemplate + (newValue || "");
        let blob = new Blob([src], {type: "text/html"});
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
      this._ready = true;
      const dim = JSON.parse(e.data);
      this._iframe.style.width = dim.w + "px";
      this._iframe.style.height = dim.h + "px";
    }
  }

  customElements.define("overflow-iframe-part2", OverflowIframe);
</script>

<h1>Hello world!</h1>
<hr>
<overflow-iframe-part2 auto-layout="w"
                       style="background: lightblue; width: 100%"
                       srcdoc="<h1>Hello sunshine!</h1><h2 style='width: 5000px; border: 2px solid blue;'>I'm toooooo long...</h2><script>setInterval(()=> document.querySelector('h1').innerText += ' goodbye rain! ', 1000);</script>"
></overflow-iframe-part2>

<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## Todo: specify overflow direction

Currently, only support for overflow on the right side is implemented.

Not implemented yet: The OverflowIframe pattern is controlled via an attribute `allow-overflow` that 
can be given one or two directions in the xy-axis such as: `n`, `e`, `s`, `w`, `ne`, `we`. 

## References

 * 