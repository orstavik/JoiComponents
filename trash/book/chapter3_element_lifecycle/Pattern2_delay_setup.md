# Setup: Delayed/postponed

> Postpone: *post* "after" + *ponere* "put, place"
> 
> Delay: *de-* "away, from" + *laier* "leave, let"
> 
> Defer: *de-* "down, away" + *ferre* "to carry"

This problem only concerns the construction of HTML elements from parsing the main HTML document.
Delaying the construction of elements via JS and from the parser via `innerHTML`
is simply done by directly postponing the JS function that creates the elements instead.

## Problem: display above the fold content asap.

```html
<div style="width: 100vw; height: 100vh;">                                  
  You see me immediately                               
</div>

<below-the-fold>
  You must scroll to see me
</below-the-fold>
```

The above example is a very small HMTL document with two elements.
First, the `<div>` fills the entire screen.
Second, a custom element `<below-the-fold>` that the user must scroll down to see.
The problem: we want to free up resources (CPU and memory) 
in the browser so that it will make and display the first and critical `<div>`
as soon possible.

But it is difficult to promote or actively prioritize some HTML elements.
Instead, we must try to do the opposite: demote and delay non-critical content.
By delaying content below the fold, 
we let the browser concentrate on the critical content above the fold.

## Problem 2: How to delay content below the fold?

To delay a HTML element, we want to:
1. avoid calculating style, layout nor render the element, 
   to enable the browser to quicker paint the critical elements above;
2. avoid calculating style, layout nor render any of the *children* elements either,
   for the same reason;
3. not trigger the `connectedCallback()` methods of neither the root nor children elements,
   as these methods might cause both heavy network and computing processes.

A couple of HTML element types has means to delay it:
 * The `<script>` element's *defer* and *async* enable the developer to flag scripts to 
   be delayed/postponed: `<script defer src="myScript.js">`.
 * Using a [JS `onload` punchline](https://www.filamentgroup.com/lab/async-css.html), 
   activation of stylesheets can be delayed within the tag:
   `<link rel="preload" href="myStyle.css" onload="this.rel = 'stylesheet'">`.
   (The browser automatically does similar steps like this to delay images, audio and video.)

However. Both of the mechanisms above *connects the defered/preloaded elements to the DOM immediately*.
And. Neither the `defer` nor `preload` attributes are available for normal and custom HTML elements.
And. Due to these HTML attributes semantics, these attributes would not apply to children of an element.
Thus. Custom elements and the bulk of HTML elements have no such attributes or direct
use of attributes that can delay/postpone/defer them and their children directly.

## Anti-patterns: delay elements using CSS or shadowDOM

Traditional tricks such as marking an element with the style `display: none` or `visibility: hidden`
or the HTML attribute `hidden`, will:
 * yes, hide the element and its children from view 
 (except descendants of a `visibility: hidden` element that is marked `visibility: visible`);
 * yes, in the case of `display: none` free the browser from calculating layout; but 
 * no, always trigger the `connectedCallback()` methods of both the root and children elements.

Another trick, to put children elements inside a custom element with a shadowDOM and 
then delay adding a `<slot>` element in that shadowDOM will:
 * yes, hide the children elements from view 
   (although I am not sure how much of the style and layout work the browser will delay); but
 * no, still trigger the `connectedCallback()` methods of both the root and children elements.

Only one alternative remains...

## Pattern: `replaceChild(template.content, template)`

[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) says it perfectly:

    The HTML Content Template (<template>) element is a mechanism for holding client-side
    content that is not to be rendered when a page is loaded but may subsequently be 
    instantiated during runtime using JavaScript.
    
    Think of a template as a content fragment that is being stored for subsequent use 
    in the document. While the parser does process the contents of the <template> element 
    while loading the page, it does so only to ensure that those contents are valid; 
    the element's contents are not rendered, however. 

By wrapping an HTML element, and its siblings and children if needed, 
inside a `<template>` element, the browser will:
 * yes, perform no style, layout nor rendering calculations; and
 * yes(!), NOT connect any of the elements inside the template to the DOM!

Then, when needed, the template element can then be replaced with its own `content`.
In our example, the pattern looks like this:

```html
<div style="width: 100vw; height: 100vh;">                                  
  You see me immediately                               
</div>

<template id="templateTrick">                             <!--[1]-->
  <below-the-fold>
    You must scroll to see me
  </below-the-fold>
</template>                                               <!--[1]-->
<script>                                                    //[2]
  setTimeout(()=>{                                          //[3]
    const c = document.querySelector("#templateTrick");     //[4]
    document.body.replaceChild(c.content, c);               //[4]
  }, 3000);                                                 
</script>                                                 <!--[2]-->
```
1. The non-critical content `<below-the-fold>` is wrapped in a template.
2. A script is added that::
3. at some later point will
4. replace the template wrapper DOM node with its own `.content`.

## Extra tip: `block`-style the template node

To avoid having content jump **down**, which can frustrate the user,
style the `<template>` node as a block that is big enough.
Depending on:
1. the duration of the delay,
2. the content added,
3. how dynamic this content is,
4. what type of content below (or above) is shifted

can affect how you wish to reserve space.
But, a general tip is that content jumping up into view is likely to be better
perceived by the user than content in view (that the user is looking at trying to read) 
jumping down out of view (thus "escaping" the users hunt for information).

Below is the same example above, extended with the `block`-style tip, 
and with a custom element implementation to illustrate when the children elements
of the `<template>` node are connected to the DOM.
```html
<div style="width: 100vw; height: 100vh;">
  You see me immediately
</div>
<template id="templateTrick" style="display: block; height: 100vh">
  <below-the-fold style="display: block; height: 100vh">You must scroll to see me</below-the-fold>
</template>
<div>
  You will start reading me if you scroll before 3s
</div>
<script>
  setTimeout(()=>{
    const c = document.querySelector("#templateTrick");
    document.body.replaceChild(c.content, c);
  }, 3000);
</script>

<script>
  class BelowTheFold extends HTMLElement { 
    connectedCallback(){
      console.log("connecting below-the-fold");
    }
  }
  customElements.define("below-the-fold", BelowTheFold); 
</script>
```

## Reference

* [delay `<link rel="stylesheet">`](https://www.filamentgroup.com/lab/async-css.html)
* [delay `<script>`](https://bitsofco.de/async-vs-defer/)
* [Etymologi: "delay"](https://www.etymonline.com/word/delay)
* [Etymologi: "postpone"](https://www.etymonline.com/word/postpone)
* [MDN: `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)