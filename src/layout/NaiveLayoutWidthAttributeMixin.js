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