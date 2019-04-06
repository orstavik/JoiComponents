# Pattern: AutoAttribute

The AutoAttribute pattern uses the BatchedCallbacks pattern to add or alter an attribute on a web 
component *automatically*. 

The AutoAttribute serves 3 purposes:

1. *reactive in JS*. When the auto attribute is either added, altered, or removed from the host element, 
   this will trigger an `attributeChangedCallback(...)` on the web component. 
   If this callback was the *only* purpose of the AutoAttribute, then the AutoAttribute would be 
   overkill and the FunctionalMixin pattern should be used instead.
   
   However, the AutoAttribute pattern *uses* an HTML attribute to *indirectly* trigger the
   `attributeChangedCallback(...)` because the HTML attribute can *also* be:
   
2. *read from CSS*. CSS selectors can use HTML attributes to activate/deactivate different sets
   of CSS rules. This way, the web component can both choose between a set of CSS rules for its
   content internally, and a set of CSS rules can be set on the component externally.
   
3. *set in HTML*. This means that the AutoAttribute behavior can be read from HTML and also intuitively
   controlled, started and stopped directly in the HTML template.

The AutoAttribute pattern is a mechanism to enable web components to automatically react to changes.
By using an HTML attribute to communicate changes, both JS reactions and CSS rules can be selected, 
while the mechanism can be read and controlled via the DOM.

## The API of the AutoAttribute pattern

The AutoAttribute is implemented as a mixin that reads two HTML attributes:
1. `auto-attributename` activates/deactivates the AutoAttribute on the element.
2. `_attributename` is the attribute value that is automatically updated when the
   `auto-attributename` attribute is there.
   
   How the web component should activate the mixin in response `auto-attributename` varies and
   depends on how the AutoAttribute mixin works and what it does. The developer of the web component
   should often, but not always, expect to:
   
   1. *observe* the `auto-attributename` attribute, and
   2. in `attributeChangedCallback(...)` react to the `auto-attributename` by calling a method 
   inherited from the mixin.

When activate, the AutoAttribute mixin will *automatically* set or remove the `_attributename` on 
the host element. When the `_attributename` is added/removed on the web component, two things happen:

1. a `attributeChangedCallback(...)` for the `_attributename` is called.

2. CSS selectors for the host element that use this attribute can be turned on/off.
   Internally, CSS selectors that use the AutoAttribute value look like:
   1. `* {...}` (default CSS rules, no `_attributename`) 
   2. `:host([_attributename]){...}` (CSS rules when the `_attributename` is set)
   
   Externally, the CSS selectors look like:
   1. `#el {...}` (default CSS rules, applies to all elements, regardless of `_attributename` state) 
   2. `#el:not([_attributename]) {...}` (default CSS rules, no `auto-attribute`) 
   3. `#el[_attributename]{...}` (CSS rules for when `auto-attribute` is set without any 
      specified step value)

Commonly, the mixin batches the AutoAttribute processing, ie. observing changes and applying them to
all elements that subscribe to it as a *single* synchronous process. 
This yields efficiency. However, when the AutoAttribute runs and in which order these batched elements 
are processed, depend on the element and/or system property being observed.

## Example: OnlineAutoAttributeMixin

This example shows a mixin that adds an AutoAttribute `_online="1"` on the host element of a web component
whenever the browser is online, and an `_online="0"` whenever the browser is offline.
The AutoAttribute is controlled by the `auto-online` attribute.

The OnlineAutoAttributeMixin does not automatically react to the `auto-online` attribute.
It is left up to the web components that inherits from the OnlineAutoAttributeMixin to:
 * remove or keep the `_online` attribute (and value) when `auto-online` is removed 
   from an element, and
 * whether or not to immediately trigger the processing of `_online` attribute when `auto-online` is 
   set on an element.

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

let onlineState = navigator.onLine ? 1 : 0;
window.addEventListener("online", function connecting() {
  onlineState = 1;
  runBatchProcess();
});
window.addEventListener("offline", function disConnecting() {
  onlineState = 0;
  runBatchProcess();
});

export function OnlineAutoAttributeMixin(type) {
  return class OnlineAutoAttributeMixin extends type {

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }

    updateAutoOnline() {
      this.hasAttribute("auto-online") && this.setAttribute("_online", onlineState);
    }
  };
}
```

## Demo: Web traffic lights

In this demo we apply the `OnlineAutoAttributeMixin` to a web component called `<traffic-light>`.
The `<traffic-light>` element will have a border that is: 
1. grey, when the `OnlineAutoAttributeMixin` is inactive and no `_online` attribute is set,
2. red, when the `OnlineAutoAttributeMixin` is active and the browser is offline, or `_online="0"` attribute,
3. green, when the `OnlineAutoAttributeMixin` is active and the browser online, or `_online="1"` attribute,.
   
The `<traffic-light>` element observes the `auto-online` attribute:
whenever the `auto-online` attribute is added and removed, the `<traffic-light>` updates the value of 
its `_online` attribute. This means that:
 
1. The user of the element can fix the `_online` attribute both statically and dynamically, but that
2. the `_online` attribute value will be overwritten by the system whenever:
   1. the `auto-online` attribute is added (including at startup),
   2. the `auto-online` attribute is removed,
   3. the browser online/offline state changes *and* an `auto-online` attribute is set on the element.
   
The colors of the `<traffic-light>` element can be specified as CSS variables `--color-offline`, 
`--color-online`, `--color-inactive`.

```html
<script type="module">

  import {OnlineAutoAttributeMixin} from "../../src/mixin/OnlineAutoAttributeMixin.js";

  class TrafficLight extends OnlineAutoAttributeMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
  div {
    border: 10px solid var(--color-inactive, darkgrey);
  }
  :host([_online="0"]) div{
    border-color: var(--color-offline, red);
  }
  :host([_online="1"]) div{
    border-color: var(--color-online, green);
  }
</style>
<div>
  <slot></slot>
</div>
    `;
    }

    static get observedAttributes() {
      return ["auto-online"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "auto-online") {
        if (newValue !== null)
          this.updateAutoOnline();
        else
          this.removeAttribute("_online");
      }
    }
  }

  customElements.define("traffic-light", TrafficLight);
</script>

<style>
  #two {
    --color-offline: darkblue;
    --color-online: lightblue;
  }
  #three[_online="1"] {
    --color-online: pink;
  }
</style>

<traffic-light id="one" auto-online>one</traffic-light>
<traffic-light id="two" auto-online>two</traffic-light>
<traffic-light id="three">three</traffic-light>
<traffic-light id="four" _online="0">four</traffic-light>

<script>
  function alterAttributesDynamically() {
    document.querySelector("#one").removeAttribute("auto-online");
    document.querySelector("#three").setAttribute("auto-online", "");
  }
</script>
<button onclick="alterAttributesDynamically()">Remove auto-online from #one. Add auto-online to #three</button>
```

The example above is for demonstration purposes. It is unlikely that the altering the appearance of an 
element based on the online/offline status would best be served with a) a mixin, b) coordinated control 
both inside and outside the element. The purpose of this example is to explain the mechanics of 
the AutoAttribute pattern as simple as possible. The AutoAttribute's true value comes when applied to
more complex use cases.

## References

 * 