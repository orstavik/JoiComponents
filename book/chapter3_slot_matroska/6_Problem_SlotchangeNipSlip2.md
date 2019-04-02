# SlotchangeNipSlip #2: MissingInitialFallbackNodeSlotchange

The `slotchange` event rests on the following premises:

1. the initial, default state of the list of transposed nodes is an empty list (`[]`, not `undefined`).

2. Whenever the content or sequence of this list changes, a `slotchange` event is dispatched.

This means that the `slotchange` event is triggered when list of transposed nodes become empty.
This in turn means that the `slotchange` event is triggered:
 * when a `<slot>` element uses its fallback nodes as its flattened DOM content, 
 * *after* its content has previously been filled with transposed nodes.

This means that a `slotchange` event will:
1. *ALWAYS* be dispatch when a `<slot>` element's child nodes in the flattened DOM changes,
2. *EXCEPT* when the `<slot>` element uses its fallback nodes initially.

 * There is another edge-case. If a web component is showing the fallback nodes as the content of a 
   `<slot>` element and then this list of nodes is dynamically altered via JS, then this
   too will alter the flattened DOM content of a `<slot>` element without triggering a `slotchange`
   event.

Ie. the `slotchange` event is an *almost complete* proxy for the event "changes of a `<slot>` 
element's child nodes in the flattened DOM".

## React to transposed nodes of flattened-DOM-childNodes?

The question facing a developer of a web component is: 
 * when do I need to react to changes in the list of transposed nodes? 
 * when do I need to react to changes in the list of a `<slot>`'s flattened DOM child nodes? 

To better understand this question, we look at an example:

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


<h3>SlotchangeNipSlip #3</h3>

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
    Both the sisyphus-list elements process this initial state. The first list, #lifeInGeneral, 
    needs and will use the result of this process. But as we will see, #lifeAsAWebDeveloper does here
    do redundant work.
  </li>
  <li>
    During attributeChangedCallback(): The default state needs to be processed again because the 
    nested web components needs to be processed based on a per element specific state (this.dayMonth).
    If no attribute is set, no attributeChangedCallback() will be triggered. Without manually 
    postponing the processing task, which is far from trivial, #lifeAsAWebDeveloper will here perform
    first re-processing of the sisyphus-items, making previous processing redundant.
  </li>
  <li>
    During slotchange event listener: The second sisyphus-list, #lifeAsAWebDeveloper, however gets 
    a slotchange event. In fact, it can somewhere between 4, 6 or 7, depending on the browser and 
    your "debugger;" statements. What?! 4, 6 _or_ 7 slotchange events?! Depending on "debugger;"?! 
    Yes... The mayhem that is RedundantSlotchangeCreations is discussed in SlotchangeNipSlip #4.
    For now, we simply say that at least one slotchange event was triggered.
  </li>
  <li>
    The slotchange event listener will again need to reprocess the sisyphus-items, making the two
    previous processes of sisyphus-items redundant.
  </li>
  <li>
    The SlotchangeNipSlip #3 problem is that:
    a) since sisyphus-list#lifeInGeneral gets no slotchange event nor attributeChangedCallback(), 
    the sisyphus-list web component needs to process its flattened DOM children from the constructor().
    b) sisyphus-list#lifeAsAWebDeveloper is instantiated with both an attribute and transposed nodes. 
    This means that the sisyphus-list#lifeAsAWebDeveloper gets an additional attributeChangedCallback and at least
    on slotchange callback. sisyphus-list#lifeAsAWebDeveloper only needs process the last of these 
    triggers.
  </li>
  <li>
    As we will see later, the solution to SlotchangeNipSlip #3 is to control the timing of the 
    slotchange reaction better, and to trigger the same reaction whenever a slot element instantiates
    itself (regardless of initial state). This will patch the problem of 
    MissingInitialFallbackNodeSlotchange, along with the other SlotchangeNipSlip problems.
  </li>
</ol>
```

The example above illustrate both that the *context* in which a web component is constructed 
can make it necessary for the web component to process its slot fallback nodes and transposed nodes
alike during creation. Both global state and element specific state can be the driver of this
requirement.

When the custom element processes a `<slot>` element's flattened DOM child nodes (content), then
because of SlotchangeNipSlip #2: MissingInitialFallbackNodeSlotchange, there will be a need to
try to avoid redundant processing of child nodes. How best to do this, will be described in
later chapters.

## Example: SlotchangeNipSlip #2

The next example illustrate in more isolation the SlotchangeNipSlip #2: 
MissingInitialFallbackNodeSlotchange. This example does not illustrate when processing
transposed and fallback nodes for a `<slot>` element is useful, only when 
a) MissingInitialFallbackNodeSlotchange occur and b) when FallbackNodes being displayed 
do trigger a slotchange event.

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
 
 1. the initial state of a slot element's list of child nodes in the flattened DOM 
    is its fallback nodes, not an empty list.
 
 
 
 
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
