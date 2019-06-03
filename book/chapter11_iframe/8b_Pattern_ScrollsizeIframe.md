# Pattern: ScrollsizeIframe

The ScrollsizeIframe pattern makes it possible for a safely sandboxed `<iframe>` to overflow 
right- and downwards. This enables the content inside the iframe to overlay or 
replace other content from the embedding, parent frame, thus enabling the iframe content to
clickjack or keyboard-jack users expecting a form or links or other actions right of or below the
iframe. ScrollsizeIframe pattern must therefore not be used in a visual context where UI content is 
expected to the right of or below the iframe content.

The outer ScrollsizeIframe element has two properties, `flow-width` and `flow-height`.
These two properties are transposed into the inner `<iframe>` every time they change.
Inside the inner `<iframe>`, they are used as the `width` and `height` dimensions of the root
`<html>` element. 

The inner `<iframe>` observes its own `scrollWidth` and `scrollHeight` properties.
Whenever these properties change, the inner `<iframe>` alerts its parent which then resets the
`<iframe>`'s size so that it has enough space to show all its content without scrollbars.

todo: implement a mechanism to stop polling scrollsize inside the inner iframe being controlled 
with an attribute/method from the outer parent element.

## Open issues

There are three issues the ScrollsizeIframe pattern does not solve:

1. There is *no* way to transpose the viewport width and height from the parent frame into the
   `<iframe>`. This means that if the embedded HTML fragment inside the `<iframe>` uses `vh`, `vw`,
   `vmin`, or `vmax`, then these properties will be wrong.
   (The only situation where these properties will still be correct is the situation where the content
   does not overflow the `<iframe>` and the `<iframe>` fills the parent viewport entirely.)
   
   There is a potential fix for this. `<meta name="viewport" ...>` could be used to define these 
   properties in an `<iframe>`. Or, a `viewport` attribute could be added to the `<iframe>` element.
   However, this is just a dream. No browser, asfaik, has even considered this.
   
2. The viewport of the ScrollsizeIframe element is static. This means that a script must update the
   `flow-width` and `flow-height` if these properties are to change.
   
   Originally, my intent was to make one ScrollsizeIframe web component that would update these two 
   properties automatically. But. The semantics of an element's size is extremely complex. 
   It depends on `display` mode in addition to `position` type, which is both interpreted from an 
   ancestor found in context.
   
   To make the methods necessary for such options would require making a `.getInnerSize()` and 
   `onSizeChange` callback or event, for all combinations of `display` and `position` modes. 
   This task is considered beyond the scope of this pattern.
   
3. The ScrollsizeIframe only overflows right and down. It does not overflow left and top. 
   
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

  class ScrollsizeIframe extends OnceLayoutAttributesMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(outerTemplate.content.cloneNode(true));
      this._iframe = this.shadowRoot.children[1];
      window.addEventListener("message", this.onMessage.bind(this))
      this._ready = false;
    }

    static get observedAttributes() {
      return ["srcdoc"];
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

  customElements.define("overflow-iframe-part2", ScrollsizeIframe);
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

## A problem: `vh` and `vw` relative to the `<iframe>`, not the embedding document

If you use for example `vh` in the HTML fragment embedded that would grow the size of the scrollable 
document, then that would increase the size of the iframe, which in turn would increase the size of 
the `HMTL` `documentElement` in the `<iframe>`, which in turn would make the `vh` grow, etc. etc.
The same goes with `vw`, and when they both shrink the page.

The same problem for percentages does not apply, as the documentElement with its size is specified using 
overflow, thus not causing infinite loops. The documentElement inside the `<iframe>` contains `%`.

And the real problem with this: it cannot be fixed.
The only way to fix it would be to enable JS based scrolling, which will be too laggy to be an option!

The solution would be to use `<meta name="viewport">` as a mechanism to specify the viewport of an
`<iframe>`. Alternatively, set up a similar attribute on `<iframe>` that specifies what viewport it 
should use.


## Old drafts

To accomplish this, the ScrollsizeIframe pattern uses the following resources:
1. The inner `<iframe>` sets a rule in its default stylesheet specifying the updated width and height.
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


## References

 * [A tale of two viewports](https://www.quirksmode.org/mobile/viewports.html)
 * [SO: `vh` inside `<iframe>`](https://stackoverflow.com/questions/34057239/css-vh-units-inside-an-iframe)
 * [CSS tricks: `--vh` (which won't work in our usecase)](https://css-tricks.com/the-trick-to-viewport-units-on-mobile/)
 * [google web fundamentals: `<meta name="viewport">` basics](https://developers.google.com/web/fundamentals/design-and-ux/responsive/)
 * [CSSWG discussion: Why `@viewport{...}` will not work (and why )](https://github.com/w3c/csswg-drafts/issues/258)
 * [MDN: containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block)
 