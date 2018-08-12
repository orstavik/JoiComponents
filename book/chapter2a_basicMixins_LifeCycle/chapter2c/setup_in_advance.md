# Setup: In advance

> TLDR: place a call to `setupCallback()` as an event listener or in a task que.
> Make sure `setupCallback()` is still always called before `connectedCallback()` 
> but never twice.

## Problem: How to prepare element setup ahead of critical tasks?

Sometimes during the running of an app, heavy tasks might cause the app to lag.
These tasks might be triggered by user events such as `touchmove` or 
system events such as database updates.
These tasks often occurs when app responsiveness is critical, 
such as during user interaction or live updates from the server.

The prime "time thief" in many such tasks is the JS setup and connection to the DOM
and the ensuing layout, style and paint calculations the browser needs to do in response to setup and DOM connection. 
But, often, the browser may have spare resources and extra time in advance of such tasks,
and thus as developers the solution to such a problem is to prepare element setup ahead of a critical task.
So how best to achieve this?

## Pattern: make new DOM elements outside the viewport

To just trigger the `setupCallback()` of an element in advance is likely not going to do you much good.
The most resource intensive processing occurs when the new elements are added to the DOM 
as this trigger the calculation of both CSS styles and layout of the new elements.
So, in order to prepare elements in advance, you likely desire to:
1. trigger `setupCallback()`,
2. connected the new elements to the DOM,
3. calculate CSS style,
4. calculate layout of the elements, but
5. avoid triggering paint as this might cause the screen to flicker. (todo, check the validity of this problem??)

This is an "old" problem with a simple, existing solution.

1. To setup an element up to and including layout calculation,
the new element is created and placed in the DOM *outside* the viewport.
As the element is placed in the DOM, the browsers *must* calculate the CSS styles and the layout of 
the new elements in order to assess whether or not it needs to paint it on the screen.
But, as the new elements are positioned outside of the viewport, browsers (todo check this??) 
will not trigger a new paint (and with it potential flickering on the screen) as nothing 
inside the viewport has changed.

2. After the element has been prepared, when it is needed, it is not added, but instead *moved* in the DOM.
The closer the element is its final form in both position, DOM placement and style, the more of the 
previous style and layout calculations the browser can reuse.

3. The task of preparing elements can be added when the browser has idle capacity,
cf. `requestIdleCallback()`. 


## Example: PreppedElement

```html
<style>
#outside {
  position: fixed;
  bottom: 0;
  right: 0;
}

framed {
  width: 100px;
  height: 162px;
  border: 10px solid black;
  border-bottom-width: 14px;
}
</style>
<div id="outside"></div>                       <!--[1]-->

<script>
function makeMyElement(id){                      //[2]
  const img = document.createElement("img");
  img.src = "https://google.com/logo.png";
  img.id = id;
  img.classList.add("framed");
  return img;
}

function prepareMyElement(id){                   
  document.querySelector("#outside").appendChild(makeMyElement(id));
}

function reuseMyElement(preppedID){
  let el;
  if (preppedID) 
    el = document.querySelector("#outside > #" + preppedID);
  else 
    el = makeMyElement("unprepared123");
  document.querySelector("body").appendChild(el);  
}

let prepped;
setTimeout(function(){prepped = prepareMyElement("prepare123");}, 2000);
setTimeout(function(){reuseMyElement(prepped)}, 3000);
</script>
```

1. First the place of prepping the elements are set up. 
This is styled to always be outside of the viewport in the app.
2. You make a function that will:
    1. produce the elements you need to add to the DOM,
    2. make and add such elements to the DOM in advance,
    3. move elements from preparation area to its final destination, 
    or make a new element if no prepared elements exists.
3. que the prepElement function when it is suitable 
4. add the prepped element, or a new element if no prepped element is available, 
where and when you need it.

## Reference
 * MDN requestIdleCallback()
 * find references on existing solutions for preparing elements while placing outside of the viewport.
 * try to find documentation that it is smart to place the "preparation area" in the same document, 
 so as to avoid document adoptation.

