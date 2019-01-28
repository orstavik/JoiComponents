# Pattern: EventSettings

A big benefit of EarlyBird composed events is that they are global. You can add one event listener per
event type, and then apply that event to as many DOM elements as you would like.
However, sometimes, you need make adjustments to the event. You need to describe some EventSettings.

DOM Events might require adjustments on a per-element, per-sequence, per-app, or per-user basis.
The per-element and per-sequence settings are local: they are associated with one particular DOM element.
At other times, you wish to adjust a DOM Event to a certain app or user: these EventSettings would
be global to the whole DOM.

EventSettings can be both global and local:
 
 * Global event settings apply to all instances of an event, regardless their target element.
   A certain game might desire a more sensitive `swipe` gesture, and so the `swipe` gesture 
   needs to be set globally. 
   
 * Local event settings apply only to certain instances of an event, described by the event's target.
   A reset button might require an extra long 3sec press to activate, 
   while a confirm button require a shorter 1sec press to fire.
   While otherwise identical, the same long-press event could be used in both instances, 
   only differentiated by a per-element, local setting for one or both buttons.
   
## Repetition: WhereTo EventSettings?

As described in the introduction chapter, DOM Events can be controlled from three different places:
HTML, JS, and CSS. 

To specify event settings from CSS would give all developers the most flexibility. 
But as previously discussed, CSS properties cannot be efficiently read before each event dispatch, 
at least not yet, and so CSS is out.

We could choose JS properties on for example the `window` object for global EventSettings and JS 
properties for local EventSettings per element. But JS properties are not accessible from neither
HTML nor CSS, so while this would give good developer ergonomics from a JS only viewpoint, 
it would yield poor developer ergonomics for the front end team as a whole.

Thus, EventSettings should be controlled via HTML attributes.  

## EventSettings as HTML attributes

To control the behavior of a composed event via HTML attributes is done by:
1. adding attributes to a global or local HTML element in the DOM, and 
2. when the event primary event triggers, search for those attributes.

The **global** HTML element for DOM Events is `<html>`, the main root element of any HTML document. 
To specify a global EventSetting for a custom DOM Event for all the instances of this event in a DOM,
an HTML attribute can be added to this `<html>` element.

To specify the custom DOM Event attribute can be done directly on the `<html>` element or indirectly
via JS setAttribute like so:
```html
<html my-event-setting1="do"></html>
<script>
document.querySelector("html").setAttribute("my-event-setting2", "your");
document.children[0].setAttribute("my-event-setting3", "thing");
</script>
```

And in the custom DOM Event trigger function, to read it simply do:

```javascript
document.children[0].getAttribute("my-event-setting");
```

The benefit of using attributes on the `<html>` element is that:
1. it fits: a *global* setting specifying behavior in the DOM as a whole is connected to 
   the global HTML element representing the DOM as a whole.
2. it *is* controllable from HTML and JS (assuming you have control over the HTML element).

The drawback of using attributes on the `<html>` element is that it adds overhead to the HTML document.
This can lead developers to (mistakenly?) add settings as JS near the end of the document instead.

Using global attributes like this also illustrate the use of the DOM as app state.
The DOM is a state representation - competing with single state objects in JS.
A more thorough discussion on different forms of state in a web app I will do in JoiState,
but I will mention here that DOM Event settings should be done as HTML attributes in the DOM because
the developer could compose a web page using only HTML template and this custom DOM Event, with no JS.
If a single state was used to store EventSettings, then JS would have to be used to control it.
We want to make it possible for HTML and custom DOM Events to be composeable without JS.
Whenever such a "independent-of-JS" need arises, the DOM is likely the place to store such state
(Within reason of course, we don't have to remain independent of JS at all times and at all cost.).

**Local** EventSettings are handled in the same way as global EventSettings. The main difference between 
global and local EventSettings are that they will be attached to the `target` element *of the custom 
composed DOM Event*. Local EventSettings are not associated with the target element of the trigger event, 
unless the trigger and custom DOM Events have the same `target` element. 

Local EventSettings could be applied to a group of elements via a parent of the `target` element 
of the custom composed DOM Event. We could think of this as a half-global, half-local EventSetting.
If several elements within a section of the page all needed to specify the same EventSetting, 
this would enable the developer to do so for the section in question, instead of either globally for 
all sections which could cause conflicts with the needs of other sections, or locally for all elements,
which would lead to redundant code.
Still. I do not recommend such parent-element-EventSettings. First, as you template develops, 
such half-way homes can be filled with lots of stuff that gets forgotten and overlooked elsewhere. 
Second, it would require the event trigger functions to traverse the full parent chain to *search for* 
potential EventSettings. Third, it makes the custom DOM Event much harder to debug as its behavior could
be controlled from many different HTML elements, and not just the global `<html>` element or the `target`
element.

## Example: `long-press` with global and local `long-press-duration`.

In this example we will set both global and local EventSettings.
We first check to see if there are local EventSettings attached, and then global EventSettings, and 
then a default value.

The example is our custom `long-press` DOM Event, but this time we want to specify how long the
`long-press` must be held before our custom DOM Event is dispatched. We add an EventSetting 
`long-press-duration`. This EventSetting can be set both locally and globally: the event trigger function
will first check for a local `long-press-duration`, then a global `long-press-duration`, and then
simply use 300ms as a default fallback. 

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

var primaryEvent;

function resetSequenceState(){
  primaryEvent = undefined;                                    
  window.removeEventListener("mouseup", onMouseup);            
  window.removeEventListener("mouseout", onMouseout);          
}

function onMousedown(e){                                       
  if (trigger.button !== 0)                                    
    return;
  if (primaryEvent)                                            
    resetSequenceState(); 
  primaryEvent = e;                                            
  window.addEventListener("mouseup", onMouseup);               
  window.addEventListener("mouseout", onMouseout);             
}

function onMouseup(e){                                         
  if (e.target !== primaryEvent.target)
    return resetSequenceState();
  var duration = e.timeStamp - primaryEvent.timeStamp;
  var longPressDurationSetting = 
    e.target.getAttribute("long-press-duration") ||             //[1]
    document.children[0].getAttribute("long-press-duration") ||
    300;
  //trigger long-press iff the press duration is more than the long-press-duration EventSetting
  if (duration > longPressDurationSetting)       //[6]
    e.target.dispatchEvent(new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         
}

var onMouseout = function (e){                                  
  //filter to only trigger on the mouse leaving the window
  if (trigger.clientY > 0 && trigger.clientX > 0 && trigger.clientX < window.innerWidth && trigger.clientY < window.innerHeight)
    return;                                                     
  primaryEvent.target.dispatchEvent(new CustomEvent("long-press-cancel", {bubbles: true, composed: true}));
  resetSequenceState();                                         
}

window.addEventListener("mousedown", onMousedown);              
```

1. `long-press-duration` EventSetting is acquired at the end of the EventSequence. This is the simplest
   way to do it here. However, most often, EventSettings are read from the DOM at the beginning of the 
   EventSequence and then stored in the state of the EventSequence as described in pattern TakeNote.

## References

 * [layout problems with HTML5 drag'n'drop](https://kryogenix.org/code/browser/custom-drag-image.html)
                                                                            