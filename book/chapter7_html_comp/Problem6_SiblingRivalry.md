# Problem: SiblingRivalry

when making HelicopterParentChild components, a frequently recurring problem is SiblingRivalry
over a single HTML attribute. 

## Example: Select me, select me!

We make a `<select>`+`<option>` HelicopterParentChild pair.
It is required that:
1. only *one* `<option>` child can be `selected` at the same time.
2. When the user activate the `selected` attribute on an `<option>` element, 
   then the `<select>`+`<option>` elements will remove any `selected` attribute 
   from *previously* selected sibling `<option>` elements themselves, automatically.

Furthermore, the `selected` attribute can be set on the `<option>` element from both HTML and JS:
 
1. In HTML, the user of the web components needs to mark an `<option>` as `selected` by default:
```html
<select>
  <option value="one">one</option>
  <option value="two" selected>two</option>
  <option value="three">three</option>
</select> 
```

2. In JS, the developer needs to be able to change the `selected` attribute when the element is
   clicked on by the user. This is done using a `click` event listener on the `<option>` element
   that calls `setAttribute("selected", "")` on the host element.

## Pattern: AddVocallyRemoveSilently

The main task for the developer of the `<select>`+`<option>` HelicopterParentChild pair is to 
remove the `selected` attribute from the previously selected `<option>` child. If the 
HelicopterParentChild pair can do this on their own, then they will automatically maintain the state 
that only one `<option>` child can be selected at the same time.

This is achieved with the following division of labour:

1. The HelicopterChild `<option>` will alert its `<select>` HelicopterParent with an `option-selected`
   event *only* when it becomes `selected`. As the `selected` attribute *can be* set in template,
   the HelicopterChild `<option>` dispatches this event in the lightDOM from an 
   `attributeChangedCallback("selected", ...)` reaction, ie. AddVocally.

2. The HelicopterParent listens for `option-selected` events in the lightDOM. If this event comes from
   one of its own descendants, then it will find all its other `selected` descendants and *remove*
   the `selected` attribute from them.

3. When the `selected` attribute is removed, none of the HelicopterChild `<option>`s alert the 
   HelicopterParent about this change. They *only* alert their HelicopterParent when the `selected`
   attribute is added to the element, neither when its value is changed nor removed, ie.
   RemoveSilently.
   
## Example: `<my-select>`+`<my-option>` with `selected`-attribute

Below is an example of how a HelicopterParentChild pair `<my-select>`+`<my-option>` can be 
implemented to only allow one a single `selected` 

<code-demo src="demo/SelectOption.html"></code-demo>
```html
<script>

  function excludeBranches(nodes, branchPoints) {
    return Array.from(nodes).filter(function (node) {
      for (let i = 0; i < branchPoints.length; i++) {
        if (branchPoints[i].contains(node))
          return false;
      }
      return true;
    });
  }

  class MySelect extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("option-selected", this.optionSelected.bind(this));
    }

    optionSelected(e) {
      e.stopPropagation();
      const options = excludeBranches(this.querySelectorAll("my-option[selected]"), this.querySelectorAll("my-select"));
      for (let i = 0; i < options.length; i++) {
        let option = options[i];
        option !== e.target && option.removeAttribute("selected");
      }
    }
  }

  class MyOption extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("click", this.clickSelect.bind(this));
    }

    static get observedAttributes() {
      return ["selected"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "selected" && newValue !== null && oldValue === null) {
        this.dispatchEvent(new CustomEvent("option-selected", {bubbles: true}));
      }
    }

    clickSelect(e) {
      e.stopPropagation();
      this.hasAttribute("selected") ? this.removeAttribute("selected") : this.setAttribute("selected", "");
    }
  }

  customElements.define("my-select", MySelect);
  customElements.define("my-option", MyOption);
</script>

<style>
  my-select {
    display: block;
    border: 2px solid grey;
    margin-left: 10px;
  }
  my-option {
    display: block;
    margin: 0 10px;
  }
  [selected] {
    border-left: 4px solid red;
  }
  #inner [selected] {
    border-left: 4px solid blue;
  }
</style>
<my-select>
  <my-option>click
    <my-option>to
      <my-option selected>select
        <my-option>between</my-option>
        <my-option>us</my-option>
      </my-option>
    </my-option>
  </my-option>

  <my-option>
    Inner select
    <my-select id="inner">
      <my-option>click</my-option>
      <my-option>to</my-option>
      <my-option selected>select</my-option>
      <my-option>between</my-option>
      <my-option>us</my-option>
    </my-select>
  </my-option>
  <my-option>so</my-option>
  <my-option>many</my-option>
  <my-option>options..</my-option>
</my-select>
```

## Discussion

Sometimes, it can feel as if this mechanism is not enough. You need for example to mark an element
as `opened`, not just the last `selected`. The solution in such scenarios is *not* to try to alter 
the current `selected` attribute to encompass more use-cases, but to add *other*, additional
attributes such as `opened`.

This pattern should *not* be implemented as a mixin because:

1. the pattern spans *two* different element definitions. This would require the creation of *two*
   mixins employed on *two* different web component definitions. This is doable, but the
   complexity of the implied binding between the two such mixins is a huge drawback.

2. the HelicopterChild needs to observe the `selected` attribute. If this functionality was moved
   into a mixin, that would require both the `static get observedAttributes()` and the 
   `attributeChangedCallback(...)` to be overridden in a similar manner as 
   `super.connectedCallback && super.connectedCallback()`. The mixins in this book is isolated to
   only force requirements on the `constructor()`, `connectedCallback()`and `disconnectedCallback()`
   because it considers the requirement of doing similar requirements to `static get observedAttributes()` 
   and `attributeChangedCallback(...)` to add too many bindings and complexity when using the mixins.

## References

 * 
 
## Old drafts

# Pattern: stopping the looping of attributes from parent to child

```javascript
//todo completely untested code, written purely as text..

import {SlotchangeMixin} from "https://cdn.rawgit.com/orstavik/JoiComponents/master/src/SlottableMixin.js";

class SimpleSelect extends SlotchangeMixin(HTMLElement) {
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.selected = undefined;
    this.shadowRoot.innerHTML = `
      <style>
        :slotted(:not(simple-option)) { display: none; }  /* simple-select only shows simple-options */
      </style>
      <slot></slot>
    `;
  }
  
  slotchangedCallback(name, newValue){
    this.options = newValue.filter(n => n instanceof HTMLElement && n.constructor.name === "SimpleOption");
    this.selected = this.options.find(n => n.hasAttribute("selected")) || this.options[0];
    this.updateSelected();
  }
  
  childSelectsItself(child, select){
    if (!this.options)
      return;
    if ((this.selected === child) === select)   //[1] 
      return;                                   //[1]
    this.selected = child;
    this.updateSelected();
  }
  
  updateSelected(){
    for (let option of this.options)
      option.toggleSelected(option === this.selected);
  }
}

class SimpleOption extends HTMLElement {
  
  static get observedAttributes(){
    return ["selected"];
  }
  
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
      <style>
      :host[selected] { background: red; }
      </style>
      <slot></slot>
    `;
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "selected") {
      this.parentNode.childSelectsItself && this.parentNode.childSelectsItself(child, newValue !== null);
    }
  }
  
  toggleSelected(bool) {
    if (this.hasAttribute("selected") === bool)//[2]
      return;                                  //[2] 
    bool ? this.setAttribute("selected", "") : this.removeAttribute("selected"); 
  }
}

customElements.define("simple-select", SimpleSelect);
customElements.define("simple-option", SimpleOption);
```
1. Redundancy check in helicopter-parent.
No change of selected state, no action done.

2. Redundancy check in helicopter-child.
No change of selected state, no action done.

## Reuseable alternatives?

Can we make such attribute updated functions reuseable across different helicopter-parent-child pairs?
No, not really. As attributes are strings, there is likely going to be better to make custom
functions whether or not the attribute values are boolean, numbers, strings or other.
So, make the attributes fit your particular helicopter-parent-child pair.

To see the problem, here is a nearest case implementation on the child side, and 
a set of comments illustrating the general steps on the parent side.
```javascript
//in the child  
  //value false, null and undefined will remove the attribute
  updateAttributeIfNecessary(attName, value){
    if (this.getAttribute(attName) === value)
      return;
    if (value === null ||  value === false ||  value === undefined) 
      this.removeAttribute(attName);
    else                                                 
      this.setAttribute(attName, value);
  }
  
//in the parent
  childAttributeChanged(child, attName, value){
    //check that the parent is ready
    if (!this.options)
      return;
    //check if the child att value in this state preserved in the parent state is the same as what is alerted
    //if it is, then return;
    if ((this.selected === child) === select)   //[1] 
      return;                                   //[1]
    //update the state, and
    this.selected = child;
    
    //update the state of siblings and
    this.updateSelected();
    //re-render if necessary
  }
  
```

## Problem
You need to be able to react to dynamic changes in the attribute of a child, 
and you also need the parent to set it.

For example, the drop down selection.

## Example: TabsTab
```javascript
import {SlotchangeMixin} from "https://cdn.rawgit.com/orstavik/JoiComponents/master/src/SlottableMixin.js";

class TabsTabs extends SlotchangeMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  #top {
    height: 30px;
    background: lightgrey;
  }
  span {
    display: inline-block;
    margin: 3px;
    border: 2px solid white
  }
  span[active] {
    background: white;
  }
  #bottom {
    height: 400px;
    border: 2px  solid lightgrey;
  }
</style>
<div id="top"></div>
<div id="bottom">
  <slot></slot>
</div>`;
    this.$top = this.shadowRoot.children[1];
    this.tabs = undefined;
    this.active = undefined;
  }

  tabTabActive(e) {
    const pathtivpathh[0].hasAttribute("active");
    const wasActive = this.active === e.path[0];
    if (toActivpathActive)   //no change, both was active or both was inactive
      return;
    this.updateActive(toActive ? e.path[0] : undefined);
  pathrenActivated(child, toActive){
    
  }

  onClick(e) {
    if (!(e.path[3] === this) && e.path[0].tagName === "span")
      return;
    e.stopPropagation();
    e.preventDefault();
    let activeNr = Array.from(this.$top.children).findIndex(span => e.path[0] === span);
    this.updateActive(this.tabs[activeNr]);
  }

  slotchangedCallback(name, newValue) {
    this.tabs = newValue.filter(n => n instanceof HTMLElement && n.constructor.name === "TabTab");
    this.active = undefined;
    this.updateActive();
    this.addEventListener("click", (e) => this.onClick(e));
    this.addEventListener("tab-tab-active", (e) => this.tabTabActive(e));
    this.addEventListener("tab-tab-name", (e) => this.updateLabels(e));
  }

  updateActive(newActive) {
    this.active = newActive ?
      newActive :
      this.tabs.find(n => n.hasAttribute("active")) || this.tabs[0];
    for (let tab of this.tabs)
      tab.toggleActive(tab === this.active);
    this.updateLabels();//from change of active only
  }

  updateLabels() {
    let miniMe = "";
    for (let tab of this.tabs)
      miniMe += `<span ${this.active === tab ? "active" : ""}>${tab.getAttribute("name") || undefined}</span>`;
    this.$top.innerHTML = miniMe;

  }
}

class TabTab extends HTMLElement {
  static get observedAttributes() {
    return ["name", "active"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "active")
      this.dispatchEvent(new CustomEvent("tab-tab-active", {bubbles: true}));
    if (name === "name")
      this.dispatchEvent(new CustomEvent("tab-tab-name", {bubbles: true}));
  }

  toggleActive(bool) {
    if (this.hasAttribute("active") === bool)
      return;
    bool ? this.setAttribute("active", "") : this.removeAttribute("active");
  }

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
:host(:not([active])) ::slotted(*){
  visibility: hidden;
}
</style>
<slot></slot>`;
  }
}

customElements.define("tabs-tabs", TabsTabs);
customElements.define("tab-tab", TabTab);

```