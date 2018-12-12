# HowTo: make links

## The hypothetical "navigating" events

A navigating event[todo](this is hard to understand is not a real event just a figment of ivars imagination.We need to fix that in the text.)
is any event that will cause the browser to load a new page.
In practice, a navigating event can be only one of three native events [todo](I cannot find the specification that says that no other events/actions can trigger navigation.): 
 * `click` [MDN]() / [WHATWG]() 
 * `keypress` [MDN]() / [WHATWG]()
 * `submit` [MDN]() / [WHATWG]()

However, not all `click`, `keypress` and `submit` events cause the browser to navigate, and 
here we will describe how and when navigating events occur and what they look like.

There are four different HTML/SVG elements (link elements) that can trigger navigating events:
 * `<a href="...">` [MDN]() / [WHATWG]() 
 * `<area href="...">` [MDN]() / [WHATWG]()
 * `<form>` [MDN]() / [WHATWG]()
 * SVG `<a xlink:href="...">` [MDN]() / [w3.org](https://www.w3.org/TR/SVG/linking.html#AElement)

This chapter lists these link elements and describe how and when they trigger navigating events.

## `click` and `keypress` on an `<a href="...">` 

```html
<a id="one" href="#YesWeCan">Can we ever get enough of HTML examples?</a>

<a id="two" href="https://outside.com"><div style="border: 2px solid black">think</div></a>
```
In the above examples, first a `<a>`-element (link) is wrapped around a bit of text, ie. a text node.
Second, a link is wrapped around another HTML element, a `<div>`.

To navigate the user can click on the nodes inside the link with a pointer device, 
ie. the text or the div. 
This will generate a `click` event that bubbles upwards, 
passing shadowDom borders, but not `<iframe>` document borders.
The `click` event's `target` is the innermost HTML *element* pointed to when clicking.
In the example above the `target` would be:
 * the `<a id="one">` element (as the text node is only an HTML node, and not an element), and 
 * the `<div>` element inside the `<a id="two">` element.

`<a>` elements cannot be wrapped *around* interactive elements such as `<button>`, `<select>`, 
other `<a>` elements.

`click` events can also be generated:
 * from JS script using either 
   * `HTMLElement.click()` [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click)
    [WHATWG]() or
   * `HTMLElement.dispatchEvent(new MouseEvent("click", {bubbles: true, composed: true, cancelable: true}))`.
 * using a shortcut specified with the `accesskey` attribute on an element 
   (for instance, `<a href="#down" accesskey="d">scroll down</a`> will trigger a `click` event
   when the user presses `alt`+ `d`.)
    (todo does the accesskey shortcut first bubble as a keypress?? or is it translated into a click *before* it enters the browser's JS context??)
                                                                        
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

### `Enter keypress` on an `<a href="...">`

When the user selects an element via the `accesskey` attribute, 
the `keypress` event is automatically translated into a `click` event.
However, the keyboard can also trigger a navigating event by:
1. pressing the `enter` key
2. when an `<a>` element or a child of an `<a>` element is in focus.

The `keypress` event can also be triggered from the JS API via a `.dispatchEvent`;
```javascript
el.focus({preventScroll: false});
el.dispatchEvent(new KeyboardEvent('keypress', {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, bubbles: true, composed: true, cancelable: true}));
```

But, while the accesskey-keypress event is translated into a `click` event, 
the enter-on-focused-element-keypress event remains a native `keypress` event throughout.
So, once the enter-on-focused-element `keypress` events has completed bubbling,
the act of identifying which `keypress` events are navigating events echoes that of `click` events.
The key pressed must be `code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13` and 
no meta-key `ctrl`, `shift`, or `meta` can be active.
But once this hurdle is cleared, the act of identifying an active `<a>` element in the 
composed path of the `keypress` event's `target` is the same for `keypress` events as for `click`s.

### `ismap`, not `usemap`

When I said there is nothing you can do with `<a href>` links, I meant *almost* nothing.
If you wrap an `<a href>` element around an `<img>` element, and then add the `ismap` attribute to 
the `<img>`element (att! not the `<a href>` element), 
then the coordinates of the mouse cursor on the format of `?x,y` will be appended to the `href` of the link.

```html
<a href="inYourDreams.html">
  <img src="http://maps.com/world.jps" width="450px" height="360px" ismap alt="the place to be">
</a>
```
In the example above, if the user clicks with his pointing device at the center of the linked image,
then the `href` in the navigating `click` event will be interpreted to be `inYourDreams.html?222,180`.
 
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

## `<area href>`: `usemap`, not `ismap`

When adding the `usemap` attribute to an image, the image surface area can essentially be filled with links.
These HTML links are not defined using the `<a>`-tag, but rather a totally new linking tag: `<area>`.
To set up such a structure, first an `<img>` element must `usemap='#name'` a `<map>` element 
with that same `name`, and inside that `<map>` element one or more `<area>` elements with `href` tags. 
Phuu.. It's a mouthful of template text. Below is an example of such a link.

```html
<map name="notSoPopularAfterAll">
  <area shape="circle" coords="20,20,20"
        id="three"
        rel="noopener"
        href="https://specification.com/see/what/happens/when/spec/is/based/on/use.case"
        target="_blank" alt="This is an example of what happens when the spec is made too close to the use case" accesskey="p"/>
</map>

<img src="" usemap="#notSoPopularAfterAll" width="100" height="100" alt=a" />
```



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

 * Identifying and filtering `click` and `keypress` events for navigating events is a pure function.
   You do not need any contextual information to identify which events are potential navigation. 
   You do need contextual information about the `<base>`, but that is needed when links are interpreted, 
   not created and navigating events initially dispatched.

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
