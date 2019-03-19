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

window.addEventListener("online", function connecting() {
  for (let el of batch)
    el.onlineConnecting();
});
window.addEventListener("offline", function disConnecting() {
  for (let el of batch)
    el.onlineDisconnecting();
});

export function SteppedOnlineAutoAttributeMixin(type) {
  return class SteppedOnlineAutoAttributeMixin extends type {

    constructor(){
      super();
      this._timers = {};
      this._steps = [];
      requestAnimationFrame(this.onlineConnecting.bind(this));
    }

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }

    setSteps(txt){
      this._steps = txt.split(",").map(num => parseInt(num));
    }

    onlineConnecting(){
      if (!this.hasAttribute("auto-online"))
        return;
      this.setAttribute("_online", "");         //set step 0

      let self = this;
      for(let i = 0; i < this._steps.length; i++){
        let step = parseInt(this._steps[i]);
        this._timers[i] = setTimeout(function(){
          self.setAttribute("_online", (i+1) + ":" + step);
        }, step);
      }
    }

    onlineDisconnecting(){
      if (!this.hasAttribute("auto-online"))
        return;
      for (let timerNr in this._timers)
        clearTimeout(this._timers[timerNr]);
      this._timers = {};
    }
  };
}