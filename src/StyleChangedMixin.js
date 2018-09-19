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
As element A *precedes* element B, then that is ok.

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

const observedElements = [];
const cachedElementStyles = new Map();

let rafID = 0;
let pause = false;

function poll(el) {
  observedElements.push(el);
  cachedElementStyles.set(el, {});
  if (!rafID && !pause)
    rafID = requestAnimationFrame(checkStylesFast);
}

function stopPoll(el) {
  observedElements.splice(observedElements.indexOf(el), 1);
  cachedElementStyles.delete(el);
}

export function pauseStyleChangeCallbacks() {
  if (pause)
    return;
  pause = true;
  cancelAnimationFrame(rafID);
  rafID = 0;
}

export function restartStyleChangeCallbacks() {
  if (!pause)
    return;
  pause = false;
  rafID = requestAnimationFrame(checkStylesFast);
}

function checkStylesFast() {
  if (observedElements.length === 0) {
    cancelAnimationFrame(rafID);
    rafID = 0;
    return;
  }
  //sort observed elements based on DOM position once at the start of every cycle
  const sortedElements = observedElements.sort((a, b) => (a.compareDocumentPosition(b) & 2));
  for (let el of sortedElements)
    evaluateElement(el);
  rafID = requestAnimationFrame(checkStylesFast);
}

function evaluateElement(el) {
  if (!el || !el.isConnected)
    return false;
  const newStyle = getComputedStyle(el);
  const oldStyle = cachedElementStyles.get(el);

  let changed = false;
  for (let prop of el.constructor.observedStyles) {
    const newValue = newStyle.getPropertyValue(prop).trim();
    const oldValue = oldStyle[prop] || "";
    if (newValue !== oldValue) {
      changed = true;
      oldStyle[prop] = newValue;
      el.styleChangedCallback(prop, newValue, oldValue);
    }
  }
  return changed;
}

export function StyleChangedMixin(Base) {
  return class StyleChangedMixin extends Base {

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      poll(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      stopPoll(this);
    }
  };
}