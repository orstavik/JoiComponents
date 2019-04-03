# Problem: NoFallbackSlotchange

> todo incorporated the terms flatDOM and flatDOM-childNodes of a <slot>.

The `slotchange` event rests on the following premises:

1. The list of transposed nodes for a `<slot>` element is called `assignedNodes`.
   The initial, default state of `assignedNodes` is an empty list `[]`, not `undefined`.

2. Whenever a node is added, removed from, or change position in `assignedNodes`, 
   a `slotchange` event is dispatched from that `<slot>` element.

This means that the `slotchange` event is triggered when `assignedNodes` *become* empty, 
which in turn means that the `slotchange` event is dispatched when:
 * a `<slot>` element uses its fallback nodes as its flatDOM-childNodes, 
 * *after* having had any `assignedNodes`.

This means that a `slotchange` event will:
1. *ALWAYS* be dispatch when a `<slot>` element's flatDOM-childNodes changes,
2. *EXCEPT* when the `<slot>` element has no flatDOM-childNodes initially,
3. *EXCEPT* when the `<slot>` element uses its fallback nodes initially, and
4. *EXCEPT* when *both* a `<slot>` element *is* currently showing its fallback nodes *and* 
   its `.childNodes` in the non-flattened shadowDOM is altered dynamically via JS.

The conclusion is that the `slotchange` event is an *almost complete proxy* for when
"`<slot>` element's flatDOM-childNodes changes".

## What is the use-case for `slotchange`?

The question facing a developer of a web component is: 
 * do I need to react to `assignedNodes` changes, or 
 * do I need to react to "`<slot>` element's flatDOM-childNodes changes"? 

To answer this question, we must first remember that *reacting* to either `assignedNodes` or 
flatDOM-childNodes changes does not occur in a vacuum.
On the contrary, these reactions usually hinges on some need to process the nodes in question.
These processes are *very rarely context-free*; usually they rely on state data. The question is,
is this state data exclusively connected to the `assignedNodes`?

A naive process that counts the number of `assignedNodes` of a `<slot>` element 
and then print that number in the web components shadowDOM *only* needs the `assignedNodes` context. 
If the same count were to be applied to the web components own fallback nodes, then 
a good argument could be made that this state should not be processed as a `slotchange` reaction,
but rather be fixed in static HTML/CSS template in the shadowDOM (alternatively fixed in the 
`constructor()`). In such a naive use-case, the context would likely be restricted to the 
`assignedNodes`.

But, what if:
1. the processing of `assignedNodes` and flatDOM-childNodes depend on context outside themselves?
2. Is such context-dependent processing of flatDOM-childNodes a relevant use-case? 

Yes, context-dependent processing of `<slot>` element's flatDOM-childNodes is relevant. In fact, most
processing of `assignedNodes` is likely to dependent on context outside the `assignedNodes` themselves.
We can think of this context as *global* and *element specific* input data.
And in such a situation, what is true for `assignedNodes` is true for *all* flatDOM-childNodes. 

And:
1. Can then the output of the fallback nodes be known in advance of element construction? 
2. Can the result from this process be described in HTML/CSS? 

No, if a `<slot>` element's flatDOM-childNodes are processed using context input data, then 
this input data is often inaccessible from HTML/CSS. This means that *all* flatDOM-childNodes are
likely to require a "change-reaction".

Below we illustrate the fact that:
 * reacting to "`<slot>` element's flatDOM-childNodes changes" is a more common use-case than
 * reacting to "`assignedNodes` changes"

because reacting to "`assignedNodes` changes" is likely driven by the need to process context input 
data which apply equally to *all* flatDOM-childNodes.

> The initial state of a `<slot>` element's flatDOM-childNodes is its `.childNodes`, an not `[]`.

## Example: Understanding the `slotchange` use-case

To better understand the `slotchange` use-case, we look at an example below.
This example illustrate:
1. *when* the `slotchange` is insufficient, 
2. what context-dependent input data could be, 
3. which would require a reaction to *all* "`<slot>` element's flatDOM-childNodes changes", and
4. how this reaction is complicated by the behavior of `slotchange` and web component lifecycle
   callbacks.

```html
<script>
  function simplifiedFlatDomChildNodes(slot){
    const flattenedChildNodes = slot.assignedNodes({flatten: true});
    if (flattenedChildNodes.length === 0)
      return slot.childNodes;
    const flatFlat = [];
    for (let node of flattenedChildNodes) {
      if (node.tagName === "SLOT"){
        for (let child of node.childNodes)
          flatFlat.push(child);
      } else {
        flatFlat.push(node);
      }
    }
    return flatFlat;
  }

  class SisyphusList extends HTMLElement {
    constructor() {
      super();
      this.now = new Date();
      this.dayMonth = "day";
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <slot>
          <sisyphus-item id="one">roll stone up the hill</sisyphus-item>
          <sisyphus-item id="two">roll stone up the hill</sisyphus-item>
          <sisyphus-item id="three">roll stone up the hill</sisyphus-item>
        </slot>
      `;
      console.log("constructor() driven processFlatDomChildren: ", this.dayMonth);
      this.processFlatDomChildren(this.shadowRoot.children[0].childNodes);
      this.shadowRoot.addEventListener("slotchange", function(e){
        console.log(this.id);
        debugger;
        console.log("slotchange driven processFlatDomChildren: ", this.dayMonth);
        this.processFlatDomChildren(simplifiedFlatDomChildNodes(this.shadowRoot.children[0]));
      }.bind(this));
    }

    static get observedAttributes(){
      return ["day-month"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "day-month"){
        this.dayMonth = newValue;
        console.log("attribute() driven processFlatDomChildren: ", this.dayMonth);
        this.processFlatDomChildren(simplifiedFlatDomChildNodes(this.shadowRoot.children[0]))
      }
    }

    processFlatDomChildren(childNodes){
      let i = 0;
      for (let child of childNodes) {
        if (child.tagName && child.tagName === "SISYPHUS-ITEM"){
          if (this.dayMonth === "day") {
            let time = new Date(this.now);
            time.setDate(time.getDate()+i++);
            child.updatePlan(time.toLocaleDateString("en-US", {weekday: "short"}));
          }
          else if(this.dayMonth === "month") {
            let time = new Date(this.now);
            time.setMonth(time.getMonth()+i++);
            child.updatePlan(time.toLocaleDateString("en-US", {month: "short"}));
          }
        }
      }
    }
  }

  class SisyphusItem extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host(*){
            display: block;
          }
        </style>
        <span>§*/: </span>
        <slot>How nice, nothing to do!</slot>
      `;
    }
    updatePlan(txt){
      this.shadowRoot.querySelector("span").innerText = txt + ": ";
      const child = simplifiedFlatDomChildNodes(this.shadowRoot.children[2])[0];
    }
  }

  customElements.define("sisyphus-list", SisyphusList);
  customElements.define("sisyphus-item", SisyphusItem);
</script>

<sisyphus-list id="lifeInGeneral"></sisyphus-list>

<sisyphus-list id="lifeAsAWebDeveloper" day-month="month">
  <sisyphus-item id="a">understand the SlotMatroska</sisyphus-item>
  <sisyphus-item id="b">understand the SlotMatroska</sisyphus-item>
  <sisyphus-item id="c">understand the SlotMatroska</sisyphus-item>
</sisyphus-list>


<h3>NoFallbackSlotchange </h3>

This example illustrate the problems of viewing 
a) fallback nodes as the default state of a web component and 
b) _not_ giving a slotchange event when a slot is declared using its fallback nodes.

<ol>
  <li>
    During constructor(): The default state needs to be processed, because the relationship to the 
    nested web component depends on an context dependent state (this.now). Although the relationship
    between sisyphus-list and sisyphus-item is known, this relationship builds on contextual data 
    which is not accessible in HTML nor CSS template.
  </li>
  <li>
    Both the sisyphus-list elements therefore process their initial state. The first list, #lifeInGeneral, 
    needs and will use the result of this process. But as we will see, #lifeAsAWebDeveloper is doing
    redundant work here.
  </li>
  <li>
    During attributeChangedCallback(): The default state needs to be processed again because the 
    nested web components needs to be processed based on element specific state (this.dayMonth).
    If no attribute is set, no attributeChangedCallback() will be triggered. #lifeAsAWebDeveloper 
    therefore re-processes its list of sisyphus-items, making previous processing redundant.
    It would be possible to avoid this task by postponing the initial processing in the constructor,
    but this is far from trivial. We will return to how to do this in later chapters. 
  </li>
  <li>
    During slotchange event listener: The second sisyphus-list, #lifeAsAWebDeveloper, however gets 
    a slotchange event. In fact, it can somewhere between 4, 6 or 7, depending on the browser and 
    your "debugger;" statements. What?! 4, 6 _or_ 7 slotchange events?! Depending on "debugger;"?! 
    Yes... The mayhem that is RedundantSlotchangeCreations is discussed in SlotchangeNipSlip #4.
    Due to having processed the sisyphus-items 2x in the constructor and attributeChangedCallback and
    4-7x by slotchange events, the sisyphus-items have in total been processed at least 6x!
  </li>
  <li>
    If we look past the SlotchangeNipSlip #3 and the redundant slotchange events, the fact that
    `slotchange` does not react to fallback nodes initially, gives us 3x entrypoints for where we
    synchronically must process the sisyphus-items, giving us 2x redundant processes for 
    #lifeAsAWebDeveloper.
  </li>
</ol>
```

The NoFallbackSlotchange problem is that:

1. The `sisyphus-list` must process both the `assignedNodes` and the fallback nodes of its 
   `<slot>` element because it needs to alert them about a context-dependent state.

2. since `sisyphus-list#lifeInGeneral` gets no `slotchange` event nor `attributeChangedCallback(..)`, 
   the `<sisyphus-list>` web component must trigger `processFlatDomChildren(..)` from the 
   `constructor()`.

3. `sisyphus-list#lifeAsAWebDeveloper` is declared with both the `day-month` attribute and 
   a set of transposed nodes. This means that `sisyphus-list#lifeAsAWebDeveloper` 
   will trigger `processFlatDomChildren(..)` from both the `constructort(..)`, 
   `attributeChangedCallback(..)` and at least on `slotchange` event listener.
   `sisyphus-list#lifeAsAWebDeveloper` will call `processFlatDomChildren(..)` 3x, doubly redundant.

As we will see later, the solution to NoFallbackSlotchange is to control the timing of the 
`slotchange` reaction. To solve this particular use-case, the function that reacts to `slotchange` 
is simply triggered *every* time an element that needs it is constructed, regardless of initial state. 

## Example: NoFallbackSlotchange 

This example does not illustrate the use-case behind the NoFallbackSlotchange problem, 
only how the NoFallbackSlotchange problem occur initially, and not later in a `<slot>` element's 
lifecycle.

```html
<script>
  class GreenFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            border: 4px solid green;
          }
        </style>
        <slot>¯\\_(ツ)_/¯</slot>
      `;
      this.shadowRoot.addEventListener("slotchange", function(e){
        console.log(this.id, e.composedPath());
      }.bind(this));
    }
  }

  class DoubleFrame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            border: 4px solid green;
          }
        </style>
        <green-frame id="three">
          <slot>Hello sunshine!</slot>
        </green-frame>
      `;
    }
  }

  customElements.define("green-frame", GreenFrame);
  customElements.define("double-frame", DoubleFrame);
</script>

<green-frame id="one">Hello world!</green-frame>
<green-frame id="two"></green-frame>
<double-frame></double-frame>

<script>
  setTimeout(function(){
    document.querySelector("#one").innerText = "";
  }, 1000);
</script>
<h3>NoFallbackSlotchange</h3>
<ol>
  <li>
    When the elements are created, two slotchange events are dispatched.
    The first slotchange is for green-frame#one. This is triggered by the text node "Hello world!"
    being transposed into the green-frame slot.
    The second slotchange is triggered by the slot node with the fallback text node "Hello sunshine!"
    being transposed into the green-frame#three slot.
    But, if no transposed nodes are passed at startup, and the slot inside green-frame uses its
    "¯\_(ツ)_/¯" fallback text node, then _NO_ slotchange event will trigger.
  </li>
  <li>
    After 1000ms the "Hello world!" text node is removed from green-frame#one.
    This causes the list of transposed nodes to change to empty, and this triggers the third slotchange event.
    This means that slotchange events will be triggered every time a slot falls back to its fallback nodes _after_
    a node has first been transposed into it. The _only_ time a slotchange event does _not_ occur for a change in
    the displayed content of a slot in the flattened DOM is when a slot uses its initial fallback nodes.
  </li>
</ol>
```

## References

 * 
 