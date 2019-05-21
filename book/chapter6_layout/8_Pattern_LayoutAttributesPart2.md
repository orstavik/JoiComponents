# Pattern: LayoutAttributes part 2

The LayoutAttributes part 2 pattern extends the LayoutAttributes pattern slightly to allow for
layout attributes that are updated for any change. When a layout property such as `w` or `h`
does not include a `: <steps>` segment, they will be updated for all changes.

## Implementation: LayoutAttributesMixin

```javascript
const batch = [];
let interval;

export function subscribeLayoutAttributes(el) {
  const index = batch.indexOf(el);
  if (index >= 0)
    return;
  batch.push(el);
}

export function unsubscribeLayoutAttributes(el) {
  const index = batch.indexOf(el);
  if (index >= 0)
    batch.splice(index, 1);
}

function findNearestStep(steps, width) {
  for (let i = steps.length - 1; i >= 0; i--) {
    let step = steps[i];
    if (width > step)
      return i + 1;
  }
  return 0;
}

function getSubscriptions(el) {
  let res = {};
  let subs = el.getAttribute("auto-layout").split(";");
  for (let sub of subs) {
    let keyValue = sub.split(":");
    let key = keyValue[0].trim().toLowerCase();
    if (key === "w") key = "width";
    if (key === "h") key = "height";
    if (key === "l") key = "left";
    if (key === "r") key = "right";
    if (key === "t") key = "top";
    if (key === "b") key = "bottom";
    res[key] = keyValue[1] ? keyValue[1].trim().split(" ").map(str => parseInt(str)) : undefined;
  }
  return res;
}

function observeLayout(el) {
  let rect = el.getBoundingClientRect();
  let subs = getSubscriptions(el);
  let res = {};
  for (let sub in subs) {
    res[sub] = {value: rect[sub], steps: subs[sub]};
  }
  return res;
}

//this is a naive iteration of the batch
//because elements can be added to or removed from the batch
//by attributeChangedCallback(...)s that are triggered when _layout-width changes.
function processElements() {
  const activeElements = [];
  const activeElementsData = new WeakMap();
  for (let el of batch) {
    if (el.hasAttribute("auto-layout")) {
      activeElements.push(el);
      activeElementsData.set(el, observeLayout(el));
    }
  }
  for (let el of activeElements) {
    let observations = activeElementsData.get(el);
    for (let prop in observations) {
      const layoutProp = "_layout-" + prop;
      let values = observations[prop];
      let step = values.steps ? findNearestStep(values.steps, values.value) : values.value;
      const value = values.steps ? step + ":" + values.value : step;
      if (!el.hasAttribute(layoutProp) || parseInt(el.getAttribute(layoutProp).split(":")[0]) !== value)
        el.setAttribute(layoutProp, value);
    }
  }
}

export function startBatchCallback() {
  interval = requestAnimationFrame(function () {
    processElements();
    startBatchCallback();
  });
}

export function stopBatchCallback() {
  clearInterval(interval);
}

startBatchCallback();


export function OnceLayoutAttributesMixin(type) {
  return class OnceLayoutAttributesMixin extends type {

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      subscribeLayoutAttributes(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      unsubscribeLayoutAttributes(this);
    }
  };
}
```

## Demo: `<super-belt-notches>` part 2

In this demo we make an element that alters the color of its border and its innerText as it changes size.
The element has the properties of the parent element, and we alter the parent's size and position 
using a series of `+`/`-` buttons. This is not an example of something you might use. It is only a demo.

The `<super-belt-notches>` element has both internal and external CSS selectors attached, and
whenever its size changes, it updates its `.innerText` so that the user gets informed about the change.

```html
<script type="module">
  import {OnceLayoutAttributesMixin} from "../../../src/layout/LayoutAttributesMixin.js";

  class SuperBeltNotches extends OnceLayoutAttributesMixin(HTMLElement){

    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
  div {
    height: 100%;
  }
  :host([_layout-width]) div {
    border-width: 5px;
  }
  :host([_layout-width^="1"]) div {
    border-width: 10px;
  }
  :host([_layout-width^="2"]) div {
    border-width: 15px;
  }

  :host([_layout-height]) div {
    border-style: dotted;
  }
  :host([_layout-height^="1"]) div {
    border-style: solid;
  }
  :host([_layout-height^="2"]) div {
    border-style: double;
  }

  :host([_layout-left]) div {
    border-left-color: red;
  }
  :host([_layout-left^="1"]) div {
    border-left-color: orange;
  }
  :host([_layout-left^="2"]) div {
    border-left-color: yellow;
  }

  :host([_layout-right]) div {
    border-right-color: red;
  }
  :host([_layout-right^="1"]) div {
    border-right-color: orange;
  }
  :host([_layout-right^="2"]) div {
    border-right-color: yellow;
  }

  :host([_layout-top]) div {
    border-top-color: red;
  }
  :host([_layout-top^="1"]) div {
    border-top-color: orange;
  }
  :host([_layout-top^="2"]) div {
    border-top-color: yellow;
  }

  :host([_layout-bottom]) div {
    border-bottom-color: red;
  }
  :host([_layout-bottom^="1"]) div {
    border-bottom-color: orange;
  }
  :host([_layout-bottom^="2"]) div {
    border-bottom-color: yellow;
  }

</style>
<div>nothing yet</div>
    `;
    }

    static get observedAttributes(){
      return ["_layout-width", "_layout-height", "_layout-left", "_layout-right", "_layout-top", "_layout-bottom"];
    }

    attributeChangedCallback(name, oldValue, newValue){
      this.shadowRoot.children[1].innerText = name + ": " + newValue;
    }
  }

  customElements.define("super-belt-notches", SuperBeltNotches);
</script>

<div id="parent" style="position: fixed; left: 5px; top: 105px; width: 110px; height: 110px">
  <super-belt-notches
      auto-layout="w: 100, 200; h: 100, 200; t; b; r; l"
  ></super-belt-notches>
</div>

<button id="left">&#8592;</button>
<button id="right">&#8594;</button>
<button id="top">&#8593;</button>
<button id="bottom">&#8595;</button>
<button id="wider">&#8608;</button>
<button id="thinner">&#8606;</button>
<button id="taller">&#8609;</button>
<button id="shorter">&#8607;</button>

<script >
  window.addEventListener("click", function(e){
    let parent = document.querySelector("#parent");
    if (e.target.id === "left")
      parent.style.left = (parseInt(parent.style.left) - 50) + "px";
    else if (e.target.id === "right")
      parent.style.left = (parseInt(parent.style.left) + 50) + "px";
    else if (e.target.id === "top")
      parent.style.top = (parseInt(parent.style.top) - 50) + "px";
    else if (e.target.id === "bottom")
      parent.style.top = (parseInt(parent.style.top) + 50) + "px";
    else if (e.target.id === "thinner")
      parent.style.width = (parseInt(parent.style.width) - 50) + "px";
    else if (e.target.id === "wider")
      parent.style.width = (parseInt(parent.style.width) + 50) + "px";
    else if (e.target.id === "shorter")
      parent.style.height = (parseInt(parent.style.height) - 50) + "px";
    else if (e.target.id === "taller")
      parent.style.height = (parseInt(parent.style.height) + 50) + "px";
  });
</script>
```

Make another demo where you add the LayoutAttributes on a regular element using 
`subscribeLayoutAttributes(el)`.

## todo

Merge the two LayoutAttributes part 1 and 2 as one. I don't think I need to split them up.
Also, I think we need a layoutCallback in addition to a LayoutAttribute pattern.
The inline-iframe could only require a callback, as the layout changes might confuse more than
help when they are reflected in the lightDOM.

## References

 * 