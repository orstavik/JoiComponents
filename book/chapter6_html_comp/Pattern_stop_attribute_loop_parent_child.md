# Pattern: stopping the looping of attributes from parent to child

The `<select>`+`<option>`+`selected`-attribute problem.

1. First of all, the helicopter parent `<select>` needs to be able to set attribute `selected` 
to true (`""`) on a child `<option>`. And remove the `selected` attribute from the previous 
selected child `<option>`. In response to User input.

2. But, this `selected` attribute might also be dynamically altered from JS.
Therefore the child `<option>` needs to add an `attributeChangeListener` to `selected`.
And the child then needs to alert its parent about that.

This means that if the parent changes the child's attribute, 
that can trigger an attributeChangedCallback,
that in turn alerts its parent,
that again starts setting its children attributes.

To fix the issue, you must make receiver methods on both parent and child, 
and ensure that no method "resets" the same attribute value on a child, as that will trigger a 
redundant circular check on the parent. 
Similarly check the state in the parent to verify if what the child alerts the parent of is a state change 
or just a redundant call.

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