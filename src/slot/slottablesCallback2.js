class SlottablesMutation {
  constructor(newChildren, oldChildren) {
    this.newChildren = newChildren;
    this.oldChildren = oldChildren;
    Object.freeze(this);
  }

  get added() {
    return this.newChildren.filter(child => this.oldChildren.indexOf(child) === -1);
  }

  get removed() {
    return this.oldChildren.filter(child => this.newChildren.indexOf(child) === -1);
  }
}

const el_childList = new WeakMap();

function childNodesChanged(el) {
  const oldChildren = el_childList.get(el);
  const newChildren = Array.from(el.children);
  Object.freeze(newChildren);
  el_childList.set(el, newChildren);
  el.slottablesCallback(new SlottablesMutation(newChildren, oldChildren));
}

const childNodesObs = new MutationObserver(function (data) {
  const done = [];
  for (let d of data) {
    const target = d.target;
    if (done.indexOf(target) === -1) {
      done.push(target);
      childNodesChanged(target);
    }
  }
});

function setupNow(el) {
  if (!(el.slottablesCallback instanceof Function))
    throw new SyntaxError("Web components that extends SlottablesMixin must also implement a slottablesCallback({newChildren, oldChildren, added, removed}) method.");
  childNodesObs.observe(el, {childList: true});
  const empty = [];
  Object.freeze(empty)
  el_childList.set(el, empty);
  childNodesChanged(el);
}


function setupActive(el) {
  Promise.resolve().then(function () {
    Promise.resolve().then(function () {
      setupNow(el);
    });
  });
}

let setup = setupActive;
if (document.readyState === "loading") {
  const que = [];
  setup = function (el) {
    que.push(el);
  };
  document.addEventListener("DOMContentLoaded", function () {
    setup = setupActive;
    //todo how do we want to sort the que in tree order? bottom up is best?
    que.sort((a, b) => a.compareDocumentPosition(b) & 2 ? 1 : -1);
    const errors = [];
    for (let el of que) {
      try {
        setupNow(el);
      } catch (error) {
        errors.push(error);
      }
    }
    for (let error of errors) {
      const message = 'Uncaught Error: initial slottablesCallback() break down';
      const uncaught = new ErrorEvent('error', {error, message});
      window.dispatchEvent(uncaught);  //sync
      !uncaught.defaultPrevented && console.error(uncaught);
    }
  });
}

export function SlottablesCallback(base) {
  return class SlottablesCallback extends base {

    constructor() {
      super();
      setup(this);
    }
  }
}