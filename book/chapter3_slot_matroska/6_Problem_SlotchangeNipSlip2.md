# SlotchangeNipSlip #2: MissingInitialFallbackNodeSlotchange

> todo incorporated the terms flatDOM and flatDOM-childNodes of a <slot>.
> todo rename to InitialFallback?

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
1. *ALWAYS* be dispatch when a `<slot>` element's flatDOM-childNodes,
2. *EXCEPT* when the `<slot>` element has no flatDOM-childNodes initially,
2. *EXCEPT* when the `<slot>` element uses its fallback nodes initially, and
3. *EXCEPT* when *both* a `<slot>` element *is* currently showing its fallback nodes *and* 
   its `.childNodes` in the non-flattened shadowDOM is altered dynamically via JS.

The conclusion is that the `slotchange` event is an *almost complete proxy* for
"`<slot>` element's flatDOM-childNodes changes".

## What is the use-case for `slotchange`?

The question facing a developer of a web component is: 
 * do I need to react to `assignedNodes` changes, or 
 * do I need to react to "`<slot>` element's flatDOM-childNodes changes"? 

The problem facing developers is that
*reacting* to `assignedNodes` or flatDOM-childNodes changes does not occur in a vacuum.

Reacting to changes in `assignedNodes` and/or *all* flatDOM-childNodes hinge on some kind of 
processing of the nodes in question being performed. These processes *can* be context-free. 
An example of a context-free process is an web component with a `<slot>` element that only reads
how many `assignedNodes` the `<slot>` element has, and then show that number top-right inside itself. 
In such context-free processes, a good argument can be made that a `<slot>` element's 
fallback nodes should *never* be processed via a JS reaction, but that the state for the fallback
nodes should be managed in static HTML/CSS template in the shadowDOM (or alternatively via JS 
in the `constructor()` if a pure HTML/CSS solution is unavailable).

But, what if:
1. the processing of `assignedNodes` and/or *all* flatDOM-childNodes is context-dependent?
2. And is such context-dependent processing of flatDOM-childNodes a relevant use-case? 
3. Can then the output of the fallback nodes be known in advance of element construction? 
4. Can the result from this process be described in HTML/CSS? 

Yes, context-dependent processing of `<slot>` element's flatDOM-childNodes is relevant. In fact, most
processing of `assignedNodes` is likely to be context-dependent: the flatDOM-childNodes might need
to be processed using *global* and/or *element specific* input data.

No, if a `<slot>` element's flatDOM-childNodes are processed using context input data, then 
this input data is often inaccessible from HTML/CSS. This means that *all* flatDOM-childNodes are
likely to require a "change-reaction".

In sum, this means that reacting to "`<slot>` element's flatDOM-childNodes changes" is likely the more
common use-case in that when reacting to "`assignedNodes` changes", this reaction likely require
context input data which in turn would require the same processing of the fallback childNodes.

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


<h3>SlotchangeNipSlip #2</h3>

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

The SlotchangeNipSlip #3 problem is that:

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

As we will see later, the solution to SlotchangeNipSlip #3 is to control the timing of the 
`slotchange` reaction. To solve this particular use-case, the function that reacts to `slotchange` is
simply triggered *every* time an element that needs it is constructed, regardless of initial state. 

## Example: SlotchangeNipSlip #2

The next example also illustrate the MissingInitialFallbackNodeSlotchange problem. 
This example does not illustrate the use-case behind this problem, only how the problem occur
initially, and not later in a `<slot>` element's lifecycle.

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
<h3>SlotchangeNipSlip #2</h3>
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
 

 ## Old drafts
 The argument for triggering `slotchange` only for transposed nodes is that it would avoid calling 
 unnecessary `slotchange` reactions for a known state. The problem with this argument is that it
 does not take into account that other unknown contextual factors can drive and trigger the need
 to process the fallback nodes in ways that cannot be described statically in HTML and CSS.
 
 This means that quite frequently, `<slot>` fallback nodes needs to be processed in the constructor,
 thus causing the redundancy problem to be shifted to the listener of slotchange callbacks.
 
 Even at creation time, the
 context of the web component is not known. It might be filled with transposed nodes to begin with,
 it might not. If processing the childNodes and transposed nodes is heavy, it would be better to 
 
 
 
 , and thus does not need to be processed (which is not correct 
 in that the context of the web component is not known, and this also factors into the creation processing)
 and b) that the initial state of the web component is its fallback nodes, and not empty (which is
 not helpful in real life web components).
 
 But this argument and the current premises are not well suited for web component reaction.
  
 1. Web components need to react to changes in the list of displayed content of a `<slot>` element 
 in the flattened DOM. This use case is *more frequent* than reacting to changes in the list of 
 transposed nodes *only*. The reason for this is that *if* a web component needs to do an operation
 based on the state of transposed nodes, these operations might also do some work *on* the transposed
 nodes. Imagine for example an attribute value on the host element, such as a symbol type on a list, 
 that needs to be applied and communicated to the childnodes in view. Such transference of parent 
 state to its flattened DOM children can be triggered by `attributeChangedCallback(..)`. But, what if
 the state of the parent web component list was not established by an attribute with its own callback?
 In such cases you would like to perform the operation of updating the list symbol of the child 
 elements, whether they are transposed or fallback nodes. 
 
 2. To *opt out of and abort* a `slotchange` reaction that include fallback nodes is simpler than 
 it is to *add* a trigger to the initial state based on fallback nodes, without doing redundant work. 
 Put simply:
  
  * if the fallback nodes is the default, initial state of the web component, then the developer should
    process this state in the constructor. This might be a little work.
  
  * Then if the web component is created directly with transposed nodes, then it is likely that this 
    initial setup against fallback nodes was a complete waste. 
  
  * This leads the developer to try to delay the initial setup against fallback nodes until it
    has been verified that no transposed nodes are added during creation. As we will describe later, 
    this is doable, but not trivial.
 
 Conclusion: The slotchange event is most relevant when it signals: "a change in
 the list of child nodes in the flattened DOM" and when the default state of this list is empty, and not the fallback
 nodes. This only requires triggering slotchange reactions when a slot uses its list of fallback nodes as its initial
 result, and this makes it far simpler for the developer of a web component to write ordered reactions based on the
 current state of a slot.
 
 Therefore, best practice is therefore to react to both fallback nodes and transposed nodes alike.
 SlotchangeNipSlip #2 is the fact that no `slotchange` event is dispatched when a `<slot>` element
 uses fallback nodes as its *initial* list of child nodes in the flattened DOM.