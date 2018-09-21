# Problem: Missing initial slotchange events

## Problem 1: Safari bug
In Safari, there is a bug. The initial `slotchange` event is missing when:
* an element is upgraded or
* the `slotchange` event listener is not added in the `constructor()`. 

## Example: QuietChild
In this example, the quiet child will dispatch 6 `slotchange` events in Chrome, but only 5 in Safari.

```html
<div id="alert" style="border: 5px solid red;">.</div>
<quiet-child>one</quiet-child>
<script>
class QuietChild extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<slot></slot>";
    this.shadowRoot.addEventListener("slotchange", ev =>  document.querySelector("#alert").innerText += this.innerText);
  }
}
customElements.define("quiet-child", QuietChild);
</script>
<quiet-child>two</quiet-child>
<script>
    const child = document.createElement("quiet-child");
    child.innerHTML = "three";
    document.querySelector("body").appendChild(child); //not that it matters
  setTimeout(()=>{
    const quietChildren = document.querySelectorAll("quiet-child");
    for(let i = 0; i< quietChildren.length; i++){
      let c = quietChildren[i];
      c.innerHTML = "<b>I've changed!</b>";
    }
  }, 3000);
</script>

<div id="alert2" style="border: 5px solid blue;">.</div>
<script>
class QuietChild2 extends HTMLElement {
  connectedCallback(){
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<slot></slot>";
    this.shadowRoot.addEventListener("slotchange", ev =>  document.querySelector("#alert2").innerText += this.innerText);
  }
}

setTimeout(()=>{
  customElements.define("quiet-child-2", QuietChild2);
  const c2 = document.createElement("quiet-child-2");
  c2.innerText = "first slot";
  c2.appendChild(document.createElement("div"))
  document.querySelector("body").appendChild(c2);
}, 4000);
setTimeout(()=>{
  const quietChild2 = document.querySelector("quiet-child-2");
    quietChild2.innerHTML = " second slot";
}, 6000);
</script>
```
In Chrome and Firefox, the `<div#alert>` and `<div#alert2>` will at the end contain:
```
.onetwothreeI've changed!I've changed!I've changed!
.first slotsecond slot
```
While in Safari, they will contain:
```
.twothreeI've changed!I've changed!I've changed!
.second slot
```

## Problem 2: No initial `slotchange` for `empty` children

Another problem is that a `<slot>` that is initialized with no assigned nodes will not throw a 
`slotchange` event.
This is by design, but it still causes a problem if you intend to use the slotchange callback 
as part of your initial setup of your element.
And that is very likely if you need to listen for `slotchange` events in the first place.

This problem is not isolated to `slotchange` events only.
The similar problem exist for `attributeChangedCallback()` as they are not triggered 
when no attribute value is set neither.

```html
<script>
class QuietChild extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<slot></slot>";
    this.shadowRoot.addEventListener("slotchange", ev => alert("boo"));
  }
}
customElements.define("quiet-child", QuietChild);
</script>
<quiet-child></quiet-child>
```
The `<quiet-child>` above never says "boo".

## Solution: trigger initial slotchange events

Both the missing initial `slotchange` event caused by the bug in Safari and 
the missing initial `slotchange` event when a slot is instantiated without any assigned nodes,
can be fixed using the same solution:
* trigger the `slotchange` event listener manually when an element is constructed.

This manual `slotchange` you would like to trigger:
1. sometimes in Safari and 
2. always when there initially are no assigned nodes to a slot. 

But, you would like to avoid triggering this manual `slotchange` in all other initial settings.

Thus, the solution becomes to:
1. when the element is created, que a manual trigger for the slot in the `requestAnimationFrame` que, then
2. cache the results from the first slotchange event, and then
3. when the queued trigger runs, check if there has already been invoked a slotchange event, and 
if so skip the manual trigger.

Delaying the trigger until rAF interferes the least with existing events.

> Remember that `slotchange` will be dispatched after `connectedCallback()` when 
an element is constructed directly in the DOM.

### Implementation discussion:
```html
<pre id="msg"></pre>

<my-el id="UPGRADE">.</my-el>

<script>
console.log("________________________________________________");  
class MyEl extends HTMLElement {
  constructor(){
    super(); 
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML="<slot></slot>";
    this.shadowRoot.addEventListener("slotchange", e => this.slotchanged("builtin"));
    this.hasSlotted = false;
  }
  connectedCallback(){
    console.log("1  connectedCallback " + this.id) 
    Promise.resolve().then(()=> console.log("2  microtask que with connectedCallback ends " + this.id)); 
    requestAnimationFrame(()=> this.triggerSlotchange());
  }
  slotchanged(type){
    console.log("3  slotchange " + this.id)
    document.querySelector("#msg").innerText += (type + " slotchange " + this.id + "\n");
    this.hasSlotted = true;
  }
  triggerSlotchange(){
    if (this.hasSlotted)
      return;
    this.slotchanged("manual");
  }
}
customElements.define("my-el", MyEl);
console.log("x  task in microtask que when upgrade was triggered");
</script>              
 
<my-el id="NORMAL">.</my-el>   
```
This test will log:
```
________________________________________________
1  connectedCallback UPGRADE
x  task in microtask que when upgrade was triggered
3  slotchange UPGRADE
2  microtask que with connectedCallback ends UPGRADE
1  connectedCallback NORMAL
2  microtask que with connectedCallback ends NORMAL
3  slotchange NORMAL
```
As the NORMAL "microtask que with connectedCallback ends" before the NORMAL "slotchange" is called,
the microtask que cannot be used for this purpose, and the fastest que for our purposes would be
`requestAnimationFrame`.

## References
* [bugs.webkit.org: 188752](https://bugs.webkit.org/show_bug.cgi?id=188752)