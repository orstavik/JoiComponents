function ImmediateSetupMixin(Base) {
  return class ImmediateSetupMixin extends Base {
    constructor() {
      super();
      setTimeout(() => this.setupCallback(), 0);
    }
  }
}

function FirstConnectedSetupMixin(Base) {
  return class ImmediateSetupMixin extends Base {
    connectedCallback() {
      this.hasBeenConnected || ((this.hasBeenConnected = true) && this.setupCallback());
      if (super.connectedCallback) super.connectedCallback();
    }
  }
}

var que = [];

function addToQue(el) {
  que.push(el);
  if (que.length === 1)
    setTimeout(startQue, 0);
}

function startQue() {
  if (que.length === 0)
    return;
  que.shift().setupCallback();
  setTimeout(startQue, 0);
}

function FirstOpportunityMixinAsync(Base) {
  return class FirstOpportunityMixinAsync extends Base {
    constructor() {
      super();
      addToQue(this);
    }
  }
}