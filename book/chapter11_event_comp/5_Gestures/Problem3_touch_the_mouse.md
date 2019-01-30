# Problem: TouchSimulatesMouse

When using a handheld device, you have only your finger to control the browser, and no mouse.
However, many web sites are made for desktop browsers and mouse only. 
This was especially true when the mobile browser was in minority. 
So, the mobile browsers needed the finger to be able to not only trigger touch events, 
but also mouse events, in order for the mobile users to control mouse-only web sites.
To implement this, mobile browsers made the touch actions trigger *both touch and mouse events*.
 
## Problem: `touchstart` also trigger `mousedown`

In mobile browsers such as Chrome on android, when you touch an element on the screen with your finger,
this action will trigger first a `touchstart` event and then a `mousedown` event.
This applies similarly to `touchend` and `mouseup`.
The example below illustrates this problem.

```javascript
const div = document.createElement("div");
div.style.width = "100px";
div.style.height = "100px";
div.style.background = "red";

document.body.appendChild(div);

div.addEventListener("touchstart", () => div.innerText += "touchstart,");
div.addEventListener("mousedown", () => div.innerText += "mousedown,");
//when you touch the red block, its inner text should be "touchstart,mousedown,".
```

## Pattern: TouchstartStopMousedown

Often, the same event handlers need to react to both touch on mobile and mouse on desktop similarly, 
but not identically.
In such instances, the same event handler needs to listen for both `touchstart` and `mousedown` 
to initiate its action.

However, a user's touch on a handheld device triggers both a `touchstart` and `mousedown` event.
This is redundant and likely to cause a conflict in the response.
To avoid such conflicts , only one of the events should cause a reaction.
And since touch might need to be handled differently than mouse on a mobile, 
the touch events are to be processed and the mouseevents are to be ignored.

Luckily, the added `mousedown` event triggered as a response to a touch always
come *after* the `touchstart` event on mobile browsers.
This means that if `touchstart` disables subsequent triggers on `mousedown`,
no conflicts should arise.
As browsers can listen for both mouse and touch events on the same browsers,
the `mousedown` event listener should not be removed, only disabled while the touch event sequence is active.

The example below illustrates how to temporarily disable mouse events when touch events are active.

```javascript
let touchActive = false;
const div = document.createElement("div");
div.style.width = "100px";
div.style.height = "100px";
div.style.background = "blue";

document.body.appendChild(div);

div.addEventListener("touchstart", () => {
  touchActive = true;
  div.innerText += "touchstart,";
});
div.addEventListener("mousedown", () => {
  if (touchActive)
    return;
  div.innerText += "mousedown,";
});
//when you touch the blue block, its inner text should be "touchstart,".
```
