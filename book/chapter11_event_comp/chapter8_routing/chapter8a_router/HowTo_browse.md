# HowTo: browse

## The hypothetical "browse" event

In this chapter we will invent a term: browse event.
A browse event is a an event that can cause [the browser to browse](https://html.spec.whatwg.org/multipage/browsing-the-web.html).

In practice, two native events are browse events: 
 * [`click`](https://developer.mozilla.org/en-US/docs/Web/Events/click) ([spec.](https://html.spec.whatwg.org/multipage/webappapis.html#fire-a-synthetic-mouse-event)) 
 * [`submit`](https://developer.mozilla.org/en-US/docs/Web/Events/submit) ([spec.](https://html.spec.whatwg.org/multipage/forms.html#dom-form-submit))

However, not all `click` and `submit` events cause the browser to browse, and 
here we will describe how and when browse events occur and what they look like.

> Att! There exists no such thing as a real "browse event".
> "Browse events" is just a made-up name used to describe `submit` and (a subset of) `click` events.

## Which elements can browse?

There are three different HTML/SVG elements (link elements) that can trigger click browse events:
 * [`<a href="...">`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a) ([spec.](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)) 
 * [`<area href="...">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area) ([spec.](https://html.spec.whatwg.org/multipage/image-maps.html#the-area-element))
 * [SVG `<a xlink:href="...">`](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xlink:href) 

`submit` events are triggered by the [`<form>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) ([spec.](https://html.spec.whatwg.org/multipage/forms.html#the-form-element))

The next chapters list these link elements and describe how and when they trigger browse events.

## What is browsing?

There are two forms of browsing: 
 * **External browsing** are the normal browsing action of going from one web page to another.
   External browsing is triggered by links to another document, that may or may not reside on the same server.
   External browsing is triggered by clicks on links with a different server, path, file and/or query and
   all submit events (although the browser will double check with the user if he/she `post`s the same data 
   twice in a row).
   External browsing causes the browser to unload the current DOM and load a new DOM. 
 
 * **Internal browsing** is jumping to a new location *within the same page*.
   Internal browsing is triggered by links that only alters the hash location of the current address.
   Internal browsing does **not** cause the browser to neither unload the current DOM nor load a new DOM. 

## Implementation tips

//todo move this to another location

 * To identify and filter `click` events for potential browse events is a pure function.
   You do not need any extra information apart from the event data itself to recognize potential browse events. 
   
 * However, to interpret the intended goal of a browse event, you need the information about the base URL 
 (cf. `<base>`),
   the location from which relative and partial links will be completed.
   

 * `.preventDefault()` must be called synchronously when the navigating event is first caught.
If the processing of the navigating event The act of blocking the native router from Take care Avoid testing navigation events in Mocha.
as it is difficult to call `.preventDefault()` in the right locations.
  When making unit tests for navigation events, do so without a unit test framework.


## References

 * 
 * [MDN: `MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
 * [MDN: `KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
 * [MDN: `<a>` in SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a)
 * [MDN: `<area>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area)
 * [WHATWG: `<a>` in HTML](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)
 * [MDN: `<a>` in SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a)
 * [Whatwg: Interactive elements](https://html.spec.whatwg.org/multipage/interactive-elements.html)
 * [MDN: `.focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
 
 * [Nested links](https://www.kizu.ru/nested-links/)
// * [w3.org: Interactive content](https://www.w3.org/TR/html5/dom.html#interactive-content)


## w3 References
1. https://html.spec.whatwg.org/#handler-onkeypress  //relocate on the w3
2. https://drafts.csswg.org/cssom-view/#extensions-to-the-mouseevent-interface  // mouse event on the drafts.csswg.org
3. https://svgwg.org/svg2-draft/struct.html#SVGElement  // svg technical documentation
4. https://svgwg.org/svg2-draft/struct.html#UseElementHrefAttribute // svg href
5. 
6. 
