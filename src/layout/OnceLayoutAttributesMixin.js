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
    let steps = keyValue[1].trim().split(" ").map(str => parseInt(str));
    res[key] = steps;
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
      let values = observations[prop];
      let step = findNearestStep(values.steps, values.value);
      if (!el.hasAttribute("_layout-" + prop)) {
        el.setAttribute("_layout-" + prop, step + ":" + values.value);
      } else {
        let oldValue = el.getAttribute("_layout-" + prop);
        if (!oldValue.startsWith(step + ":"))
          el.setAttribute("_layout-" + prop, step + ":" + values.value);
      }
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