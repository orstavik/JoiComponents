/*
Pattern: set an internal style to react to an HTML attribute.

Simple, fast, but it is moving CSS in the lightDOM into the HTML domain, as it is not possible to set HTML attributes *from* CSS.

make the
:host([--custom-attr="a"]){
  --inner-prop-a: 10px;
  --inner-prop-b: 20px;
}

#inner-el-a {
  font-size: var(--inner-prop-a);
}

#inner-el-b {
  font-size: var(--inner-prop-b);
}

*/


/*
## Why use styles for custom properties instead of HTML attributes?

One important motivation behind CSS in the first place was to enable the developers to separate form (CSS) from content (HTML).
By using CSS developers could group together the style descriptions for their applications, and
then in theory develop the style and content independently of each other.
It very, very rarely works this way in practice, as we all know, but still,
the ability to separate layout and style in CSS from content and data model structure in HTML is still very useful and beneficial.
It gives better overview, and lets the developers more easily "switch between cognitive contexts" when
they develop in CSS and HTML respectively.

CSS also gives you the ability to control styles and layout using declarative CSS rules.
Cascading rules.
This also simplifies changing between different styles depending on css classes and position of the elements in the DOM.
A.o.

If you use HTML attributes as custom CSS properties, you do not get any such separation.
Even though you can Query based on a css property, you cannot

You are in essence moving style settings from CSS and back into HTML.
We don't want that. That
*/
/*
Problem: dirty and not dirty styleChanges?

There is a problem that might occur with reactive styleChanges.
Element A is coming after element B in the DOM.
styleChangedCallback in Element A changes styles and/or DOM that affects and will trigger styleChangedCallback in element B.
As element A *precedes* element B, then that is ok. (todo do we really need precedes? or is contains actually better??)

But. There is a bad thing. The styleChangedCallback in element B causes a side effect (via an event for example) that
causes something to change the DOM or the styles so that it in turn should affect element A.
This will create a circular situation where the styleChangedCallback of A and B trigger each other in an infinite loop.

There are two modes:
safe-but-slow)
To verify that there has been no side-effects from element B to element A,
the process of running styleChangedCallback's are run again and again upto 100 times until no observedStyles have changed.

fast-but-can-loop-over-several-raf)
The process is only run once, and it is assumed that no styleChangedCallback will affect the style of a preceding
element (with a styleChangedCallback).
*/

//todo removing a node should have no consequence, that should be fine.
//todo adding a node, that is sorted after the node you are currently processing, that should be fine.
//todo adding a node before the current point of processing, that is dirty.
//todo changing the order of the nodes before the current point of processing, that is dirty.
//todo no, removing a node before the current point of processing, that is a problem. That can remove style operations,
//todo thus requiring elements that have been processed between the current point and the altered point to be different.
//todo a simple way to check this, is to verify that the ordered list of previously processed nodes have not been changed by this.

function sortListDomOrder(toBeProcessed) {
  toBeProcessed.sort((a, b) => (a.compareDocumentPosition(b) & 2));
  return toBeProcessed;
}

const evaluateStyle = Symbol("evaluateStyle");
const cachedStyles = Symbol("cachedStyles");

const observedElements = [];
let rafID = 0;

function poll(el) {
  observedElements.push(el);
  if (observedElements.length === 1)
    rafID = requestAnimationFrame(checkStylesSafe);
}

function stopPoll(el) {
  observedElements.splice(observedElements.indexOf(el), 1);
}

function checkStylesSafe(timestamp, level) {
  if (level > 100)
    throw new Error("Circular problem in styleChangedCallback. One of your styleChangedCallback is causing changes of the styles in the lightDOM or above, and it is causing a loop.");
  if (observedElements.length === 0)
    return cancelAnimationFrame(rafID);
  let changed = false;
  for (let el of sortListDomOrder(observedElements)) {                                            //[3] sort at the beginning of every run only.
    if (el && el.isConnected && el[evaluateStyle](getComputedStyle(el)))
      changed = true;
  }
  if (changed)
    checkStylesSafe(timestamp, (level || 0) + 1);
  rafID = requestAnimationFrame(checkStylesSafe);
}

export function StyleChangedMixin(Base) {
  return class StyleChangedMixin extends Base {

    constructor() {
      super();
      this[cachedStyles] = {};
    }

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      poll(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      stopPoll(this);
    }

    stopStyleCheck() {
      stopPoll(this);
    }

    startStyleCheck() {
      poll(this);
    }

    [evaluateStyle](newStyle) {
      let changed = false;
      for (let prop of this.constructor.observedStyles) {
        const newValue = newStyle.getPropertyValue(prop).trim();
        const oldValue = this[cachedStyles][prop] || "";
        if (newValue !== oldValue) {
          changed = true;
          this[cachedStyles][prop] = newValue;
          this.styleChangedCallback(prop, newValue, oldValue);
        }
      }
      return changed;
    }
  };
}