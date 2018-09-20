# Problem: Missing initial slotchange events

In Safari, there is a bug. When an element is upgraded, the initial `slotchange` event is missing. 

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
  setTimeout(()=>{
    const child = document.createElement("quiet-child");
    child.innerHTML = "three";
    document.querySelector("body").appendChild(child); //not that it matters
  }, 1000);
  setTimeout(()=>{
    const quietChildren = document.querySelectorAll("quiet-child");
    for(let i = 0; i< quietChildren.length; i++){
      let c = quietChildren[i];
      c.innerHTML = "<b>I've changed!</b>";
    }
  }, 3000);
</script>
```
In Chrome, the `<div#alert>` will at the end contain:
```
.onetwothreeI've changed!I've changed!I've changed!
```
While in Safari, it will contain:
```
.twothreeI've changed!I've changed!I've changed!
```

## Solution: trigger initial slotchange events

1. You need to manually trigger an initial `slotchange` event in order to ensure that it is always triggered.
2. You need to avoid processing the same `slotchange` event twice if it has already been triggered.
3. You therefore need to cache the `slotchange` event data so that you can filter out changes that does not cause a change.

* there is a possibility to avoid this, by just checking if 
   1. there 1 is a slot active at the first connectedCallback, and 
   2. if the slotchange processing has already been performed.
   
This is lighter, it will require less processing of the events. 
If so, then the it is only at the upgrade process that we need to check this.
So, if the constructor is run, and the element is connected, it is an upgrade?
If it is an upgrade, then we need to add a rAF trigger for slotchange.
and in this trigger we need to see if there is a slot in the shadowRoot, 
and  if the slotchange has already been called. And if both of this is true, 
then we will trigger slotchange manually.

Thus, in the constructor we need to detect if it is an upgrade or an empty call.
This is done by checking .isConnected? We need a pattern to find out if a constructor call 
is an upgrade or a normal constructor.

## References
* bug report in Safari
* Elix bug description