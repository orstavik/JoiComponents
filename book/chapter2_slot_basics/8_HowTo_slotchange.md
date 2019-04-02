# HowTo: `slotchange`

The `slotchange` event is dispatched from `<slot>` elements whenever the list of nodes transposed
to `<slot>` element changes (its `assignedNodes` change).
                             
The `slotchange` event bubbles, and this means that you can listen for all `slotchange` in the
shadowDOM of a web component by adding an event listener to its root:

```javascript
this.shadowRoot.addEventListener("slotchange", function(){console.log("i will work")});
```

The `slotchange` event is `{composed: false}`. This means that it will not propagate up into the
lightDOM, but also that you can't listen for `slotchange` events on the host element. Thus, simply
listening for `slotchange` events on `this` inside a web component will NOT work.
`this.addEventListener("slotchange", function(){console.warn("ERROR!! I DON'T WORK!!")});`

## Example: `slotchange` event

```html
<script>
  class GreenFrame extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});   
      this.shadowRoot.innerHTML =
        `<style>
          div {
            display: block;
            border: 10px solid green;
          }
        </style>

        <div>
          <slot id="hasFallback"><h3>You can put stuff here)</h3></slot>
        </div>`;
      this.shadowRoot.addEventListener("slotchange", function(e){
        console.log("A slotchange event has occured!");
        console.log("The slot's id is:", e.target.id);
        console.log("The slot contains:", e.target.assignedNodes({flatten: true}));
      });
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame id="one"></green-frame>                                         
<green-frame id="two"><h1>Hello world!</h1></green-frame>                                                <!--3-->

<script>

  const first = document.querySelector("green-frame");
  const firstSlot = first.shadowRoot.children[1].children[0];
  console.log("-------------");
  console.log("The empty slot contains:", firstSlot.assignedNodes({flatten: true}));
  console.log("-------------");

  setTimeout(function(){
    const h2 = document.createElement("h2");
    h2.innerText = "Stay green!";
    document.querySelector("green-frame#two").appendChild(h2); 
  }, 2000);
  setTimeout(function(){
    const h1 = document.querySelector("h1");
    document.querySelector("green-frame#two").appendChild(h1); 
  }, 4000);
</script>

<ol>
  <li>
    In the console, you will first see one slotchange event being processed.
    This is the slotchange event for the "Hello world!" text.
    There is no slotchange event for fallback nodes, but there is a slotchange event when nodes are transposed into
    an element when the element is first declared.
  </li>
  <li>
    After the initial slotchange event, you will see the content of the slot with the fallback nodes being logged.
  </li>
  <li>
    After 2000ms, you will see a second slotchange event. This slotchange event occurs as second node is
    appended in the lightDOM and then transposed into the green-frame shadowDOM.
  </li>
  <li>
    After 4000ms, you will see a third slotchange event. This slotchange event occurs as the order 
    of the transposed nodes change.
  </li>
</ol>
```

## SlotchangeNipSlip #1: Old Safari Bug

In Safari browsers, the initial slotchange event is *not* dispatched.
This is a bug in the old Safari browsers. It was patched in IOS v. (todo).
https://trac.webkit.org/changeset/235458/webkit

If you need to support older Safari browsers, you either need to reduce your dependency to the 
initial slotchange event (which can be tricky) or ensure that all browsers call the function added as
the initial slotchange event, but only once (which also can be a bit tricky).

The missing initial `slotchange` event should also be viewed in relationship with SlotchangeNipSlip #2.
SlotchangeNipSlip #2 illustrate that `slotchange` event *only* reacts to changes in transposed nodes, 
and *not* fallback nodes. We will return to SlotchangeNipSlip #2, but put simply, the consequence of 
SlotchangeNipSlip #2 is solely that another class of initial `slotchange` event do not occur.

Finally, all SlotchangeNipSlips can be fixed with the same solution, namely implementing a 
`slotCallback(...)` that controls the triggering and timing of functions reacting to `slotchange` 
events.

## References

 * [Webkit: missing initial `slotchange`](https://trac.webkit.org/changeset/235458/webkit)
 * [MDN: `slotchange`](https://developer.mozilla.org/en-US/docs/Web/Events/slotchange)
 * [Elix project `SlotchangeMixin`](https://test.elix.org/elix/SlotContentMixin)
 * [Spesification: whatwg on slotchange](https://dom.spec.whatwg.org/#mutation-observers)