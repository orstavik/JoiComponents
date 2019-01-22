# Pattern: TakeNote

Mark my words. And take note. These two expression basically mean "what I am saying now will 
be important in the future, so you should make a physical or mental note of it." 
They put an expectation on the listener to remember it. 
And it is implied the listener will need this particular piece of information to complete some
future task and/or to fully understand a future statement that builds on this premise.

When composing events that are triggered by multiple events, not only a single, 
you must remember the *state* of the primary or preceding trigger events.
In the most basic example, such state can be simply that a previous event has occurred. 
In such instances, the state data can often be preserved implicitly.
However, other data such as previous trigger events' target, timeStamp, pointer coordinates,
and/or other event details, cannot be preserved implicitly, but require the event triggering function
to maintain state data.

## Example: `triple-click`

As an example of how to kick ass and take notes in event composition, we will implement a simple
`triple-click` event. A triple click are three clicks done within 600ms, 
not overlapping another triple click.
It has, of course, three trigger events. All clicks. But, to find out if a click is the third 
and final trigger, the event needs to preserve the state of the previous click events.
I do it like this:

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {   
  composedEvent.preventDefault = function () {                  
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              
  target.dispatchEvent(composedEvent);                   
}

//event state
var tripleClickSequence = [];
function updateSequence(e) {
  tripleClickSequence.push(e);
  if (tripleClickSequence.length < 3)
    return;
  if (tripleClickSequence[2].timeStamp - tripleClickSequence[0].timeStamp <= 600){
    var result = tripleClickSequence.map(function(e){return e.timeStamp});
    tripleClickSequence = [];
    return result;
  }
  tripleClickSequence.shift();
}


window.addEventListener(
  "click", 
  function(e) {
    var tripple = updateSequence(e);
    if (!tripple)
      return;
    dispatchPriorEvent(e.target, new CustomEvent("tripple-click", {bubbles: true, composed: true, detail: tripple}), e);
  }, 
  true
);
```

Put together in a demo, it looks like this:

```html
<script>
function dispatchPriorEvent(target, composedEvent, trigger) {   
  composedEvent.preventDefault = function () {                  
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              
  target.dispatchEvent(composedEvent);                   
}

//event state
var tripleClickSequence = [];
function updateSequence(e) {
  tripleClickSequence.push(e);
  if (tripleClickSequence.length < 3)
    return;
  if (tripleClickSequence[2].timeStamp - tripleClickSequence[0].timeStamp <= 600){
    var result = tripleClickSequence.map(function(e){return e.timeStamp});
    tripleClickSequence = [];
    return result;
  }
  tripleClickSequence.shift();
}


window.addEventListener(
  "click", 
  function(e) {
    var tripple = updateSequence(e);
    if (!tripple)
      return;
    dispatchPriorEvent(e.target, new CustomEvent("tripple-click", {bubbles: true, composed: true, detail: tripple}), e);
  }, 
  true
);
</script>

<div id="one">single click me</div>
<div id="two">double click me</div>
<div id="three">tripple click me</div>
<div id="trouble">single, double and tripple click me</div>

<script>
document.querySelector("#one").addEventListener("click", function(e){
  e.target.style.background = "red";
});
document.querySelector("#two").addEventListener("dblclick", function(e){
  e.target.style.background = "orange";
});
document.querySelector("#three").addEventListener("tripple-click", function(e){
  e.target.style.background = "green";
});
document.querySelector("#trouble").addEventListener("click", function(e){
  e.target.style.background = "red";
});
document.querySelector("#trouble").addEventListener("dblclick", function(e){
  e.target.style.background = "orange";
});
document.querySelector("#trouble").addEventListener("tripple-click", function(e){
  e.target.style.background = "green";
});
</script>
```

## Discussion: Deep state data in composed events

There is one aspect of the TakeNote pattern that is of most interest: it stores state.
This should raise some red flags, so let us look at them: 

1. State stored in a variety of places are a source of bugs. 
   The state may be changed from many different sources, and 
   changes of that state may alter other functionality.
   
   However, deep state in event trigger functions are not likely to cause bugs in this manner.
   Event trigger functions are clearly delineated.
   First, their state should not be accessible from others,
   except via a strictly defined input interface that is the trigger events.
   Second, although the trigger events' propagation and defaultAction *could* be stopped in certain 
   states of the event trigger function, the event trigger function itself should not directly alter the
   state of the app. (Listeners for the composed event likely will of course, but they are not in the 
   domain of this deep state.)
   Thus, while care should be taken *not* to let the state of the trigger function be accessible 
   from outside, and to have the trigger functions *not* directly alter the state of the app
   (this highlights how the defaultAction and the propagation property of an event is part of an apps state),
   deep state in composed events are mostly bug-benign.
  
2. State stored in a variety of places can be a source of memory leaks.
   If you have a deep state that hoards data for some purposes, and 
   then does not readily release it, then you might incur memory leaks.
   
   Again, the deep state of event trigger functions are not likely to cause such bugs.
   Deep state event trigger functions do well in storing only the events themselves.
   The event objects are filled with some values for such data as timeStamp and x and y coordinates 
   for mouse, touch and pointer events. todo Target. If there are large, memory-affecting data
   in an event, that data is normally stored behind a getter.
   The event getters usually solve the memory leak problem of preserving the event, but 
   it also can cause headaches for the developer of composed events who does not have a memory leak issue,
   but instead needs to access data in primary trigger events that are kept behind a getter.
   
   tomax: we need to check this out! which data are behind getters in events? Is target behind a getter?


