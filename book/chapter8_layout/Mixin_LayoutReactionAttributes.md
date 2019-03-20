# Pattern: NaiveLayoutAttributes

The LayoutAttributes pattern uses the SteppedAutoAttribute pattern to *automatically* update 
and add several layout attributes that reflect the current state of an element's layout on the host 
element. 

The purpose of the LayoutAttributes is to automatically trigger:
1. CSS selectors both inside and outside of an element based on the elements layout and
2. `attributeChangedCallback(...)` method inside the web component, if needed.

This sounds great! And a bit naive.. Will this not cause massive layout-thrashing?
Will this not easily cause loops where an elements layout changes an elements style which in turn
changes the elements layout again, infinitely? Or in best case scenario cause the element to flicker?
How can we base either style and js callbacks (which we can assume would primarily alter the shadowDOM)
on layout changes without shooting ourselves in one foot with a performance-killer-canon and in the
other foot with a layout-to-css-to-js-complexity-bazooka?

These questions all deserve a good answer. But first, we need to see what automatic LayoutAttributes 
might look like in order to better understand how we later might manage them successfully.

## LayoutWidthAttributeMixin: a naive `_layout-width` implementation

The LayoutWidthAttributeMixin adds a `_layout-width` that will automatically be updated according to the
numerical steps defined in `auto-layout-width`.
The mixin will process all subscribing elements *once* per `requestAnimationFrame(...)`.
It then:

1. reads the `auto-layout-width` for all subscribing elements, 
   and caches this value plus the `.offsetWidth` value for these 
   elements into a map of `activeElements`, and

2. uses the step information from `activeElements` to find out which 
   step is currently activated per `activeElement`, and
   update the `_layout-width` attribute for all elements whose step has changed.

```javascript
const batch = [];
let interval;

function addToBatch(el) {
  const index = batch.indexOf(el);
  if (index >= 0)
    return;
  batch.push(el);
}

function removeFromBatch(el) {
  const index = batch.indexOf(el);
  if (index >= 0)
    batch.splice(index, 1);
}

function findNearestStep(stepsTxt, width){
  let steps = stepsTxt.split(",");
  for (let i = steps.length -1; i >= 0; i--){
    let step = parseInt(steps[i]);
    if (width > step)
      return i+1;
  }
  return 0;
}

//this is a naive iteration of the batch
//because elements can be added to or removed from the batch
//by attributeChangedCallback(...)s that are triggered when _layout-width changes.
function processElements(){
  const activeElements = [];
  const activeElementsData = new WeakMap();
  for (let el of batch) {
    if (el.hasAttribute("auto-layout-width")){
      activeElements.push(el);
      activeElementsData.set(el, {
        steps: el.getAttribute("auto-layout-width"),
        width: el.getBoundingClientRect().width
      });
    }
  }
  for (let el of activeElements) {
    let values = activeElementsData.get(el);
    let step = findNearestStep(values.steps, values.width);
    if (!el.hasAttribute("_layout-width"))
      el.setAttribute("_layout-width", step + ":" + values.width);
    let oldValue = el.getAttribute("_layout-width");
    if (!oldValue.startsWith(step + ":"))
      el.setAttribute("_layout-width", step + ":" + values.width);
  }
}

export function startBatchCallback(){
  interval = requestAnimationFrame(function(){
    processElements();
    startBatchCallback();
  });
}

export function stopBatchCallback(){
  clearInterval(interval);
}

startBatchCallback();


export function NaiveLayoutWidthAttributeMixin(type) {
  return class NaiveLayoutWidthAttributeMixin extends type {

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }
  };
}
```

## Demo: `<belt-notches>`

In this demo we make an element that alters the color of its border and its innerText as it changes size.
The element has the width of the parent element, and we alter the parent's width using `+`/`-` buttons.
This is not an example of something you might use. It is only a demo.

The `<belt-notches>` element has both internal and external CSS selectors attached, and
whenever its size changes, it updates its `.innerText` so that the user gets informed about the change.

```html
<script type="module">
  import {NaiveLayoutWidthAttributeMixin} from "../../src/layout/NaiveLayoutWidthAttributeMixin.js";

  class BeltNotches extends NaiveLayoutWidthAttributeMixin(HTMLElement){

    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
  div {
    border: 5px solid black;
  }
  :host([_layout-width]) div {
    border-color: grey;
  }
  :host([_layout-width=""]) div {
    border-color: red;
  }
  :host([_layout-width^="1:"]) div {
    border-color: orange;
  }
  :host([_layout-width^="2:"]) div {
    border-color: yellow;
  }
  :host([_layout-width^="3:"]) div {
    border-color: green;
  }
  :host([_layout-width^="4:"]) div {
    border-color: blue;
  }
  :host([_layout-width^="5:"]) div {
    border-color: indigo;
  }
  :host([_layout-width^="6:"]) div {
    border-color: violet;
  }
</style>
<div>nothing yet</div>
    `;
    }

    static get observedAttributes(){
      return ["_layout-width"];
    }

    attributeChangedCallback(name, oldValue, newValue){
      if (name === "_layout-width"){
        this.shadowRoot.children[1].innerText = "_layout-width: " + newValue;
      }
    }
  }

  customElements.define("belt-notches", BeltNotches);
</script>

<div id="parent" style="width: 110px">
  <belt-notches auto-layout-width="50, 150, 250, 350, 450, 550"></belt-notches>
</div>

<button id="plus">+50</button>
<button id="minus">-50</button>
<script >
  var parent = document.querySelector("#parent");

  window.addEventListener("click", function(e){
    if (e.target.id === "plus")
      parent.style.width = (parseInt(parent.style.width) + 50) + "px";
    else if (e.target.id === "minus")
      parent.style.width = (parseInt(parent.style.width) - 50) + "px";
  });
</script>
```


## Why LayoutWidthAttributeMixin is naive

1. By batching the reading of the `.offsetWidth` properties forall elements, the browser is only 
forced to calculate layout once per `requestAnimationFrame` cycle. This reduces the cost of the
operation.

2. However, if CSS rules and/or JS functions mutating the shadowDOM of an element causes the 
`.offsetWidth` of another element to change, then this information will not be available until the 
next animation frame. Because all the `.offsetWidth` values was read together *earlier*, to reduce 
the cost of layout calculations. Thus, the CSS or JS reactions that changes `_layout-width` properties 
of contained elements will not be processed in the same frame, but cascade down the DOM one step per
animation frame cycle. 
   
3. Thus, there is an inherent conflict between:
   1. reading the layout property *efficiently* and
   2. reading the layout property (`.offsetWidth`) *accurately*.
   
   We will return to this conflict later.

4. The batch processing of the `_layout-width` is simply queued in a `requestAnimationFrame(...)` with
   no regard to other global processing functions such as `styleCallback(...)`. 
   The app performance would likely benefit from processing style first, 
   before calculating layout.

## References

 * 
 
 
## old drafts


Layout costs! The browser does not want to run layout more than once per frame. We do not
want to run layout more than once. If we do layout reactions for more than one element, we 
therefore want to batch such calls and reuse as much of it as we can.

To batch layout reactions we therefore split the calculations of the layout *from* the mutation of 
the layout attributes. This is a practice that can be problematic as layout reactions causes style 
and changes 
