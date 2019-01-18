# Pattern: MergedEvents

> Pointer events are MergedEvents of mouse events and touch events.

## Why and when to merge events?

Sometimes, two events in the DOM mean the same thing for the app.
For example, often your app couldn't care less if a `mousedown` or a `touchstart` that is triggered.
Often, this is also not really a problem. Your event listener mostly needs to be triggered and/or
access the event's target, and these aspects might be the same regardless of event type.
In such fortunate circumstances, you the app developer can simple attach two instead of one event
listener for each overlapping event type and go on your merry way.

However. This is of course not always so. Looking back at the two previous chapters and the `link-click`,
this event's defaultAction will que a "browse" task, ie. cause the browser to load a new page from the
specified `href` location or scroll internally to the hashlocation. 
But, so will the defaultAction of the `submit` event too. 
Both the `link-click` and `submit` events trigger the navigation task.

Ok, so far so good. We have two event types, we simply add two event listeners.
But, when listening for the two different "browse" events, we likely need to process some more data.
Simply being informed about the event occurring and its target is not enough. 
When we process a browse event we also need to know about:
 * the `baseURI` (or the first `<base href="...">` for that browsing context (read: `window`) if 
   the `baseURI` is not available)
 * the `href` of the link.
 
We might even like to know about the `method`, `target`, `relList`, and `download` properties of the browse
event/coming request. 
But these properties are not readily accessible from either 
the `link-click` event, or the `submit` event, or both.
To find this information takes time. And dedication. And could be a source of bugs.
 
And so, we crank up our pattern machine and employ a new pattern MergedEvents to stamp it out.

## The MergedEvents pattern

The MergedEvents pattern is simple. It listens for two events, and then dispatch a new custom, composed 
event every time one of these trigger events occur. This new composed event is likely extended with 
one or more CustomEventMethods that harmonize the different events and their input. That is it.
The MergedEvents pattern can also be combined with the TypeFilteredEvents or AttributeFilteredEvents pattern.
And other event patterns.

## Example: `browse` event

The `browse` event merges the `link-click` and the `submit` events.
Its main purpose is to unify the interface of these two events, mainly by offering:
 * a polyfill for the `baseURI` and
 * a `getHref()` method for `submit` events, that translates the `action` property *and*
   includes a correct query string for `<form method="GET">`s.
 * a `resolvedURL()` method for the complete absolute location based on `getHref()` and `baseURI`, and
 * a convenience method `isExternal()` that returns true if:
   1. the `resolvedURL()` does not start with `baseURI` or
   2. the link target has `external` as a `rel` property (and polyfill `LinkElement.relList`) or
   3. the link target has `download` set to true or
   4. the link target has a `target` attribute that does not point to the current browsing context 
      (ie. is different from "_self").

Put together, and based on the `link-click`, the full `browse` event trigger function becomes:
   
```javascript
//polyfill the baseURI property if needed
if (!('baseURI' in Node.prototype)) {
  Object.defineProperty(Node.prototype, 'baseURI', {
    get: function() {
      var base = (this.ownerDocument || this).querySelector('base[href]');
      return (base || window.location).href;
    },
    configurable: true,   //todo verify this polyfill and the configuration.
    enumerable: true
  });
}

function getFormHref(form) {
  var href = form.getAttribute("action");
  if (form.method === "POST")
    return href;
  //2. Test show that: if you have a <form action="index.html?query=already#hash" method="get">,
  //the query, but not the hash, will be overwritten by the values in the form when Chrome interprets the link.
  var url = new URL(href);
  url.search = "";
  for (let el of form.elements) {
    if (el.hasAttribute("name"))
      url.searchParams.append(el.name, el.value);
  }
  return url.href;
}

function resolvedURL(e) {
  return new URL(e.getHref(), e.target.baseURI);
}

function isExternal(e) {
  var href = e.getHref();
  if (!(new URL(href, e.target.baseURI).href.startsWith(href)))
    return false;
  if (e.target.hasAttribute("download"))
    return false;                                                  //todo polyfill relList too??
  if ((e.target.nodeName === "A" || e.target.nodeName === "AREA") && e.target.relList.contains("external"))
    return false;
  var targetTarget = e.target.getAttribute("target");
  if (targetTarget && targetTarget !== "_self")
    return false;
  return true;
}

function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

function makeBrowseEvent(trigger){
  var browse = new CustomEvent("browse", {bubbles: true, composed: true});
  browse.getHref = function (){trigger.getHref();};
  browse.resolvedURL = function (){resolvedURL(browse);};
  browse.isExternal = function (){isExternal(browse);};
  return browse;
}

window.addEventListener(
  "submit", 
  function(e){ 
    e.getHref = function(){ 
      getFormHref(e.target); 
    };
    dispatchPriorEvent(e.target, makeBrowseEvent(e), e);
  }, 
  true);

window.addEventListener("link-click", function(e){dispatchPriorEvent(e.target, makeBrowseEvent(e), e);}, true);
``` 

## Demo: one `browse` event to route them all

```html
<script>
//link-click event starts
function getLinkHref(link, click){
  //dirty little secret nr 1: SVG
  if (link.href.animVal) 
    return link.href.animVal;    
  //dirty little secret nr 2: <img ismap>
  if (click.target.nodeName === "IMG" && click.target.hasAttribute("ismap"))
    return link.href + "?" + click.offsetX + "," + click.offsetY;        
  return link.href;
}

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
    var composedEvent = new CustomEvent("link-click", {bubbles: true, composed: true});
    composedEvent.getHref = function(){getLinkHref(newTarget, e);};
    dispatchPriorEvent(newTarget, composedEvent, e);
  }, 
  true);
//link-click event ends

//browse event starts
//polyfill the baseURI property if needed
if (!('baseURI' in Node.prototype)) {
  Object.defineProperty(Node.prototype, 'baseURI', {
    get: function() {
      var base = (this.ownerDocument || this).querySelector('base[href]');
      return (base || window.location).href;
    },
    configurable: true,   //todo verify this polyfill and the configuration.
    enumerable: true
  });
}

function getFormHref(form) {
  var href = form.getAttribute("action");
  if (form.method === "POST")
    return href;
  //2. Test show that: if you have a <form action="index.html?query=already#hash" method="get">,
  //the query, but not the hash, will be overwritten by the values in the form when Chrome interprets the link.
  var url = new URL(href);
  url.search = "";
  for (let el of form.elements) {
    if (el.hasAttribute("name"))
      url.searchParams.append(el.name, el.value);
  }
  return url.href;
}

function resolvedURL(e) {
  return new URL(e.getHref(), e.target.baseURI);
}

function isExternal(e) {
  var href = e.getHref();
  if (!(new URL(href, e.target.baseURI).href.startsWith(href)))
    return false;
  if (e.target.hasAttribute("download"))
    return false;                                                  //todo polyfill relList too??
  if ((e.target.nodeName === "A" || e.target.nodeName === "AREA") && e.target.relList.contains("external"))
    return false;
  var targetTarget = e.target.getAttribute("target");
  if (targetTarget && targetTarget !== "_self")
    return false;
  return true;
}

function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

function makeBrowseEvent(trigger){
  var browse = new CustomEvent("browse", {bubbles: true, composed: true});
  browse.getHref = function (){trigger.getHref();};
  browse.resolvedURL = function (){resolvedURL(browse);};
  browse.isExternal = function (){isExternal(browse);};
  return browse;
}

window.addEventListener(
  "submit", 
  function(e){ 
    e.getHref = function(){ 
      getFormHref(e.target); 
    };
    dispatchPriorEvent(e.target, makeBrowseEvent(e), e);
  }, 
  true);

window.addEventListener("link-click", function(e){dispatchPriorEvent(e.target, makeBrowseEvent(e), e);}, true);
//browse event ends
</script>

<ul>
  <li><a href="https://i.am.normal.com/">normal link</a></li>
  <li>not a link</li>
  <li><a href="https://ismap.dirtylittlesecret.com/"><img ismap src="some picture" alt=""></a></li>
  <li><svg><a href="https://svg.dirtylittlesecret.com/"></a></svg></li>
  <li>
    <form method="get" action="https://submit.isalsoalinkclick.com">
      <input type="text" name="hello" value="world">
      <button type="submit">form-a-link!</button>
    </form>
  </li>
</ul>

<script>                                                                      
window.addEventListener("click", function(e){alert(e.type + ": " + e.target.id);});
window.addEventListener("link-click", function(e){alert(e.type + ": " + e.getHref());});
window.addEventListener("browse", function(e){alert(e.type + ": " + e.getHref());});

//micro router that just blocks everything
window.addEventListener("browse", function(e){
  e.trigger.preventDefault();
  //the below methods also will block the browsing.
  //e.preventDefault();
  //e.trigger.type === "link-click" ? e.trigger.trigger.preventDefault() : e.trigger.preventDefault();
});
</script>
```

## References

 * [MDN: `baseURI`](https://developer.mozilla.org/en-US/docs/Web/API/Node/baseURI)
                                                                            