# Pattern: FalloutFix

[Problem: FallbackNodesFallout](../chapter3_slot_matroska/4_Problem_FallbackNodesFallout) describes
how the fallback nodes of an *inner* web component cannot be reused in a SlotMatroska. 
In this chapter we fix this problem, with no external and minimal internal impact.

In principle, the FalloutFix breaks the connection between the slotted nodes and the slot,
while interfering with the internal styles of the renamed `<slot>` elements as little as possible.
This dynamic change of the `<slot>` element is internal to the web component. No other external 
element should use the `<slot>` element's `name` attribute for other purposes than transposing nodes.
And, this behavior is exactly what we desire to enhance.

Inside the web component, the developer should keep an eye out for `slot[name="X"]` selectors. 
If you need to select `<slot>` elements in CSS and JS, give them different `id`s in the shadowDOM.
Use selectors that use the `<slot>` element's id, such as `slot#idNotName`, not `slot[name=xyz]`. 
If it can't be helped, use `slot[name^=xyz]`.

## Implementation: FalloutFix

The FalloutFix algorithm is:

1. When `slottables-changed` yields a set of EmptyButNotEmpty nodes for a `<slot>` with a `name`=X,
2. then find all `slot[name=X]` in the shadowDOM,
3. and *suffix* their `name` with `_EmptyButNotEmpty`.

1. When `slottables-changed` yields a set of *not*EmptyButNotEmpty nodes for a `<slot>` with a `name`=X,
2. then find all `slot[name=X_EmptyButNotEmpty]` in the shadowDOM,
3. and *remove the suffix* "_EmptyButNotEmpty" from their `name` attribute. 

This will effectively rename and thus *hide* any `<slot>` element in the shadowDOM that has an 
EmptyButNotEmpty set of `assignedNodes`, just until their `assignedNodes` are no longer 
EmptyButNotEmpty. While hidden, no transposed nodes will reach them, thus allowing them to show their
own fallback childNodes.

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

const suffix = "_EmptyButNotEmpty";

function checkNoFallout(el, slot) {
  const isSlot = slot instanceof HTMLElement;
  const empty = emptyButNotEmpty(slot);
  if (isSlot && empty) {               //hidden
    const q = name === "" ? 'slot:not([name]), slot[name=""]' : 'slot[name="' + name + '"]';
    const slots = el.shadowRoot.querySelectorAll(q);
    for (let slot of slots)
      slot.setAttribute("name", slot.name + suffix);
  } else if (!isSlot && !empty) {
    const slots = el.shadowRoot.querySelectorAll('slot[name="' + slot.name + suffix + '"]');
    for (let node of slots)
      node.setAttribute("name", slot.name);
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
 
