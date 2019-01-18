# Pattern: AttributeFilteredEvent

## DOM-universal events

Custom, composed events constructed using the PriorEvent, AfterthoughtEvent or ReplaceDefaultAction 
patterns are all "DOM-global" by default. The event trigger function is added to the global object, `window`,
and if not explicitly cancelled, the event trigger function will dispatch a custom, composed event for
any all DOM elements on which the trigger event occurs.

The DOM-universal aspect of these patterns has several benefits:

1. You do not need to register and run more than a single event trigger listener function 
   even though you might want to apply your custom, composed event to many different elements.
   This can have adverse effects if you add event trigger functions on high frequency events 
   such as `mousemove` or `wheel`. You do not wan't to do that. But, if you initially only add event 
   trigger functions on low-frequency events such as `mousedown` or `click`, then 
   having a single global event listener will give you a performance boost if you intend to apply it to
   many elements in the DOM, potentially at the same time.
                                                                                   
   The performance benefits will be described more in detail under the EventSequence pattern.
   
2. The event is always available, on any DOM element that you wish to use it on.
   This makes it **composeable from the lightDOM**. This has two huuuuge implications:
   
   1. The custom events can be applied to native elements as well as custom elements 
      (or other specialized modules). As the event is always available, and propagates similar to 
      native events, you do not have to make a custom element or module to make a `<div>` draggable
      or capture a custom `swipe` event on an image.
      
   2. The creation, management, control, and maintenance of the code making the custom event
      thus has no coupling to the creation, management, control, and maintenance of custom elements.
      I cannot overstate how important this is. Custom event creation, management, control, and maintenance
      very quickly grow in complexity: for any event of some magnitude, there are likely tens of edge-cases,
      valuable tricks, associated conventions and best practices. The complexity of custom element 
      creation, management, control, and maintenance is equally demanding. To be able to separate these
      two beasts and tackle them one by one is extremely beneficial. When the complexity of both custom 
      events and custom elements must be managed as one, the complexity of one such web component can 
      easily sink a project before it gets of the ground.

3. Many native events are also DOM-universal. If you wish to use `long-press` or `tap` in your app,
   such an event clearly echoes `click` and you would likely desire to have this available as a global
   feature, as you would `click`. Having your custom, composed events global therefore gives you the ability 
   to parrot the platforms conventions when this is appropriate.

## Element-specific events

However, sometimes events are not global. The `submit` event for example is only ever dispatched by/on 
`<form>` elements; and the `change` event always target `<input>` and `<textarea>` elements.
Many events are thus not universal to all elements in the DOM (DOM-universal), but specific to a select
group of DOM elements (element-specific).

There are three types of element-specific custom, composed events:
 * Events specific to certain instances of elements (AttributeFilteredEvents).
 * Events specific to a certain type of elements (TypeFilteredEvents).
 * Events specific to both certain instances of a certain type of elements (simply the union of the 
 AttributableEvents and FilteredEvents patterns).
 
## AttributeFilteredEvents

To make an event specific to certain element instances, two things must happen:

1. The element must be marked as having this event. This is done by adding an attribute to that element.
   (Attributes is the inter-linguistic marker for HTML elements available to both HTML, JS and CSS.
   If you want an aspect of an HTML element to be accessible in a universal context, you use attributes.)

2. The originally DOM-universal event trigger function must be restricted to be applied only to the 
   marked elements.
   This is done by filtering out only the events which include a target marked with the given attribute. 

To implement the AttributeFilteredEvents pattern is simple. You need a pure `filterOnAttribute` function 
that finds the first target with the required attribute, and then dispatching the custom, composed event
on that element.

## Demo: `echo-click` event filtered on `echo-click` attribute
   
```javascript
function filterOnAttribute(e, attributeName) {                //1
  for (let el = e.target; el; el = el.parentNode) {
    if (!el.hasAttribute)
      return null;
    if (el.hasAttribute(attributeName))
      return el;
  }
  return null;
}

function dispatchPriorEvent(target, composedEvent, trigger) {   
  if (!target || !composedEvent)                              //3
    return;
  composedEvent.preventDefault = function () {                  
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              
  target.dispatchEvent(composedEvent);                   
}

window.addEventListener(
  "click", 
  function(e) {
    dispatchPriorEvent(
      filterOnAttribute(e, "echo-click"),                     //2
      e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), 
      e
    );
  }, 
  true
);
```
1. The `filterOnAttribute(e, attributeName)` finds the first target in the target-chain with the
   specified `attributeName`. If no such element exists, it returns `null`.
2. As not all trigger events now will be directed at elements with this attribute, 
   the `dispatchPriorEvent(...)` function might now be given a void target.
3. The `dispatchPriorEvent(...)` function is therefore updated to simply abort
   when it is asked to dispatch an event either lacking an appropriate target or new composed event.

Put into action, the events can be filtered on attribute. Below is a demo of the filtered `echo-click`
in action.

```html
<script>
function filterOnAttribute(e, attributeName) {                //1
  for (let el = e.target; el; el = el.parentNode) {
    if (!el.hasAttribute)
      return null;
    if (el.hasAttribute(attributeName))
      return el;
  }
  return null;
}

function dispatchPriorEvent(target, composedEvent, trigger) {   
  if (!target || !composedEvent)                              //3
    return;
  composedEvent.preventDefault = function () {                  
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              
  target.dispatchEvent(composedEvent);                   
}

window.addEventListener(
  "click", 
  function(e) {
    dispatchPriorEvent(
      filterOnAttribute(e, "echo-click"),                     //2
      e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), 
      e
    );
  }, 
  true
);
</script>

<div id="a1">
  no echo here
</div>

<div id="b1" echo-click>
  echo here
</div>

<div id="c1">
  <div id="c2" echo-click>
    echo here too
  </div>
</div>

<div id="d1" echo-click>
  <div id="d2" echo-click>
    only a single echo here too
  </div>
</div>

<script>
document.addEventListener("click", function(e){alert(e.type +": "+ e.target.id);});
document.addEventListener("echo-click", function(e){alert(e.type +": "+ e.target.id);});
</script>
```

## References

 * 
                                                                            