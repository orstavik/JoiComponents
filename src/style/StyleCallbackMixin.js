let interval;
let cssomElements = [];
let currentElement = undefined;
const oldStyles = Symbol("oldStyles");

function CyclicalCssomMutationsError(current, currentProperty, altered, alteredProperty) {
  throw new Error("Cyclical styleCallback Sequence Error:" +
    "\n" + current.className + "." + "styleCallback('" + currentProperty + "', oldValue, newValue) " +
    "\nhas triggered a change of an observed style of " + altered.className + ".style." + alteredProperty +
    "\n that could trigger the " +
    altered.className + "." + "styleCallback('" + alteredProperty + "', oldValue, newValue) " +
    "\nto be called again, cyclically within the same frame.");
}

function checkProcessedElementsStyleWasAltered(triggeringProp, processedElements) {
  for (let el of processedElements) {
    const observedStyles = el[oldStyles];
    const currentStyles = getComputedStyle(el);
    for (let name of Object.keys(observedStyles)) {
      let newValue = currentStyles.getPropertyValue(name).trim();
      let oldValue = observedStyles[name];
      if (newValue !== oldValue)
        CyclicalCssomMutationsError(currentElement, triggeringProp, el, name);
    }
  }
}

function checkCurrentElementStyleWasAltered(observedStyles, currentElement, triggeringProp) {
  const currentStyles = getComputedStyle(currentElement);
  for (let name of Object.keys(observedStyles)) {
    let newValue = currentStyles.getPropertyValue(name).trim();
    let oldValue = observedStyles[name];
    if (newValue !== oldValue)
      CyclicalCssomMutationsError(currentElement, triggeringProp, currentElement, name);
  }
}

function addToBatch(el) {
  if (currentElement && !(currentElement.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_CONTAINS))
    CyclicalCssomMutationsError(currentElement, currentProperty, el, "*");
  for (let i = 0; i < cssomElements.length; i++) {
    let inList = cssomElements[i];
    if (el.compareDocumentPosition(inList) & Node.DOCUMENT_POSITION_CONTAINS)
      return cssomElements.splice(i, 0, el);
  }
  cssomElements.push(el);
}

function removeFromBatch(el) {
  if (currentElement && !(currentElement.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_CONTAINS))
    CyclicalCssomMutationsError(currentElement, currentProperty, el, "*");
  cssomElements.splice(cssomElements.indexOf(el), 1);
}

function traverseCssomElements() {
  cssomElements = cssomElements.sort(function (a, b) {
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING
  });
  const processedElements = [];
  for (let i = 0; i < cssomElements.length; i++) {
    currentElement = cssomElements[i];
    const observedStyles = currentElement[oldStyles];
    const currentStyles = getComputedStyle(currentElement);
    for (let name of Object.keys(observedStyles)) {
      let newValue = currentStyles.getPropertyValue(name).trim();
      let oldValue = observedStyles[name];
      if (newValue !== oldValue) {
        observedStyles[name] = newValue;
        currentElement.styleCallback(name, oldValue, newValue);
        checkProcessedElementsStyleWasAltered(name, processedElements);
        checkCurrentElementStyleWasAltered(observedStyles, currentElement, name);
      }
    }
    processedElements.push(currentElement);
  }
  currentElement = undefined;
}

export function startStyleCallback() {
  interval = requestAnimationFrame(function(){
    traverseCssomElements();
    startStyleCallback();
  });
}

export function stopStyleCallback() {
  clearAnimationFrame(interval);
}

startStyleCallback();

export function StyleCallbackMixin(type) {
  return class StyleCallbackMixin extends type {

    constructor() {
      super();
      this[oldStyles] = {};
      for (let style of this.constructor.observedStyles)
        this[oldStyles][style] = "";
    }

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