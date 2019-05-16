# Pattern: TrustyBase

The TrustyBase pattern embeds an *untrusted* HTML fragment that can *run scripts* with a 
*separate `baseURI` context* into an HTML document using an `<iframe>`. 

An HTML fragment that is embedded into another document might contain both absolute and relative URLs
that needs to be interpreted based on a different `baseURI` context than the one that exists for the
HTML document that embeds it. In fact, most HTML fragments require such treatment.
HTML code embedded using TrustyBase will make network requests based on its own `baseURI` for all 
network requests from HTML, CSS and JS, both static and dynamic.

However, the embedded HTML fragment does not necessarily originate as a particular file with that 
base. It might, but it might also be produced by the client embedding the code. The `baseURI` and
the `origin` of the HTML fragment is thus split by the TrustyBase.

The TrustyBase considers the HTML fragment as origin as unsafe. It might be implemented as having 
no origin or blob origin. Thus, any content the HTML code in the `<iframe>` stores on the client 
should itself be considered compromised and/or temporary.

The TrustyBase will always be `sandbox="allow-scripts"` and will *never* `allow-same-origin`.

## Alternative 1: `srcdoc`

```html
<template>
  <base href="https://picsum.photos/">
  <img src="/id/1/100/100" alt="">
  <script>
    //debugger;
    //to test the access and rights from the code dropped into the iframe, debug from here.
  </script>
</template>

<iframe sandbox="allow-scripts" frameborder="0"></iframe>
<hr>
<img src="https://picsum.photos/id/0/100/100" alt="">

<script>

  const iframe = document.querySelector("iframe");
  const templ = document.querySelector("template").content.cloneNode(true);
  const div = document.createElement("div");
  div.appendChild(templ);
  iframe.setAttribute("srcdoc", div.innerHTML);
  //debugger;
  //to test the access and rights from the parent browsing context into the code dropped into the iframe, debug from here.
</script>

<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## Alternative 2: blob

Implement and test this

## Demo: `<iframe-base>`

```html
<script>
  function makeBaseString(baseURI) {
    if (!baseURI)
      return "";
    const base = document.createElement("base");
    base.setAttribute("href", baseURI);
    return base.outerHTML;
  }

  class IframeBase extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.appendChild(document.createElement("iframe"));
      this._iframe = this.shadowRoot.children[0];
      this._iframe.setAttribute("sandbox", "allow-scripts");
    }

    static get observedAttributes() {
      return ["srcdoc"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "srcdoc") {
        let src = makeBaseString(this.getAttribute("base")) + (newValue || "");
//        src += '<script>debugger;</scr'+'ipt>';
        this._iframe.setAttribute("srcdoc", src);
      }
    }

  }

  customElements.define("iframe-base", IframeBase);
</script>

<iframe-base
    srcdoc="Hello sunshine! <img src='100/100'>"
    base="https://picsum.photos/id/1/">
</iframe-base>

<hr>
Hello world!
<img src="https://picsum.photos/id/0/100/100" alt="">

<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

