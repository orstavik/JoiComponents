# Pattern: TypeFilteredEvent

The TypeFilteredEvent very much resemble the AttributeFilteredEvent. As with the AttributeFilteredEvent,
the TypeFilteredEvent will filter the target chain of the triggering event to potentially find a suitable 
target for its new composed event. The method thus looks like this:

```javascript
function filterOnType(e, typeName) {
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === typeName)
      return el;
  }
}                            
```

## Example: `link-click`

While still a simple structure, one custom, composed TypeFilteredEvent is extremely useful: 
`link-click`.
When the user clicks on an element within a page and that element is a child of a `<a href>`,
that click will trigger the browser to navigate. However, if the clicked element is not a
child of a link, then the event will not trigger a link click.
To have a custom event that always trigger if the user clicks on a link thus gives us a simple,
efficient way to intercept all `link-click`s. A naive implementation of `link-click` looks like this:

```javascript
function filterOnType(e, typeName) {
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === typeName)
      return el;
  }
}                            

function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

window.addEventListener(
  "click", 
  function(e){ 
    var newTarget = filterOnType(e, "A");
    if (!newTarget)
      return;
    dispatchPriorEvent(
      newTarget,
      new CustomEvent("link-click", {bubbles: true, composed: true}),
      e
    );
  }, 
  true);
```

However, there are two other link elements that can be `click`ed in an HTML page:
`<area>` (with nodeName "AREA") and inline SVG `<a>` elements (with nodeName "a").
In addition, a `click` will not navigate if a `metaKey` was pressed at the same time.
We therefore add this to our filter method, which therefore is best customized for this particular setting.

```javascript
function filterNavigationTargets(e) {
  if (e.metaKey)
    return;
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === "A" || el.nodeName === "AREA" || el.nodeName === "a")
      return el;
  }
}                            
```
This yields a filter that should resemble the browsers own native filtering of `click` to navigation 
task events.

```javascript
function filterNavigationTargets(e) {
  if (e.metaKey)
    return;
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === "A" || el.nodeName === "AREA" || el.nodeName === "a")
      return el;
  }
}                            

function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

window.addEventListener(
  "click", 
  function(e){ 
    var newTarget = filterNavigationTargets(e);
    if (!newTarget)
      return;
    dispatchPriorEvent(
      newTarget,
      new CustomEvent("link-click", {bubbles: true, composed: true}),
      e
    );
  }, 
  true);
```

### `link-click`, `preventDefault()` and PriorEvent

The `link-click` event is a prime example of why and when the PriorEvent pattern is needed.
If the developer wishes to control the navigation behavior of the browser's DOM, this particular event 
(in addition to `submit`) needs to be intercepted and controlled.
As described in the chapters on PriorEvent, AfterthoughtEvent and ReplaceDefaultAction, 
the only pattern that allows a developer to both create a custom, composed event that filters out all 
the relevant "navigation events" *and* that allows the developer to direct and selectively stop
such navigation events is PriorEvent.

(In the case of click, there is one other alternative. The replaceDefaultAction pattern could be employed, 
and then once the developer wishes to let navigation events bypass, a new `<form>` element with the correct
`href` and `method="get"` could be created and then called `.submit()` upon. However, this is thus 
far considered an inferior solution to the PriorEvent pattern, whose only drawback is a reverse order propagating
the composed event before the trigger event).

## Demo: `link-click` 

In the demo below we use `link-click` to control navigation. It is in a sense a micro, binary router, 
a router that blocks or let pass different navigation events.

```html
<script>
function filterNavigationTargets(e) {
  if (e.metaKey)
    return;
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === "A" || el.nodeName === "AREA" || el.nodeName === "a")
      return el;
  }
}                            

function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

window.addEventListener(
  "click", 
  function(e){ 
    var newTarget = filterNavigationTargets(e);
    if (!newTarget)
      return;
    dispatchPriorEvent(
      newTarget,
      new CustomEvent("link-click", {bubbles: true, composed: true}),
      e
    );
  }, 
  true);
</script>

<ul>
  <li><a id="a" href="https://letmepass.com/">#a, will navigate</a></li>
  <li><a id="b" href="https://i.am.blocked.com/">#b, is blocking both click event and navigation</a></li>
  <li><a id="b" href="https://i.am.justalittle.blocked.com/">#c, is only blocking navigation</a></li>
  <li id="c">you can click me too</li>
</ul>
<script>                                                                      
window.addEventListener("click", function(e){alert(e.type + ": " + e.target.id);});
window.addEventListener("link-click", function(e){alert(e.type + ": " + e.target.id);});

//micro router
window.addEventListener("link-click", function(e){
  if (e.target.href.endsWith("letmepass.com/")){
    alert("This link I will let pass");
  } else if (e.target.href.endsWith("i.am.blocked.com/")){
    e.preventDefault();
    alert("I am blocking click and navigation.");
  } else if (e.target.href.endsWith("i.am.justalittle.blocked.com/")){
    alert("I am blocking only navigation.");
    e.trigger.preventDefault();
  } else {
    //let it pass
  }
});
</script>
```

## References

 * 
                                                                            