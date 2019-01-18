# Pattern: CustomEventMethod

When processing events, you want to prepare the event for general use, but you want to delay 
as much of this work as possible.
This means that instead of populating your custom event with processed data, 
you want to populate your event with methods that will retrieve that data later.

A simple and clean way to make such methods is to:
 1. create som generic functions so as to avoid parsing the same functions twice 
    that accepts the event or the event.target as input,
 2. and then create an anonymous function (closure) that calls this method using the custom event 
    itself as input.

## Example 1: `link-click` with naive `getHref()` method

To illustrate this practice we return to our `link-click` event. 
We create a function `getLinkHref(element)` that given a target element returns 
the `href` property of that element.
As a `getHref` property to the `new CustomEvent` object, 
we then add a closure that calls `getLinkHref(element)` using the `newTarget` as argument.

```javascript
function getLinkHref(link){
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
    composedEvent.getHref = function(){getLinkHref(newTarget);};
    dispatchPriorEvent(newTarget, composedEvent, e);
  }, 
  true);
```

## Example 2: `link-click` with true `getHref()` method

As in all things defaultAction and browser navigation, nothing is simple and without edge-cases.
The problem with `link-click`s is that early on, the browsers did not implement very clean logic.
But, still people used it. They had little choice. And thus today, these dirty little secrets still
linger around the platform and require our attention and support from time to time.

Two such dirty little secrets concern getting the actual `href` value that a browser will navigate to.
You are likely very rarely going to encounter these edge-cases anymore, but as you might happen to be so
unfortunate or careless, it is best to ensure that ones custom, composed events do handle them properly.
That way, you can solve them once and for all in a custom, composed event! (Hehehe, yes, you got me! 
I am slightly overselling the point here;)

Dirty little secret number one is: the link string value of an SVG `<a>` being clicked is 
its `.href.animVal`, and not just its `.href` property.

Dirty little secret number two is: if you click on an `<img ismap>` element inside a `<a href>` element,
then the offset x and y value of the pointer when you clicked it will be added as a suffix to the end
of the link on the form of "?x,y".

That is it. As with all dirty little secrets, they are not so bad you get them all out in the open.
`<a href>` has been around a little, but it wasn't as bad as you had feared. Phuu!

So, in order to properly `getHref()` from a `link-click`, we need to update the function that retrieves 
it slightly, like so:

```javascript
function getLinkHref(link, click){
  //dirty little secret nr 1: SVG
  if (link.href.animVal) 
    return link.href.animVal;    
  //dirty little secret nr 2: <img ismap>
  if (click.target.nodeName === "IMG" && click.target.hasAttribute("ismap"))
    return link.href + "?" + click.offsetX + "," + click.offsetY;        
  return link.href;
}
```

Put together, this yields a full custom, composed `link-click` event that takes all the headache out of
link-click-navigation:

```javascript
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
```

## Demo: Full `link-click` navigation

```html
<script>
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
</script>

<ul>
  <li><a href="https://i.am.normal.com/">normal link</a></li>
  <li>not a link</li>
  <li><a href="https://ismap.dirtylittlesecret.com/"><img ismap src="some picture" alt=""></a></li>
  <li><svg><a href="https://svg.dirtylittlesecret.com/"></a></svg></li>
</ul>

<script>                                                                      
window.addEventListener("click", function(e){alert(e.type + ": " + e.target.id);});
window.addEventListener("link-click", function(e){alert(e.type + ": " + e.getHref());});

//micro router that just blocks everything
window.addEventListener("link-click", function(e){
  e.trigger.preventDefault();
});
</script>
```

## References

 * 
                                                                            