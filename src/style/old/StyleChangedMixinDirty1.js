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
function sortListDomOrder(toBeProcessed) {
  toBeProcessed.sort((a, b) => (a.compareDocumentPosition(b) & 2));
}

const evaluateStyle = Symbol("evaluateStyle");
const cachedStyles = Symbol("cachedStyles");

const observedElements = [];
let rafID = 0;

/*
Problem: dirty and not dirty styleChanges?

There is a problem that might occur with reactive styleChanges.
Element A is coming after element B in the DOM.
styleChangedCallback in Element A changes styles and/or DOM that affects and will trigger styleChangedCallback in element B.
As element A *precedes* element B, then that is ok. (todo do we really need precedes? or is contains actually better??)

But. There is a bad thing. The styleChangedCallback in element B causes a side effect (via an event for example) that
causes something to change the DOM or the styles so that it in turn should affect element A.
This will create a circular situation where the styleChangedCallback of A and B trigger each other in an infinite loop.

Such changes can be hard to perceive. If the change is only in the computed style, then the whole list would have to be checked
again and again until there are no elements in that list that can be triggered.
I am now doing it only based on the position, and that is actually not enough.
Should we do this recursively until a threshold?
  */
//todo removing a node should have no consequence, that should be fine.
//todo adding a node, that is sorted after the node you are currently processing, that should be fine.
//todo adding a node before the current point of processing, that is dirty.
//todo changing the order of the nodes before the current point of processing, that is dirty.
//todo no, removing a node before the current point of processing, that is a problem. That can remove style operations,
//todo thus requiring elements that have been processed between the current point and the altered point to be different.
//todo a simple way to check this, is to verify that the ordered list of previously processed nodes have not been changed by this.

function poll(el) {
  observedElements.push(el);
  if (observedElements.length === 1)
    rafID = requestAnimationFrame(checkStyles);
}

function stopPoll(el) {
  observedElements.splice(observedElements.indexOf(el), 1);
}

function checkStyles(level) {
  if (level > 1000)
    throw new Error("Circular problem in styleChangedCallback. One of your styleChangedCallback is causing changes of the styles of a parent, and it is causing a loop");
  if (observedElements.length === 0)
    return cancelAnimationFrame(rafID);
  const processed = [];
  // sortListDomOrder(observedElements);                  //[3] sort at the beginning of every run only.
  for (let i = 0; i < observedElements.length; i++) {
    //todo, this could be skipped/replaced with a dirty check if:
    //todo A) observedElements is immutable and elements are added and removed with making new objects.
    //todo b) if also all changes of position in this list is marked. But this point B is not safe to assume, so the list are sorted again and again always.
    //step 1, sort the list of observedElements
    sortListDomOrder(observedElements);                   //[1] sort before every callback

    //step 2, verify that the head of the list has not changed. If it has, its dirty and the whole process must start from the beginning.
    if (i < processed.length) {
      if (observedElements[i] !== processed[i])
        return checkStyles(level? level++ : 1);          //dirty!! start again
      continue;                                          //no dirt, continue
    }
    //step 3, process the next observed element in the que.
    let el = observedElements[i];
    el[evaluateStyle](getComputedStyle(el));
    processed.push(el);
  }
  rafID = requestAnimationFrame(checkStyles);
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

    [evaluateStyle](newStyle) {                                      //todo this could maybe be simplified, by calling it
      for (let prop of this.constructor.observedStyles) {
        const newValue = newStyle.getPropertyValue(prop).trim();
        const oldValue = this[cachedStyles][prop] || "";
        if (newValue !== oldValue) {
          this[cachedStyles][prop] = newValue;
          this.styleChangedCallback(prop, newValue, oldValue);
        }
      }
    }
  };
}