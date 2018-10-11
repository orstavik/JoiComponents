const enterView = Symbol("hasEntered");

const enterViewObserver = new IntersectionObserver(entries => {
  for (let entry of entries) {
    if (entry.isIntersecting)
      entry.target.enterViewCallback();
  }
});

export const EnterViewMixin = (Base) => {
  return class extends Base {

    constructor() {
      super();
      this[enterView] = true;
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      if (this[enterView]) enterViewObserver.observe(this);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      if (this[enterView]) enterViewObserver.unobserve(this);
    }

    enterViewCallback() {
      if (super.enterViewCallback) super.enterViewCallback();
      this[enterView] = false;
      enterViewObserver.unobserve(this);
    }
  }
};