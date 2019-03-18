# Pattern: AutoAttribute

The AutoAttribute pattern uses the BatchedCallbacks pattern to add or alter an attribute on a web 
component *automatically*. 

The AutoAttribute serves several purposes. First, when an attribute is either added, altered, or removed
on an element, that will trigger an `attributeChangedCallback(...)` on that web component. 
If this was the *only* purpose of the AutoAttribute, then the FunctionalMixin pattern would suffice and 
should be used instead. However, the reason the AutoAttribute *uses* an HTML attribute on the host element
to *indirectly* trigger a lifecycle callback (ie. `attributeChangedCallback(...)`), 
is that the HTML attribute can *also* be:
1. *read from CSS* and used to activate/deactivate CSS rules internally and externally on the web 
   component,
2. *set in HTML*, thus started and stopped from the HTML template, and 
3. while still being indirectly controllable from JS (via `.setAttribute(...)` and 
   `.removeAttribute(...)`) and reactionable via the `attributeChangedCallback(...)`.

## The API of the AutoAttribute pattern

1. A web component adds a mixin that implements an AutoAttribute. 
   The AutoAttribute mixin gives the web component the ability to *automatically* spawn and adjust 
   the value of an attribute on the host element.
   
2. The AutoAttribute always contains two attributes that can be attained the element:
   1. `auto-attribute-activate` specifies whether the element will be automatically updated or not.
   2. `auto-attribue` is the attribute whose values will be automatically updated when the
      `auto-attribute-activate` attribute is there.
      
      The default mechanism when the `auto-attribute-activate` in the mixin is *not* to trigger a
      change in the value of the `auto-attribute` as a direct consequence, only to add the web 
      component to the current batch to be processed in the next round. It is up to the implementing
      web component to specify if and how the web component should behave *when* the 
      `auto-attribute-activate` attribute changes dynamically.

3. Commonly, the AutoAttribute mixin will batch the processing of all the elements that subscribe to/
   implements it. This ensures more efficient observations. When, and in which order this batch 
   process is run, depends on the element and/or system property being observed.

4. In many circumstances, the element and/or system property being observed is much more granular
   than the web component's CSS and/or JS reactions. When the AutoAttribute changes the value of the
   HTML element, this will therefore cause unnecessary CSSOM calculations and unnecessary 
   `attributeChangedCallback(...)`. To avoid such unnecesarry CSS and JS reactions, the AutoAttribute 
   rarely implement a fluent attribute value, but instead only a select few steps (threshold values).
   
5. These steps are also highly useful in that they enable both internal and external CSS rules to be
   selected upon them. Internally, the CSS rules look like:
   1. `* {...}` (default CSS rules, no `auto-attribute`) 
   2. `:host([auto-attribute]){...}` (CSS rules for all `auto-attribute` steps)
   3. `:host([auto-attribute=step1]){...}` (CSS rules for all `auto-attribute` step 1)
   4. `:host([auto-attribute=step2]){...}` (CSS rules for all `auto-attribute` step 2)
   5. etc.
    
   Externally, the CSS rules look like:
   1. `#el {...}` (default CSS rules, no `auto-attribute`) 
   2. `#el[auto-attribute]{...}` (CSS rules for all `auto-attribute` steps)
   3. `#el[auto-attribute=step1]{...}` (CSS rules for all `auto-attribute` step 1)
   4. `#el[auto-attribute=step2]{...}` (CSS rules for all `auto-attribute` step 2)
   5. etc.
    
   If any external CSS rule is set that can be applicable to the element is set, 
   then this external rule will have higher priority than any more specific step-wise CSS `:host` 
   selector inside the web component. Thus, often the two external rules should be:
    
   1. `#el:not[auto-attribute] {...}` (default CSS rules, no `auto-attribute`) 
   2. `#el[auto-attribute=""]{...}` (CSS rules for when `auto-attribute` is set without any 
      specified step value)
   
6. The steps of the attribute value can be specified as the value of `auto-attribute-active`.
   The format of the steps and their processing depends on the mixin implementation.

## Example: NaiveOnlineAutoAttributeMixin

In this example we will implement a web component that can automatically update an attribute based on 
whether or not the app has online access. When an `auto-online-active` attribute is added to the host 
element, then the component will spawn an `auto-online` attribute on the host element.

If the browser is offline, then `auto-online=0` is set on the host element.
If the browser is online, then `auto-online=1` is set.
If the browser has been online for longer than 1000ms, then `auto-online=1000` is set.

The NaiveOnlineAutoAttributeMixin has three fixed steps: 0, 1, 1000. How to implement custom
processing of steps will be shown in later examples.

The NaiveOnlineAutoAttributeMixin does not react to dynamic changes of the `auto-online-active`.
It is left up to the web components to:
 * remove or keep the `auto-online` attribute (and value) when `auto-online-active` is removed 
   from an element, and
 * whether to synchronously trigger the processing of `auto-online` attribute when 
   `auto-online-active` is added to an element.

```javascript
const batch = [];

function addToBatch(el) {
  const index = batch.indexOf(el);
  if (index >= 0)
    return;
  batch.push(el);
}

function removeFromBatch(el) {
  const index = batch.indexOf(el);
  if (index >= 0)
    batch.splice(index, 1);
}

function runBatchProcess() {
  for (let el of batch)
    el.updateAutoOnline();
}

let onlineState;

function connecting() {
  onlineState = 1;
  runBatchProcess();
  setTimeout(function () {
    onlineState = 1000;
    runBatchProcess();
  }, 1000);
}

function disConnecting() {
  onlineState = 0;
  runBatchProcess();
}

navigator.onLine ? connecting() : disConnecting();
window.addEventListener("online", connecting);
window.addEventListener("offline", disConnecting);

export function NaiveOnlineAutoAttributeMixin(type) {
  return class NaiveOnlineAutoAttributeMixin extends type {

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
      requestAnimationFrame(this.updateAutoOnline.bind(this));
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }

    updateAutoOnline() {
      this.hasAttribute("auto-online-active") && this.setAttribute("auto-online", onlineState);
    }
  };
}
```

The example above is for demonstration purposes. It is not intended for production.
It is unlikely that the altering the appearance of an element based on the online/offline status 
described above would require a) a mixin, b) coordinated control both inside and outside the element.
The purpose of this example is to keep things as simple as possible so to explain the mechanics of 
the AutoAttribute pattern as it can be applied to other more complex use cases later.

## Demo: Web traffic lights

In this demo we apply the `NaiveOnlineAutoAttributeMixin` to a web component called `<traffic-light>`.
The `<traffic-light>` element will have a border that is: 
1. grey, when the `NaiveOnlineAutoAttributeMixin` is inactive,
2. red, when the `NaiveOnlineAutoAttributeMixin` is active and the browser is offline,
3. yellow (ie. `gold`), when the `NaiveOnlineAutoAttributeMixin` is active and the element has just become 
   online or created,
4. green, when the `NaiveOnlineAutoAttributeMixin` is active and the element has been connected for
   longer than 1000 ms.
   
The `<traffic-light>` element observes for dynamic changes to the `auto-online-active` attribute 
and triggers synchronously updates of the value of `auto-online` attribute in all such instances.
This means essentially that to add static `auto-online` values, the user must 
*first* `.removeAttribute("auto-online-active")` *before* for example calling `.setAttribute("auto-online", 0)`.
This also means that setting only the `auto-online=1` value on a `<traffic-light>` element will result
in choosing the style statically.
   
The colors of the `<traffic-light>` element can be specified as CSS variables `--color-offline`, 
`--color-connecting`, `--color-online`, `--color-inactive`.

```html
<script type="module">

  import {NaiveOnlineAutoAttributeMixin} from "../../src/mixin/NaiveOnlineAutoAttributeMixin.js";

  class TrafficLight extends NaiveOnlineAutoAttributeMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
  div {
    border: 10px solid var(--color-inactive, darkgrey);
  }
  :host([auto-online="0"]) div{
    border-color: var(--color-offline, red);
  }
  :host([auto-online="1"]) div{
    border-color: var(--color-connecting, gold);
  }
  :host([auto-online="1000"]) div{
    border-color: var(--color-online, green);
  }
</style>
<div>
  <slot></slot>
</div>
    `;
    }

    static get observedAttributes() {
      return ["auto-online-active"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "auto-online-active") {
        if (newValue !== null)
          this.updateAutoOnline();
        else
          this.removeAttribute("auto-online");
      }
    }
  }

  customElements.define("traffic-light", TrafficLight);
</script>

<style>
  #two {
    --color-offline: darkblue;
    --color-connecting: blue;
    --color-online: lightblue;
  }
  #three[auto-online="1000"] {
    --color-online: pink;
  }
</style>

<traffic-light id="one" auto-online-active>one</traffic-light>
<traffic-light id="two" auto-online-active>two</traffic-light>
<traffic-light id="three">three</traffic-light>
<traffic-light id="four" auto-online="1">four</traffic-light>

<script>
  function alterAttributesDynamically() {
    document.querySelector("#one").removeAttribute("auto-online-active");
    document.querySelector("#three").setAttribute("auto-online-active", "");
  }
</script>
<button onclick="alterAttributesDynamically()">Remove auto-online from #one. Add auto-online to #three</button>
```

## References

 * 