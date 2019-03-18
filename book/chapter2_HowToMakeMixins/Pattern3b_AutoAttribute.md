# Pattern: AutoAttribute

The AutoAttribute pattern uses the BatchedCallbacks pattern to add or alter an attribute on a web 
component *automatically*. 

The AutoAttribute serves several purposes. First, when an attribute is either added, altered, or removed
on an element, that will trigger an `attributeChangedCallback(...)` on that web component. 
If this was the *only* purpose of the AutoAttribute, then the FunctionalMixin pattern would suffice and 
should be used instead. However, the reason the AutoAttribute triggers a lifecycle callback (ie. 
`attributeChangedCallback(...)`) *via* an HTML attribute on the host element, is that the state of an 
HTML attribute can *also* be *read from CSS*, *set in HTML template*, in addition to being controlled
and triggering JS functions.

## The API of the AutoAttribute pattern

1. A web component adds an AutoAttribute as part of its makeup. The AutoAttribute pattern gives the
   web component the ability to *automatically* spawn and adjust the value of an attribute on the
   host element.

2. The AutoAttribute can be:
   1. active by default, and then stopped using a `auto-attribute-freeze` attribute, or
   2. deactive by default, and then started/stopped by adding/removing the `auto-attribute-steps` 
      attribute to the host element.
   
   The AutoAttribute employs a combination of these two alternatives to function successfully.
   First, by running the callbacks in a batch, all elements are actively checked by default (1.), 
   but only the elements that has an `auto-attribute-steps` attribute are processed.
   
3. In many circumstances, the value being observed and added can be much more granular than the web 
   component's reaction to it. To avoid both a) mutating the DOM attribute value and b) 
   triggering a great many unnecessary `attributeChangedCallback(...)`, the AutoAttribute specifies a
   series of steps that will cause the attribute value to be changed.
   
4. The `auto-attribute` is used to control the style on the host element internally in the web component 
   via rule sets such as `:host(:not([auto-attribute])){...}`, `:host([auto-attribute]){...}`, 
   `:host([auto-attribute=step1]){...}`, `:host([auto-attribute=step2]){...}`, etc.
   
5. Externally, the same `web-component:not([auto-attribute]`, `web-component[auto-attribute=step1]` rule
   set is used to override the internal styles.
   
6. The steps of the attribute value is specified as a separate attribute `auto-attribute-steps` that contain 
   for example an integer value, an array of integers, or one or more other value(s) suitable for the 
   state being observed by the AutoAttribute.

## Example: NaiveOnlineAutoAttributeMixin

In this example we will implement a web component that can automatically update an attribute based on 
whether or not the app has online access. If an `auto-online` attribute is added to the host element, 
then the component will a) check to see if the browser has an internet connection, and 
then b) start to listen for the `online` and `offline` events.

The NaiveOnlineAutoAttributeMixin uses an attribute `auto-online-steps` to specify an `onlineTime` 
for how many ms the element needs to be connected for in order to update the `auto-online` attribute
to a second step.

If the browser is offline, then `auto-online=0` is set on the host element.
If the browser is online, then `auto-online=1` is set.
If the browser has been online for longer than `onlineTime`, then `auto-online=onlineTime` is set.

```javascript
const batch = [];

function addToBatch(el) {
  const index = batch.indexOf(el);
  if (index >= 0)
    return;
  batch.push(el);
  updateOnline(el, navigator.online ? 1 : 0);
}

function removeFromBatch(el){
  const index = batch.indexOf(el);
  if (index >= 0)
    batch.splice(index, 1);
}

function runBatchProcess(state){
  const els = batch.slice();
  for (let el of els) {
    if (batch.indexOf(el)>=0)                      //[x] 
      updateOnline(el, state);
  }
}

function updateOnline(el, state){
  if (!el.hasAttribute("auto-online-steps"))
    return;
  if (state === 1){
    const step = parseInt(el.getAttribute("auto-online-steps")) || 1000;
    setTimeout(function(){
      updateOnline(el, step);
    }, step);
  }
  el.setAttribute("auto-online", state);
}

window.addEventListener("online", function(){
  runBatchProcess(1);
});

window.addEventListener("offline", function(){
  runBatchProcess(0);
});

export function NaiveOnlineAutoAttributeMixin(type) {
  return class NaiveOnlineAutoAttributeMixin extends type {
    
    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }
    
    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }
  };
}
```

The example above is for demonstration purposes, not intended for production.
It is unlikely that the altering the appearance of an element based on the online/offline status 
described above would require a) a mixin, b) coordinated control both inside and outside the element.
The purpose of this example is to keep things as simple as possible so to explain the mechanics of 
the AutoAttribute pattern as it can be applied to other more general use cases.

## Demo: Web traffic lights

In this demo we apply the `NaiveOnlineAutoAttributeMixin` to a web component called `<traffic-light>`.
The `<traffic-light>` element will have a border that is: 
1. grey, when the `NaiveOnlineAutoAttributeMixin` is inactive,
2. red, when the `NaiveOnlineAutoAttributeMixin` is active and the browser is offline,
3. yellow (ie. `gold`), when the `NaiveOnlineAutoAttributeMixin` is active and the element has just become 
   online or created,
4. green, when the `NaiveOnlineAutoAttributeMixin` is active and the element has been connected for
   longer than 1000 ms.
   
The colors of the `<traffic-light>` element can be specified as CSS variables `--color-offline`, 
`--color-connecting`, `--color-online`, `--color-inactive`.


```html
<script type="module">

import {NaiveOnlineAutoAttributeMixin} from "./NaiveOnlineAutoAttributeMixin.js";

class TrafficLight extends NaiveOnlineAutoAttributeMixin(HTMLElement){
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  div {
    border: 10px solid var(--color-inactive, darkgrey);
  }
  :host([auto-online=0]) div{
    border-color: var(--color-offline, red);
  }
  :host([auto-online=1]) div{
    border-color: var(--color-connecting, gold);
  }
  :host([auto-online>1]) div{
    border-color: var(--color-connecting, green);
  }
</style>
<div>
  <slot></slot>
</div>
    `;
  }
}
customElements.define("traffic-light", TrafficLight);
</script>

<style>
#two{
  --color-offline: darkblue;
  --color-connecting: blue;
  --color-online: lightblue;
}
</style>

<traffic-light auto-online-steps id="one">ONE</traffic-light>
<traffic-light auto-online-steps=2000 id="two">two</traffic-light>
<traffic-light id="three">3</traffic-light>

<script >
  document.querySelector("#one").removeAttribute("auto-online-steps");
  document.querySelector("#three").addAttribute("auto-online-steps");
</script>
```

## References

 * 