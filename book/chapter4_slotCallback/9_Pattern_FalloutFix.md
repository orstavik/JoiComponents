# Pattern: FalloutFix

[Problem: FallbackNodesFallout](../chapter3_slot_matroska/4_Problem_FallbackNodesFallout) describes
how the fallback nodes of an *inner* web component cannot be reused in a SlotMatroska. 
In this chapter we fix this problem using a trick called SlotMasking.

## Trick: SlotMasking

If you add two or more `<slot>` elements with the same `name` attribute in a shadowDOM, 
then all the transposed nodes will *only* be sent to the *first* of these `<slot>` elements.

```html
<script type="module">

  class BlueFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>:host {border: 2px solid blue;}</style>
        <slot>alpha</slot>
        <slot>beta</slot>
        <slot name="janus">one</slot>
        <slot name="janus">two</slot>`;
    }
  }

  customElements.define("blue-frame", BlueFrame);
</script>

Hello <blue-frame> world <span slot="janus"> sunshine </span></blue-frame>
```

SlotMasking breaks the connection between the slotted nodes and the second slot, causing the second 
`<slot>` element to show its fallback nodes.

## Implementation: FalloutFix

FalloutFix uses SlotMasking to divert an EmptyButNotEmpty set of transposed nodes away from an 
original `<slot>` element and to a temporary `<slot>` element with the same `name`.
This temporary `<slot>` element is then hidden using `disply: none`, and the original `<slot>` element
is freed to show its own fallback nodes.

FalloutFix is an internal dynamic, clearly delineated change of a web component's shadowDOM only. 
It does not affect neither transposed nodes nor user web components or apps in any way.

```javascript
import {SlottablesEvent} from "./SlottablesEvent.js";

function hasEmptyChainedSlot(slot) {
  let emptySlot = false;
  let ws = 0;
  for (let node of slot.assignedNodes()) {
    if (node.tagName && node.tagName === "SLOT") {
      if (node.childNodes.length !== 0)
        return false;
      emptySlot = true;
    } else if (node.nodeType !== 3 || /[^\t\n\r ]/.test(node.textContent)) {
      return false;
    } else {
      ws++;
    }
  }
  return ws;
}

function emptyButNotEmpty(slot) {
  let ws = hasEmptyChainedSlot(slot);
  if (ws === false)
    return false;
  const assignedNodesFlatten = slot.assignedNodes({flatten: true});
  for (let node of assignedNodesFlatten) {
    if (node.nodeType === 3 && !(/[^\t\n\r ]/.test(node.textContent)))
      ws--;
    else
      return false;
  }
  return ws === 0;
}

function checkNoFallout(el, slot) {
  const isHidden = slot.classList.contains("__falloutFixHide__");
  const empty = emptyButNotEmpty(slot);
  if (empty && !isHidden) {
    const hider = document.createElement("slot");
    hider.classList.add("__falloutFixHide__");
    hider.setAttribute("name", slot.name);
    hider.style.display = "none";
    el.shadowRoot.prepend(hider);
  } else if (!empty && isHidden) {
    slot.remove();
  }
}

export function FalloutFix(base) {
  return class FalloutFix extends SlottablesEvent(base) {
    constructor() {
      super();
      this.addEventListener("slottables-changed", e => checkNoFallout(this, e.detail.slot));
    }
  }
}
```

## Demo: SlottablesEvent

```html
<script type="module">

  import {FalloutFix} from "../../src/slot/FalloutFix.js";

  class PassePartout extends FalloutFix(HTMLElement) {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            border: 20px solid grey;
          }
          .think {
            border-color: red orange yellow orange;
            border-width:  10px 8px 9px 8px;
            border-style:  dotted dotted dashed dotted;
          }
        </style>

        <div>
          <slot id="inner">
            <div class="think inside the slot">I am a nice elaborate set of DOM nodes!</div>
          </slot>
        </div>`;
    }
  }
  class GreenFrame extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =
        `<style>
          div {
            border: 10px solid green;
          }
        </style>

        <div>
          <passe-partout>
            <slot id="outer" class="redundancy stinks"></slot>
          </passe-partout>
        </div>`;
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame id="one">Hello world from the lightDOM!</green-frame>
<br>
<green-frame id="two"></green-frame>

<script>
  setTimeout(function(){
    document.querySelector("#two").innerText = "hello sunshine!";
  }, 3000);
</script>
<p>
  This example WORKS. "nice elaborate set of DOM nodes!" are shown on screen.
  With FalloutFix, the option of falling back to the nodes specified in slot#inner is possible.
  If GreenFrame wishes to just use the default content of PassePartout,
  it will when its own slot is empty.
</p>
```

## References

 * 
 
