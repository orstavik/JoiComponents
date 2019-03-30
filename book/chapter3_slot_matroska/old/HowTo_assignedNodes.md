#HowTo: `HTMLSlotElement.assignedNodes({flatten: true})`

`<slot>` elements have two methods to discover which nodes are assigned to them:

 * `.assignedNodes({flatten: true})` 
   Returns an array of all the assigned DOM nodes for a slot element, 
   both text and element DOM nodes (cf. `.childNodes`).
 * `.assignedElements({flatten: true})`
   Returns an array of all the assigned html elements, 
   excluding for example text and comment nodes (cf. `.children`).

The methods can be called with or without the setting `{flatten: true}`.
When `{flatten: true}` is set, all chained `<slot>` elements assigned to that `<slot>` will 
be *filled into* their assigned nodes, recursively.

## `.assignedNodes({flatten: true})` vs. `.assignedNodes()`

> Rule of thumb: *always* use `{flatten: true}` unless you 
*explicitly* do not want the flattened chain of slots.

When the `assignedNodes` and `assignedElements` are flattened, 
what you will see is the final content of a `<slot>` element 
as it will be presented in the flattened DOM. 
If you use `.assignedNodes()` and `.assignedElements()` *without* flattening the result,
then when the `<slot>` is chained to another `<slot>` you will *not* get a result that 
reflect the final situation in the flattened DOM.

But, when composing a custom element, you should anticipate that your element could be used 
inside other custom elements and thus have other `<slot>` elements as its children in the lightDOM.
And, in general, the assigned nodes and elements of a `<slot>` should only be accessed from within
the custom element itself, so as to preserve its intended encapsulation.
And thus, you should always set `{flatten: true}` by default for these two methods.

But... there is a problem with this model. It does not work the same way as the flattened DOM.
In the DOM, in order to preserve the styles of the elements, the SLOTs are filled into and wrapping 
each other in reverse document order. With this model, the style works. 
So, in the *real* DOM, SLOTs are not truly flattened, SLOTs are wrapped in reverse order.

.assignedNodes({flatten: true}) partially resolves the SLOT as a variable (the middle layers), and 
partially fills it like a slot (Freakish Slots). It does a little of both. 
And thus it gives a misleading response.

The JS api does not give this result. It flattens the SLOTs. Except, of course, the  
Confused? Good, that means your mind is working like a normal persons;)


## `<slot>` gotya #2: Slot fallback nodes are only shown from the top level?

And. Just one more thing. If you have a `<slot>` element at the top level lightDOM, then
the children of that element *will* be considered `.assignedNodes()`. "What's that?", you might say.
"Are some `<slot>.childNodes` suddenly `.assignedNodes()` after all? And *why* would anybody put a 
`<slot>` element at the top lightDOM anyway?" All highly valid questions. And all too weird to be 
answered here and now. But, as you might stumble upon this later, I will show how this gotya plays out 
in an example.

## Example: Using `.assignedNodes()` 

```html
<script>
  class GreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 10px solid green;
          }
        </style>

        <div>
          <slot>Now you see me.</slot>
        </div>`;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame id="one"></green-frame>
<green-frame id="two">hello world</green-frame>
<green-frame id="three">
  <h1>hello sunshine</h1>
</green-frame>
<green-frame id="four">
</green-frame>
<green-frame id="five">
  <slot>
    <h1>hello again</h1>
  </slot>
</green-frame>
<slot id="six">
  <h1>hello hello</h1>
</slot>

<script >
function flatDomChildNodes(slot){
  let flattenedChildren = slot.assignedNodes();
  if (flattenedChildren.length === 0)
    return slot.childNodes;
  return flattenedChildren;        
}

const one = document.querySelector("#one").shadowRoot.children[1].children[0];
const two = document.querySelector("#two").shadowRoot.children[1].children[0];
const three = document.querySelector("#three").shadowRoot.children[1].children[0];
const four = document.querySelector("#four").shadowRoot.children[1].children[0];
const five = document.querySelector("#five").shadowRoot.children[1].children[0];
const six = document.querySelector("#six");

console.log(one.assignedNodes());
console.log(flatDomChildNodes(one));
console.log(two.assignedNodes());
console.log(three.assignedNodes());
console.log(four.assignedNodes());
console.log(five.assignedNodes());
console.log(six.assignedNodes());
</script>
```


### Chrome bug: Chained-slots-not-always-flattened

In Chrome, there is a bug. If you *erroneously* add `<slot>` elements at the top level, 
whose `getRootNode()` is the main document and would never be assigned to anything, 
they are not removed from the flattened result.

```html
<p>In Chrome: .assignedNodes({flatten: true}) includes erroneous Slot elements from the top document.</p>
<script>
  class GrandFather extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<the-father><slot></slot><slot name='activeName'></slot></the-father>";
    }
  }
  class TheFather extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<the-son><slot></slot><slot name='neverPresent'></slot></the-son>";
    }
  }
  class TheSon extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<b><slot></slot></b>";
    }
  }
  customElements.define("grand-father", GrandFather); 
  customElements.define("the-father", TheFather); 
  customElements.define("the-son", TheSon);
</script>

<grand-father id="normal"></grand-father>

<grand-father id="normal2"><slot slot="slotNameNotInUse"></slot></grand-father>

<grand-father id="normal3">normal<span slot="activeName"></span><slot slot="someRandomNotUsedName"></slot></grand-father>

<grand-father id="bug">bug<slot slot="activeName"></slot><slot></slot></grand-father>


<script>
  function testEmpty(selector){
    const grandFather = document.querySelector(selector);
    const father = grandFather.shadowRoot.children[0];
    const son = father.shadowRoot.children[0];
    const grandFatherSlot = grandFather.shadowRoot.children[0].children[0];
    const grandFatherSlot2 = grandFather.shadowRoot.children[0].children[1];
    const fatherSlot = father.shadowRoot.children[0].children[0];
    const sonSlot = son.shadowRoot.children[0].children[0];
    const shouldBeEmpty1 = grandFatherSlot.assignedNodes({flatten: true});
    const shouldBeEmpty2 = grandFatherSlot2.assignedNodes({flatten: true});
    const shouldBeEmpty3 = fatherSlot.assignedNodes({flatten: true});
    const shouldBeEmpty4 = sonSlot.assignedNodes({flatten: true});
    console.log(selector);
    console.log(shouldBeEmpty1);
    console.log(shouldBeEmpty2);
    console.log(shouldBeEmpty3);
    console.log(shouldBeEmpty4);
  } 
  testEmpty("grand-father#normal");
  testEmpty("grand-father#normal2");
  testEmpty("grand-father#normal3");
  testEmpty("grand-father#bug");
  console.log("test of the top level slots");
  const slots = document.querySelectorAll("slot");
  for (let i = 0; i < slots.length; i++)
    console.log(slots[i].assignedNodes({flatten: true}));
</script> 
```

### Chrome bug solution 

You can:
 * test for the presence of this bug, and then 
 * patch the slot object
 
 ```javascript
const needsChromeFix = function(){
  customElements.define("needs-chrome-fix-bug", HTMLElement);
  const div = document.createElement("needs-chrome-fix-bug");
  const slot = document.createElement("slot");
  const slot2 = document.createElement("slot");
  div.appendChild(slot);
  div.attachShadow({mode: "open"});
  div.shadowRoot.appendChild(slot2);
  return slot2.assignedNodes({flatten: true}).length === 1;
}();
function patchSlot(slot){
  const original = slot.assignedNodes;
  slot.assignedNodes = settings => original.call(slot, settings).filter(n=> n.tagName !== "SLOT");
  return slot;
}
const patchedSlot = needsChromeFix ? patchSlot(slot) : slot;
```