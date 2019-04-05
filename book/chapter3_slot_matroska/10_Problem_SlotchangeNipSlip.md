# Problem: SlotchangeNipSlip

In [Problem: SlotchangeSurprise](7_Problem_SlotchangeSurprise), we saw how multiple `slotchange` 
events can surprise us. In this chapter, we show a `slotchange` event that triggers a `slotchange` 
listener that is *completely* irrelevant. 

When a `slotchange` event triggers an irrelevant event listener like this, we call it a
SlotchangeNipSlip. This problem can enable web components to accidentally eavesdrop 
on other web components' `slotchange` events, potentially causing problems for the other
web component and/or confusing itself.

## Example: `<green-blue-portrait>`

```html
<template id="portrait">
  <style>
    green-frame {
      display: block;
      position: relative;
      width: 300px;
      height: 300px;
    }
    blue-frame {
      position: absolute;
      bottom: 0;
      left: 0;
      display: inline-block;
      box-sizing: border-box;
      width: 100%;
    }
  </style>
  <green-frame>
    <slot id="portraitOne">a picture</slot>
    <blue-frame>
      <slot id="portraitTwo" name="label">of something</slot>
    </blue-frame>
  </green-frame>
</template>

<template id="green">
  <style>
    :host {
      border: 4px solid green;
    }
  </style>
  <slot id="green"></slot>
</template>

<template id="blue">
  <style>
    :host {
      border: 4px solid blue;
    }
  </style>
  <slot id="blue"></slot>
</template>

<script>
  startLog = false;
  function log(e) {
    startLog && console.log(this.tagName, e.composedPath());
  }

  class PortraitFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const template = document.querySelector("#portrait").content.cloneNode(true);
      this.shadowRoot.appendChild(template);
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }

  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const template = document.querySelector("#green").content.cloneNode(true);
      this.shadowRoot.appendChild(template);
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }

  class BlueFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const template = document.querySelector("#blue").content.cloneNode(true);
      this.shadowRoot.appendChild(template);
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }

  customElements.define("blue-frame", BlueFrame);
  customElements.define("green-frame", GreenFrame);
  customElements.define("portrait-frame", PortraitFrame);
</script>

<portrait-frame>¯\_(ツ)_/¯</portrait-frame>

<script>
  startLog = true;                  //has skipped logs during construction, starts log here
  const span = document.createElement("span");
  span.setAttribute("slot", "label");
  span.innerText = "SlotMatroska";
  document.querySelector("portrait-frame").appendChild(span);

</script>

<h3>Explanation:</h3>

The four normal DOM documents look like this (excluding < style > elements):
<pre>
1.---------------------------
index.html
...
  < portrait-frame >
    "¯\_(ツ)_/¯"
...

2.---------------------------
portrait-frame#shadowRoot
  < green-frame >
    < slot#portraitOne >
      "a picture"
    < blue-frame >
      < slot#portraitTwo name="label" >
        "of something"

3.---------------------------
green-frame#shadowRoot
  < slot#green >

4.---------------------------
blue-frame#shadowRoot
  < slot#blue >
</pre>

Adding the "matroska

Below is the flattened DOM _before_ "matroska" is added.
<pre>
...
  < portrait-frame >
    #shadowRoot
      < green-frame >
        #shadowRoot
          < slot#green >
            < slot#portraitOne >
              "¯\_(ツ)_/¯"
            < blue-frame >
              #shadowRoot
                < slot#blue >
                  < slot#portraitTwo >
                    "of something"
</pre>
Important to note here is:
<ol>
  <li>
    blue-frame element is _slotted_ into green-frame.
  </li>
  <li>
    slot#portraitTwo is directly chained to slot#blue.
    But! slot#portraitTwo is NOT directly chained to slot#green.
  </li>
  <li>
    But since the host element blue-frame is put inside slot#green,
    that means that also the blue-frame#shadowRoot and the SlotMatroska
    it contains _also_ is contained within green-frame#shadowRoot and slot#green.
  </li>
</ol>

When "matroska" is added, this changes the flattened DOM and causes a slotchange event
to be dispatched on slot#portraitTwo:
<pre>
...
< portrait-frame >                              _
  #shadowRoot                                   *3
    < green-frame >                             |
      #shadowRoot                               *2
        < slot#green >                          |
          < slot#portraitOne >
            "¯\_(ツ)_/¯"
          < blue-frame >                        |
            #shadowRoot                         *1
              < slot#blue >                     |
                < slot#portraitTwo > slotchange ^
                  < span >
                    "matroska"
</pre>

And prints the following three logs:
<pre>
BLUE-FRAME     [slot#portraitTwo, slot#blue, document-fragment, blue-frame, slot#green, document-fragment, green-frame, document-fragment]
GREEN-FRAME    [slot#portraitTwo, slot#blue, document-fragment, blue-frame, slot#green, document-fragment, green-frame, document-fragment]
PORTRAIT-FRAME [slot#portraitTwo, slot#blue, document-fragment, blue-frame, slot#green, document-fragment, green-frame, document-fragment]
</pre>
When this slotchange event bubbles upwards, it passes *all* three #shadowRoot and slot#blue, slot#green, and slot#portraitTwo,
but not slot#portraitOne.
```

## SlotchangeNipSlip consequences

The SlotchangeNipSlip is a slotchange event "gone awry". Due to the makeup of the SlotMatroska and
the fact that the slotchange event must bubble past inner shadowDOM borders on its way up to its 
shadowRoot top, whenever web components are nested *in a lightDOM*, they will accidentally intercept 
each others slotchange events.

However, there is a universal, pure function that can alert you if a `slotchange` event.
We call this function `notNipSlip(composedPath, shadowRoot)`.
`notNipSlip(..)` checks to see if there are any non-`<slot>` elements between the `shadowRoot`
and `<slot>` elements in the start of the `composedPath`.
All directly chained `<slot>` elements are lined up *at the beginning* of the `composedPath`, and
indirectly chained `<slot>` elements are behind at least *one* non-`<slot>` element in the `composedPath()`.
`notNipSlip(...)` returns `null` if the `slotchange` is a SlotchangeNipSlip; 
otherwise `notNipSlip(...)` returns the `<slot>` element which is housed in the current `shadowRoot`.

```javascript
function notNipSlip(composedPath, shadowRoot){
  for(let node of composedPath){
    if (node.tagName !== "SLOT")
      return null;
    if (node.getRootNode() === shadowRoot)
      return node;
  }
  return null;
}
``` 

## References

 * 