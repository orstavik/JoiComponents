const batch = [];

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

function runBatchProcess() {
  for (let el of batch)
    el.updateAutoOnline();
}

let onlineState;

function connecting() {
  onlineState = 1;
  runBatchProcess();
  setTimeout(function () {
    onlineState = 1000;
    runBatchProcess();
  }, 1000);
}

function disConnecting() {
  onlineState = 0;
  runBatchProcess();
}

navigator.onLine ? connecting() : disConnecting();
window.addEventListener("online", connecting);
window.addEventListener("offline", disConnecting);

export function NaiveOnlineAutoAttributeMixin(type) {
  return class NaiveOnlineAutoAttributeMixin extends type {

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
      requestAnimationFrame(this.updateAutoOnline.bind(this));
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }

    updateAutoOnline() {
      this.hasAttribute("auto-online-active") && this.setAttribute("auto-online", onlineState);
    }
  };
}