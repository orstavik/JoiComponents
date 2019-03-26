# Pattern: TemplateSwitcheroo

The TemplateSwitcheroo pattern describe how we can delay the construction of HTML elements 
in the main HTML document. The TemplateSwitcheroo pattern uses the features that elements 
instantiated inside a `<template>` element remains in their empty shell, template state until they 
are later used [cf. WhatIs: Upgrade](5_WhatIs_upgrade). 
The TemplateSwitcheroo can be used both:
1. statically for elements described in the entry-point HTML files, such as index.html, and 
2. dynamically for elements constructed in JS via `.innerHTML` on `<template>` elements.

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
in the browser so that it will construct and display the first and critical `<div>`
as soon possible.

But, we have no means to promote or actively prioritize some HTML elements.
Instead, we must try to do the opposite: demote/delay non-critical content.
By delaying content below the fold, 
we let the browser concentrate on the critical content above the fold.

To delay a HTML element, we want to:
1. avoid calculating style, layout nor render the element, 
   to enable the browser to quicker paint the critical elements above;
2. avoid calculating style, layout nor render any of the *children* elements either,
   for the same reason;
3. run as little as possible of the functionality in the 
   1. `constructor()`, 
   2. initial `attributeChangedCallback()` and 
   3. `connectedCallback()` methods 
   
   of neither the root nor children elements,
   as these methods might cause both heavy network and computing processes.

## Pattern: TemplateSwitcheroo

[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) says it perfectly:

    The HTML Content Template (<template>) element is a mechanism for holding client-side
    content that is not to be rendered when a page is loaded but may subsequently be 
    instantiated during runtime using JavaScript.
    
    Think of a template as a content fragment that is being stored for subsequent use 
    in the document. While the parser does process the contents of the <template> element 
    while loading the page, it does so only to ensure that those contents are valid; 
    the element's contents are not rendered, however. 

In the previous chapter [WhatIs: upgrade](5_WhatIs_upgrade), we saw how elements created inside a 
`<template>` element is only instantiated in temporary shell state. We will now use this native 
feature to demote and delay content. 

First, we wrap a group of HTML elements inside a `<template>` element.
For all the elements placed *under* the template, the browser will:
 * ONLY run the `super` constructor (of `HTMLElement`), and 
 * NOT run any custom element's `constructor()` (yes, it is a bit weird), 
 * NOT trigger the custom element's (observed) `attributeChangedCallback()`, 
 * NOT connect any elements to the DOM and trigger their `connectedCallback()`,
 * NOT trigger any `slotchange` events, and
 * NOT perform any style, layout or paint calculations for the elements.

Then, when needed, the template element can replace itself with its own `content`.

```html
<div style="width: 100vw; height: 100vh;">
  You see me immediately
</div>

<template id="temporaryTemplate">                         <!--[1]-->
  <below-the-fold>                                        <!--[2]-->
    You must scroll to see me
  </below-the-fold>
</template>
<script>
  const scrollSwitcheroo = function (e) {                        //[3]
    const c = document.querySelector("#temporaryTemplate");
    c.parentNode.replaceChild(c.content, c);               //[4]
    window.removeEventListener("scroll", scrollSwitcheroo);
  };
  window.addEventListener("scroll", scrollSwitcheroo);
</script>
```
1. The non-critical content `<below-the-fold>` is wrapped in a template.
2. A script is added that::
3. at some later point will
4. replace the template wrapper DOM node with its own `.content`.

## Extra tip: `block`-style the template node

Adding content dynamically on the page can cause content to jump **down** or **up** on screen, 
depending on both the content added and the user's scroll history. Such jumps are bad, they can
frustrate the user. Thankfully, such jumps can sometimes be avoided by having the `<template>` node 
reserve the space where it will be added. We do this by styling the `<template>` tag as a `block` 
with fixed `width` and `height`. 

Below is the same example above, extended with the `block`-style tip, 
and with a custom element implementation to illustrate when the children elements
of the `<template>` node are connected to the DOM.
```html
<div style="width: 100vw; height: 100vh;">
  You see me immediately
</div>
<template id="temporaryTemplate" style="display: block; height: 100vh">
  <below-the-fold style="display: block; height: 100vh">You must scroll to see me</below-the-fold>
</template>
<div>
  You will start reading me if you scroll before 3s
</div>
<script>
  setTimeout(()=>{
    const c = document.querySelector("#temporaryTemplate");
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

## Comments: other delaying strategies

A couple of HTML element types has other means to delay it:
 * The `<script>` element's *defer* and *async* enable the developer to flag scripts to 
   be delayed/postponed: `<script defer src="myScript.js">`.
 * Using a [JS `onload` punchline](https://www.filamentgroup.com/lab/async-css.html), 
   activation of stylesheets can be delayed within the tag:
   `<link rel="preload" href="myStyle.css" onload="this.rel = 'stylesheet'">`.
   (The browser automatically does similar steps like this to delay images, audio and video.)

However. Both of the mechanisms above *connects the defered/preloaded elements to the DOM immediately*.
Neither the `defer` nor `preload` attributes are available for normal and custom HTML elements.
Due to these HTML attributes semantics, these attributes would not apply to children of an element.

## Anti-patterns: delay elements using CSS

Traditional tricks such as marking an element with the style `display: none` or `visibility: hidden`
or the HTML attribute `hidden`, will:
 * yes, hide the element and its children from view 
   (except descendants of `visibility: hidden` elements that are marked `visibility: visible`);
 * yes, in the case of `display: none` free the browser from calculating layout; but 
 * no, always trigger the full `constructor()`, `connectedCallback()` and other custom element methods 
   of both the root and children elements.

## Anti-patterns: delay elements using dynamic `<slot>`

Another trick, to put children elements inside a custom element with a shadowDOM and 
then delay adding a `<slot>` element in that shadowDOM will:
 * no, the children elements will be hidden from view, but style and layout work will still be processed; and
 * no, always trigger the full `constructor()`, `connectedCallback()` and other custom element methods 
   of both the root and children elements.

## Reference

* [delay `<link rel="stylesheet">`](https://www.filamentgroup.com/lab/async-css.html)
* [delay `<script>`](https://bitsofco.de/async-vs-defer/)
* [MDN: `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)