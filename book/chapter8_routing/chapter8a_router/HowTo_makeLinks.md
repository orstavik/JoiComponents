# HowTo: make links

## Navigating events

A navigating event is any event that will cause the browser to load a new page.
In practice, a navigating event can be one of three native events: `click`, `keypress` and `submit`.
However, not all `click`, `keypress` and `submit` events cause the browser to navigate, and 
here we will describe how and when navigating events occur and what they look like.

There are four different HTML/SVG elements (link elements) that can trigger navigating events: 
`<a href>`, `<area href>`, and `<form>` from HTML and `<a xlink:href>` from SVG.
This chapter lists these link elements and describe how and when they trigger navigating events.

## `click` on an `<a href="...">` 

```html
<a id="one" href="#YesWeCan">Can we ever get enough of HTML examples?</a>

<a id="two" href="https://outside.com"><div style="border: 2px solid black">think</div></a>
```
In the above examples, first a `<a>`-element (link) is wrapped around a bit of text, ie. a text node.
Second, a link is wrapped around another HTML element, a `<div>`.

To navigate the user can click on the nodes inside the link with a pointer device, 
ie. the text or the div. 
This will generate a `click` event that bubbles upwards, 
passing shadowDom borders, but not `<iframe>` borders.
The `click` event's `target` is the innermost HTML *element* pointed to when clicking.
In the example above the `target` would be:
 * the `<a id="one">` element (as the text node is only an HTML node, and not an element), and 
 * the `<div>` element inside the `<a id="two">` element.

`<a>` elements cannot be wrapped *around* interactive elements such as `<button>`, `<select>`, 
other `<a>` elements.

`click` events can also be generated:
 * from JS script using either 
   * `HTMLElement.click()` or
   * `HTMLElement.dispatchEvent(new MouseEvent("click", {bubbles: true,cancelable: true}))`.
 * using a shortcut key specified with the `accesskey` attribute on an element 
   (for instance, `<a href="#down" accesskey="d">scroll down</a`> will trigger a `click` event
   when the user presses `alt`+ `d`.)

To identify which `click` events are navigating events, 
the browser must analyze all `click` events that has completed bubbling.
`click` events has completed bubbling when the event has either:
 * bubbled past the `window` object,
 * a `.bubbles` value of `false` (ie. `.stopPropagation()` has been called on it),
 * bubbled past the `document` object in an `<iframe>`, or
 * a `.composed` value of `false` and has bubbled past the next `shadowRoot` document of a custom element.

//todo verify that e.stopPropagation() does not cancel the navigation, only the propagation!!

When a `click` event has completed bubbling, 
the browser will examine the event to see if the `click` event:
1. has `.defaultPrevented` is false,
2. is from a left or middle mouse button click, ie. not a right context menu button click,
3. has no `shift` or `ctrl` key pressed, and
4. has a `target` who has an `<a href>` `parentNode` that comes before a link blocking element (such as `<body>`)(before).

If all these criteria are met, then the `click` event is considered a navigating event and will cause 
the browser to que a navigation task in the micro-task que. (or in the event loop?? todo Test this using messages).
This will cause the browser to load a new DOM.

## `click` on an `<a xlink:href="...">` in inline SVG documents

```html
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <a xlink:href="https://outside.com/the/box">
    <circle cx="5" cy="5" r="10"/>
  </a>
</svg>
```

When SVG elements are inlined into the HTML document, 
the user can click on SVG `<a xlink:href="...">` elements inside the SVG sub-document to 
trigger a navigating `click` event.
`click`s from SVG `<a>` elements function similar to `click`s from HTML `<a>` elements,
with the following exception:

1. The `href` attribute must be prefixed with `xlink:`, resulting in an `xlink:href` attribute.
   The `xlink:` prefix is deprecated, but as the plain `href` attribute is not supported in Safari 
   and older browsers, the `xlink:href` is the simplest means to provide cross-browser support.
   
2. The `rel` attribute is not supported in several browsers.
   
//todo check if the `href` works in Safari even though it is not supported.
//todo check if `rel` works even though it is not supported.
//todo verify that the xlink:href property populates the href property in all browsers.

3. The `<a xlink:href>` is a `parentNode` of the `click` event's `target` the same way as in HTML.
   But SVG `<a>` elements themselves differ from HTML `<a>` elements:
   1. SVG `.nodeName` properties are lowerCase while HTML `.nodeName` properties are upperCase.
   2. The HTML `<a>` element's `.href` property is a simple string.
   However, the SVG `<a>` element's `.href` property is an object containing two strings: `baseVal` and `animVal`.
   SVG `<a>` elements can animate their `.href` property, so the active link is always
   the SVG `<a>` element's `.href.animVal` (as opposed to simply `.href` in HTML).
   
4. For more about where `<a xlink:href>` can be placed in SVG documents, see [todo](max,find_a_tutorial here).

> Att! Links in SVG documents loaded from `<img src="something.svg" />` is not triggered by the browser.
> Navigating events can *only* be triggered from inline SVG documents.

//so far, so good

## `keypress` on an `<a href="...">`

the elements coming from clicking on 
The browser recognizes any `click`  
If the click 
In the click events `composedPath()`, the first `<a>` element link 
This will create a 
Users trigger the link by clicking on:
1. another HTML or SVG element within the `<a href>` element in HTML and SVG,
2. a submit button inside a `<form>` element, and
3. an area of an `<img ismap="theMapParentOfTheAreaElement">` that defines a ` 
(or defined as inside the element in the case of )that are defined as inside the link element.
in the following ways:
 
Once the link is set up, the user triggers a link by clicking on an element inside the link tag.
1. `<a href>` (HTML)
2. `<area href>` (HTML)
3. `<form>` (HTML)
4. `<a href>` (SVG).

linking elementcontent 
(a submit button in `<form>`) (or a submit button within forms) 
or focus on them and then then there are two main ways to trigger them:

### `<a href="...">` around `<img ismap src="...">`

```html
<a href="#YesWeCan">Can we ever get enough of HTML code examples?</a>

Second example:
<a href="somewhere/else.html">
  <h1>It is rarely a good idea to have links in headings</h1>
</a>

Third example:
<a href="somewhere/else.html">
  <img ismap src="www.universe.com/earth/europe/norway/tonsberg.jpg"/>
</a>
```


## Implementation tips

 * `.preventDefault()` must be called synchronously when the navigating event is first caught.
If the processing of the navigating event The act of blocking the native router from Take care Avoid testing navigation events in Mocha.
as it is difficult to call `.preventDefault()` in the right locations.
  When making unit tests for navigation events, do so without a unit test framework.


## References

 * [MDN: `click()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click)
 * [MDN: `MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
 * [MDN: `<a>` in SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a)
 * [Nested links](https://www.kizu.ru/nested-links/)
 * [Whatwg: `<a>` in HTML](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)
 * [MDN: `<a>` in SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a)
 * [Whatwg: Interactive elements](https://html.spec.whatwg.org/multipage/interactive-elements.html)
 * [w3.org: Interactive content](https://www.w3.org/TR/html5/dom.html#interactive-content)
 