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

let onlineState = navigator.onLine ? 1 : 0;
window.addEventListener("online", function connecting() {
  onlineState = 1;
  runBatchProcess();
});
window.addEventListener("offline", function disConnecting() {
  onlineState = 0;
  runBatchProcess();
});

export function OnlineAutoAttributeMixin(type) {
  return class OnlineAutoAttributeMixin extends type {

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }

    updateAutoOnline() {
      this.hasAttribute("auto-online") && this.setAttribute("_online", onlineState);
    }
  };
}