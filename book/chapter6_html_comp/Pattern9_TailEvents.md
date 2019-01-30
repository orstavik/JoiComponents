```html
<form action="https://nrk.no">
  <button type="submit">
    <h3 id="a">Alpha</h3> <h3 id="b">Beta</h3>  
  </button>
</form>
<script> 
  let button = document.querySelector("button");
  let form = document.querySelector("form");
  let a = document.querySelector("#a");
  let b = document.querySelector("#b");
  //mousedown
  a.addEventListener("mousedown", function(e){
    console.log("mousedown - alpha");
    //e.preventDefault();
  });
  b.addEventListener("mousedown", function(e){
    console.log("mousedown - beta");
    //e.preventDefault();
  });
  button.addEventListener("mousedown", function(e){
    console.log("mousedown - button");
    //e.preventDefault();
  });
  form.addEventListener("mousedown", function(e){
    console.log("mousedown - form");
    //e.preventDefault();
  });
  window.addEventListener("mousedown", function(e){
    console.log("mousedown - window");
    e.preventDefault();
    e.stopPropagation();
  });
  //mouseup
  a.addEventListener("mouseup", function(e){
    console.log("mouseup - alpha");
    //e.preventDefault();
  });
  b.addEventListener("mouseup", function(e){
    console.log("mouseup - beta");
    //e.preventDefault();
  });
  button.addEventListener("mouseup", function(e){
    console.log("mouseup - button");
    //e.preventDefault();
  });
  form.addEventListener("mouseup", function(e){
    console.log("mouseup - form");
    //e.preventDefault();
  });
  window.addEventListener("mouseup", function(e){
    console.log("mouseup - window");
    e.preventDefault();
    e.stopPropagation();
  });
  //click
  a.addEventListener("click", function(e){
    console.log("click - alpha");
    //e.preventDefault();
  });
  b.addEventListener("click", function(e){
    console.log("click - beta");
    //e.preventDefault();
  });
  button.addEventListener("click", function(e){
    console.log("click - button");
    //e.preventDefault();
  });
  form.addEventListener("click", function(e){
    console.log("click - form");
    //e.preventDefault();
  });
  window.addEventListener("click", function(e){
    console.log("click - window");
    //e.preventDefault();
  });
  //submit
  button.addEventListener("submit", function(e){
    console.log("submit - button");
    //e.preventDefault();
  });
  form.addEventListener("submit", function(e){
    console.log("submit - form");
    //e.preventDefault();
  });
  window.addEventListener("submit", function(e){
    console.log("submit - window");
    e.preventDefault();
  });
</script>
```

#Pattern: TailEvents

## Unstoppable Recorded TailEvent: `click`
The click event is an Unstoppable Recorded TailEvent.
The click event is dispatched *after* a preceding event such as mouseup.
This makes the click a TailEvent of mouseup.
But, the mousedown event on its own is not enough to cause a click event.
In order for a click event to happen, a mousedown event must also first be preceded by a mousedown event *on the same element*. This means that the function that creates click events needs to record the target chain of mousedown events to assess if and on which targets the Recorded click event should be dispatched from.

The click event is Unstoppable from the preceding events.
The developer cannot stop the browser making click events from listening to preceding
mousedown or mouseup events and then calling `.stopPropagation()` or `.preventDefault()`
on one or both of them.

The click event is also TargetSelective. It will not simply reuse the target of the
mouseup event, but instead use the event detail of both the recorded mousedown event and the triggering mouseup event to establish its target, ie. the lowest element in the DOM that are part of both events target chains. 

To test click events' TargetSelection behavior, you can mousedown on "Alpha", move the mouse while holding the left mouse button down and then mouseup on "Beta". This will trigger a click from the button element. If you do a simple click with mousedown and mouseup both on "Alpha", that will create a click event with "Alpha" its target.

click events TargetSelection behavior is most commonly used when a user wants to cancel his or hers click after they have already pressed the mouse down on a button or link. By moving the mouse or finger away from the mousedown target so to make the mouseup event be triggered away from the interactive element, the click event is not dispatched on the interactive element and thus the UIX action cancelled.

Att! The Unstoppable `click` cannot be programmatically composed using a separate mousedown and mouseup events. The example below illustrates this:

```html
<div id="a">
  Alpha
</div>
<script>
  let a = document.querySelector("#a");
  
  a.addEventListener("mousedown", function(e){e.target.style.background = "red"});
  a.addEventListener("mouseup", function(e){e.target.style.color = "green"});
  a.addEventListener("click", function(e){e.target.style.border = "20px solid blue"});

  a.dispatchEvent(new MouseEvent("mousedown", {bubbles: true, cancelable: true}));
  a.dispatchEvent(new MouseEvent("mouseup", {bubbles: true, cancelable: true}));
  //no click event will be dispatched on a.
  
  //The alhpa will be in green text on red background, but without a blue border. 
</script>
```

## Preventable Pure TailEvent: `submit`
The submit event is a Preventable Pure TailEvent.
The submit event is dispatched *after* a preceding click event.
This makes the submit event a TailEvent of click.

The submit event is a Pure TailEvent because the function that generates the submit event based on the click event does not need any other data than the click event itself as input. Based purely on the click event and the target chain of the click event this function can evaluate if and on which target element the submit event should be dispatched 

The submit event is Preventable from the preceding click event.
By first adding an event listener on the preceding click event and then secondly calling
or `.preventDefault()`, the developer can stop the browser making the submit event.
Att! Calling `.stopPropagation()` and cancelling bubbling on the click event will not stop the submit event being dispatched (cf. the antipattern: TrojanHorseDefaultAction). 

The submit event is also TargetSelective. It will not simply reuse the target of the
click event, but instead find the `< form>` element in target chain that adds the submit event behavior to the DOM. 

To test submit events' Preventable behavior, you can call `.preventDefault()` on the preceding click event. This will stop the browser from dispatching any submit event, thus also cancelling the browsing action. To stop the default browsing action of the submit event only, call `preventDefault()` on the submit event itself.

`focus` is another example of a Preventable Pure TailEvent.
The `focus` event is triggered by `mousedown` event, and 
if `.preventDefault()` is called on the `mousedown` event, that 
will cancel the `focus` event from also being dispatched on that element.

## References:

 * [about default browser actions](https://javascript.info/default-browser-action)