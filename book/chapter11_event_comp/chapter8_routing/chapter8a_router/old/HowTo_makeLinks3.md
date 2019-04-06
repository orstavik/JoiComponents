# HowTo: make links

## The hypothetical "navigating" events

A navigating event is any event that will cause [the browser to load a new document or scroll to a position in the document](https://html.spec.whatwg.org/multipage/browsing-the-web.html#navigate).
In practice, a navigating event can be only one of three native events: 
 * `click` [MDN](https://developer.mozilla.org/en-US/docs/Web/Events/click) / [WHATWG]() 
 * `keypress` [MDN](https://developer.mozilla.org/en-US/docs/Web/Events/keypress) / [WHATWG]()
 * `submit` [MDN](https://developer.mozilla.org/en-US/docs/Web/Events/submit) / [WHATWG]()

However, not all `click`, `keypress` and `submit` events cause the browser to navigate, and 
here we will describe how and when navigating events occur and what they look like.

> Att! There exists no such thing as a real "navigating event".
> "Navigating events" is just a made-up name used to describe a subset of real 
> `click`, `keypress` and `submit`. In a later chapter we will describe how you can make it yourself,
> if you need it.

There are four different HTML/SVG elements (link elements) that can trigger navigating events:
 * `<a href="...">` [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a) / [WHATWG](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element) 
 * `<area href="...">` [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area) / [WHATWG](https://html.spec.whatwg.org/multipage/image-maps.html#the-area-element)
 * `<form>` [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) / [WHATWG](https://html.spec.whatwg.org/multipage/forms.html#the-form-element)
 * SVG `<a xlink:href="...">` [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xlink:href) / [w3.org](https://www.w3.org/TR/SVG/linking.html#AElement)

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
passing shadowDom borders, but not `<iframe>` document borders.[w3.org](https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-flow-bubbling);
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
//todo verify that the xlink:href property populates the .href property in all browsers.

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

When adding the `usemap` attribute to an image, the image surface area can be filled with several different links.
These HTML links are not defined using the `<a>`-tag, but with a brand new link tag: `<area>`.

The `<img>`=>`<map><area /></map>` structure is a bit verbose:
1. The image element must include a `usemap` attribute to specify the map, ie. `<img usemap='#myMap'>`.
2. A `<map name='myMap'>` element is created, and filled with one or more `<area>` elements.
3. `<area>` elements must declare what space over the picture they describe using the
`shape` and `coords` attributes.
4. The `<area>` elements can include the link attributes `href`, `rel`, `download`, and `target`
same as `<a>` elements. 

```html
<map name="notSoPopularAfterAll">
  <area shape="circle" coords="20,20,20"
        id="three"
        rel="noopener"
        href="https://specification.com/see/what/happens/when/spec/is/based/on/use.case"
        target="_blank" alt="This is an example of what happens when the spec is made too close to the use case" accesskey="p"/>
</map>

<img src="myMapPicture.jpg" usemap="#notSoPopularAfterAll" width="100" height="100" alt=a" />
```

`<area href="...">` links are triggered the same way as `<a href="...">` links.
So, when a user `click`s on an `<img usemap='#myMap'>` that is covered by an `<area>` in that `<map>`,
then the event target will be that `<area>` element and it will bubble from that location in the document. 
The `<img>` will not be part of that `composedPath`.

`<map>`-and-`<area>` is an old technology. Like `<table>`.
Today, web developers can make similar structures with CSS.
For example, empty `<a href="...">` blocks with absolute position and size 
can be added inside a container `<div>` with a background image. 
[todo](make a test that this pattern can actually be done)

The benefit of using CSS-based alternatives to the `<img>`-and-`<map>`-and-`<area>` pattern are:
 * that such CSS-based patterns are more familiar and developer friendly, and 
 * more flexible and powerful.

Thus, `<map>`-and-`<area>` can best be understood as an old custom element pair.
The `<map>`-and-`<area>` pattern should be viewed as a "custom element pair" because 
the use-case it supports is a rare occurrence, not a common occurrence such as `<a>` and `<div>`s.
The `<map>`-and-`<area>` pattern should be viewed as old since the development of CSS
alternative patterns has long ago surpassed it.
This is why most web developers don't use or know about `<map>`-and-`<area>`.

Needless to say, a good argument can be made to deprecate `<map>`-and-`<area>`.
However, as `<map>`-and-`<area>` are still supported by both the standard and browsers, 
`<area>` elements are still a separate source of navigating events.

## What is the `<form>`?

`<form>` elements serve a couple of key navigation purposes:

1. Technically, `<form>` is the HTML way to send `POST` requests. 
   `POST` requests are web requests that in addition to a web resource's URL address can contain
   a compressed, large data packet.
   Small data packets can also be included in `GET` requests, but this data is added *inside* the
   URL as a query `?key=value&another=thing`, and this limits both data size and security.

   `<a href="...">` elements always produce `GET` request navigating events, and
   while `POST` requests can be produced by other means in JS [(MDN: Ajax)](https://developer.mozilla.org/en-US/docs/Web/Guide/AJAX/Getting_Started),
   HTML only do so via `<form>` elements.
   
2. When large data navigating requests are made, 
   its data not only needs to be stored, but also sculpted *somewhere* and from *something*.
   In HTML, that *somewhere* is a `<form>` and 
   the *somethings* are `<input>`, `<checkbox>`, `<button>`, `<textarea>` children of the `<form>`.
   
   Think of the `<form>` navigating event as a potato head toy.
   On the potato, the child can pin eyes and mouths and noses from a selection that comes with the toy 
   (cf. `<checkbox>`, `<select>`).
   In addition, pieces of colored clay, cloth, rope and pins can be stitched to the potato as 
   different forms of hat, scarf and warts (cf. `<input>`, `<textarea>`).
   Depending on the flexibility of the "somethings" that accompany the potato,
   the child can make potentially unique potato heads every time.
   
   Conceptually, this differs from `<a href="...">`.
   Navigating events from `<a href="...">`s are closed, binary.
   They are simple yes-and-no-questions from the developer to the user.
   Navigating events from `<form>`s are open, infinite. 
   They are a container in which the user can fill his own content.
   
Practically, web developers often use JS to alter the links of `<a href="...">` 
so to make them more 'formish'. 
Similarly, many `<form>`s are so closed to the user that could better be presented as `<a>` list.
Still, `<form>` and `<a href>` approach navigation from different sides of the spectrum,
the open vs. closed, the composed vs. binary, the yes-and-no-question link vs. the potato-head link.

> What if?? Viewed conceptually, the `<area>` structure and the `ismap` attribute have 
> more in common with `<form>` than with `<a>`.
> Technically however, both are related to `<a>`, not `<form>`. 
> It is an open question if `<area>` and `ismap` might have been received better if they had been 
> semantically related to `<form>` instead of given its own more or less independent semantics.
> (For example, imagine a `<button type="area" addCoordinateQuery action="/another/href/action">`
> that would both a) purify the `<a>` element removing the two only edge cases there, merging them
> both into a single `<button type="area">` element.
   
## `submit` events from `<form>` elements 

While `<a href="...">` and `<area href="...">` only emit raw, unprocessed `click` and `keypress` 
navigating events, `<form>` elements emit its own navigating `submit` event.
The `submit` event does not explicitly process the navigating event data, 
but it contains a `.target` pointer to the `<form>` element from where it originates.
This `target`, `<form>` element in turn contains:
1. an `.elements` property which contains the registry of all its 
   `<input>`, `<checkbox>`, `<button>`, `<textarea>` children.
2. the `action` attribute

//todo where do i find which button is the one submitting?
//todo which attributes of the form are navigation specific?

`submit` events can be generated when:
 * the user clicks on a submitting button, 
 * a submitting button is in focus and the user presses 'enter',
 * the user presses an `accesskey` associated with a submitting button,
 * a script triggers a submitting button using JS API such as `HTMLElement.click()` or
   `HTMLElement.dispatchEvent()`.

However, because the browser also provide a native `submit` event after 
these `click` and `keypress` events have been processed, 
we do not need to worry about the details of how navigating events from `<form>`s are triggered
(except the [Problem: NavigateTorpedo (`.submit()`)](todo next chapter).)





   * `HTMLElement.click()` [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click)
    [WHATWG]() or
   * `HTMLElement.dispatchEvent(new MouseEvent("click", {bubbles: true, composed: true, cancelable: true}))`.
 * using a shortcut specified with the `accesskey` attribute on an element 
   (for instance, `<a href="#down" accesskey="d">scroll down</a`> will trigger a `click` event
   when the user presses `alt`+ `d`.)
    (todo does the accesskey shortcut first bubble as a keypress?? or is it translated into a click *before* it enters the browser's JS context??)
                                                                        

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
