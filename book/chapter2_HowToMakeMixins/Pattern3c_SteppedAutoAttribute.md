# Pattern: SteppedAutoAttribute

The SteppedAutoAttribute pattern extends the AutoAttribute pattern to observe a system state as a 
sequence of steps. 

In many circumstances, the property being observed by the AutoAttribute is not a boolean, but a number.
This number value would be helpful to reflect in the `_attributename` property. For example, it might
be beneficial to show for how many seconds the element has been `_online` or offline.

But, these underlying, observed properties are often much more granular than the CSS and/or JS 
reactions that they control. For example, the `<traffic-light>` element will only benefit
from knowing whether or not the element has been `_online` for more than 3 and 6 seconds; it might not 
need to be informed if the element had been `_online` for 1, 2, 4, 5, 7, 8, 9, seconds etc.

Whenever the AutoAttribute pattern updates the attribute value, that will 
a) dirty the CSSOM and trigger new style calculations and b) trigger a `attributeChangedCallback(...)`.
If *all* changes to the underlying, observed property were reflected in the AutoAttribute,
then that would result in *a lot of* unnecessary CSSOM calculations and callbacks.

To avoid lots of unnecessary CSS and JS processing, the SteppedAutoAttribute therefore implements 
a series of steps that will instruct the SteppedAutoAttribute mixin to only alter the HTML attribute 
value when it "steps over" different thresholds. This ensures that the granularity of the HTML attribute updates 
can be adjusted to the granularity of the JS and CSS reactions to the AutoAttribute.

## The API of the SteppedAutoAttribute pattern

The SteppedAutoAttribute has the same API as the AutoAttribute pattern with the following extensions.

The `auto-attributename` attribute represent a string with a comma separated list, 
for example `auto-attributename="200, 600, 1200"`. 
All web components that inherit from a SteppedAutoAttribute mixin *must* observe its `auto-attributename`.
Whenever the `auto-attributename` property changes value, the web component must alert the 
SteppedAutoAttribute mixin about its new value. If there is no value given to the `auto-attributename` 
attribute, then commonly its empty value implicitly refers to a default comma separated list.

Then, whenever the observed property passes a threshold (up or down), then the `_attributename` 
is automatically populated with the nearest surpassed threshold.
For example, if an `auto-attributename="200, 600, 1200"` is specified, then the `_attributename="200"`
when the observed property is 599, and `_attributename="600"` when the observed property is 601.

But, there is a problem here. What if two different elements of the same web component wishes to
specify two different scales for the observed values, but still needed to specify the elements style
according to a fixed number of steps?

## Step description vs. step number?
 
The web component internally needs to react to change of steps both in CSS and JS. 
Similarly, externally, the user of the web component needs to have their styles react to the 
change of steps. But, in addition, the user of the web component might also desire to specify a
custom set of values that will trigger the steps, ie. split:
 * *the threshold value of the observed properties* from the 
 * *the step name/number*.
 
To accomplish this is simple enough. When the SteppedAutoAttribute mixin adds the value to the 
`_attributename` attribute, it does so using a custom format: <stepnumber> + ":" + <observedValue>.
This means two things:

1. The CSS rules, both internally and externally, should select the appropriate "step number" using
   `[_attributename^="stepnumber:"]`.

2. The `attributeChangedCallback(...)` can split the value of the auto `_attributename` on `:`
   to get information both about which step was triggered and the actual observed value that triggered 
   it.

This means that you can style two custom elements with the same definition and the same set of rules,
while still giving them each different criteria for their observed values:

```html
<style>
  auto-element[_attributename^⁼"1:"]{
    color: red;
  }
  auto-element[_attributename^⁼"2:"]{
    color: yellow;
  }
  auto-element[_attributename^⁼"3:"]{
    color: green;
  }
</style>

<auto-element id="one" auto-attributename="100, 200, 300" _attributename="3:301"></auto-element>
<auto-element id="two" auto-attributename="300, 400, 1200" _attributename="1:301"></auto-element>
```

## CSS selectors for SteppedAutoAttributes

CSS rules, both inside and outside the web component, can then be selected based on these steps, thus
extending the CSS selectors from the (boolean) AutoAttribute pattern:
1. Internally, the CSS selectors look like (assuming a set of 3 steps):
   1. `* {...}` (default CSS rules, no `_attributename`) 
   2. `:host([_attributename]){...}` (CSS rules for all `_attributename` steps)
   3. `:host([_attributename=""]){...}` (CSS rules for the first `_attributename`, between step 0 and step 1)
   4. `:host([_attributename^="1:"]){...}` (CSS rules for values passing step 1, but not step 2)
   5. `:host([_attributename^="2:"]){...}` (CSS rules for values passing step 2, but not step 3)
   6. `:host([_attributename^="3:"]){...}` (CSS rules for values passing the last step 3)
    
   Externally, the CSS selectors look like:
   1. `#el {...}` (default CSS rules, applies to all elements, regardless of `_attributename` state) 
   2. `#el:not([_attributename]) {...}` (default CSS rules, no `auto-attribute`) 
   3. `#el[_attributename]{...}` (CSS rules for when any `auto-attribute` is set)
   4. `#el[_attributename=""]{...}` (CSS rules for the first `_attributename`, between step 0 and step 1)
   5. `#el[_attributename^="1:"]{...}` (CSS rules for values passing step 1, but not step 2)
   6. `#el[_attributename^="2:"]{...}` (CSS rules for values passing step 2, but not step 3)
   7. `#el[_attributename^="3:"]{...}` (CSS rules for values passing the last step 3)
    
> As a rule of thumb, the external CSS selectors will (almost always) have higher priority than all 
internal CSS selectors. Therefore, if you want to use some of the internal CSS settings for some steps,
you should not use the external selectors #1 and #3.
    

## Example: SteppedOnlineAutoAttributeMixin

In this example we add steps to our OnlineAutoAttributeMixin example.
The steps represent two intervals as we consider the network connection going:
1. going from `red` to `orange`, as a network connection is first detected.
2. going from `orange` to `yellow`, as a network connection is not immediately lost.
3. going from `yellow` to `green`, as the network connection persists and is considered safe.

The mixin implements these intervals using `setTimeout(..., Xms)`. As the state of the intervals
now might change from element to element, the onlineState can no longer be preserved globally,
but must be stored per element.

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

window.addEventListener("online", function connecting() {
  for (let el of batch)
    el.onlineConnecting();
});
window.addEventListener("offline", function disConnecting() {
  for (let el of batch)
    el.onlineDisconnecting();
});

export function SteppedOnlineAutoAttributeMixin(type) {
  return class SteppedOnlineAutoAttributeMixin extends type {

    constructor(){
      super();
      this._timers = {};
      this._steps = [];
      requestAnimationFrame(this.onlineConnecting.bind(this));
    }

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      addToBatch(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback();
      removeFromBatch(this);
    }

    setSteps(txt){
      this._steps = txt.split(",").map(num => parseInt(num));
    }

    onlineConnecting(){
      if (!this.hasAttribute("auto-online"))
        return;
      this.setAttribute("_online", "");         //set step 0

      let self = this;
      for(let i = 0; i < this._steps.length; i++){
        let step = parseInt(this._steps[i]);
        this._timers[i] = setTimeout(function(){
          self.setAttribute("_online", (i+1) + ":" + step);
        }, step);
      }
    }

    onlineDisconnecting(){
      if (!this.hasAttribute("auto-online"))
        return;
      for (let timerNr in this._timers)
        clearTimeout(this._timers[timerNr]);
      this._timers = {};
    }
  };
}
```

## Demo: Web traffic lights

In this demo we apply the `SteppedOnlineAutoAttributeMixin` to a web component called `<traffic-light>`.
The `<traffic-light>` element will have a border that is: 
1. grey, when the `SteppedOnlineAutoAttributeMixin` is inactive,
2. red, when the `SteppedOnlineAutoAttributeMixin` is active and the element has been online less than step 1 ms.
4. yellow: when the `SteppedOnlineAutoAttributeMixin` is active and the element has been online more than step 1 ms.
5. green, when the `SteppedOnlineAutoAttributeMixin` is active and the element has been online more than step 2 ms.
   
The `<traffic-light>` element observes for dynamic changes to the `auto-online` attribute 
and updates the mixin whenever this attribute changes.

```html
<script type="module">

  import {SteppedOnlineAutoAttributeMixin} from "../../src/mixin/SteppedOnlineAutoAttributeMixin.js";

  class TrafficLight extends SteppedOnlineAutoAttributeMixin(HTMLElement) {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
  div {
    border: 10px solid var(--color-inactive, darkgrey);
  }
  :host([_online=""]) div{
    border-color: var(--color-offline, red);
  }
  :host([_online^="1:"]) div{
    border-color: var(--color-connecting, gold);
  }
  :host([_online^="2:"]) div{
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
        if (newValue === null)
          return this.removeAttribute("_online");
        if (newValue === "" && this._steps.length === 0)
          newValue = "100, 1500";
        if (newValue !== "")
          this.setSteps(newValue);
        this.onlineConnecting();
      }
    }
  }

  customElements.define("traffic-light", TrafficLight);
</script>

<traffic-light id="one" auto-online>one</traffic-light>
<traffic-light id="two" auto-online="2000, 4000">two</traffic-light>
<traffic-light id="three">three</traffic-light>
<traffic-light id="four" _online="1:">four</traffic-light>

<script>
  window.addEventListener("click", function(e){
    if (e.target.tagName === "TRAFFIC-LIGHT"){
      e.target.hasAttribute("auto-online") ?
        e.target.removeAttribute("auto-online") :
        e.target.setAttribute("auto-online", "");
    }
  })
</script>
<p>Click on each element to toggle their "auto-online" attribute.</p>

<p>
  To store the step settings when the "auto-online" attribute is switched off and then on again,
  the web component should preserve the "auto-online" attribute as a private property.
</p>
```

It is possible to have the inner CSS rules only select the number in the step, and not its precise
value. This is beneficial when the developer needs to separate for example the length of a timeline or 
the spatial dimensions from the web components style.

The trick to split the value of the steps with the number of the steps is to use a custom number format 
that splits the `:`.

## Discussion: Is the SteppedAutoAttribute taking a step too far?

Yes, the ":"-separated value of the auto `_attributename` value is an program-in-strings-hack. 
Yes, this definitively adds complexity for the user of the SteppedAutoAttribute pattern. 
Yes, this indirectly establishes a completely new convention for managing web component styles by 
repeatedly formulating a complex, very rare `[_attributename^=666:]` CSS formula. 
Yes, this is syntactic salt, not syntactic sugar.

But. The benefits of the pattern is that it frees the user of the web component to specify the CSS 
styles separate from the observed properties values. And as a developer of reusable web components,
you simply cannot ignore the need to do this. Both timelines and spatial dimensions are likely to
vary from app to app and element to element, while the element still needs to adher to the same styles.
Thus, the trick of splitting step number from threshold value using a `:` is not only useful, but necessary.

My advice is to use this convention in all SteppedAutoAttribute implementation from the beginning. 
As soon as you start reusing your SteppedAutoAttribute web component, 
you will need to split the step numbers with the step observed value.
It is better to prepare for this eventuality from the start, in both mixin and first web component,
instead of having to refactor and work around it later.

## References

 * 