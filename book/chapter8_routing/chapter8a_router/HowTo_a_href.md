# HowTo: `<a href="...">`

```html
<a id="one" href="#YesWeCan">Can we ever get enough of HTML examples?</a>

<a id="two" href="https://outside.com"><div style="border: 2px solid black">think</div></a>
```
In the above examples, first a `<a>`-element (link) is wrapped around a bit of text, ie. a text node.
Second, a link is wrapped around another HTML element, a `<div>`.

`<a>` elements cannot be wrapped *around* interactive elements such as `<button>`, `<select>`, 
other `<a>` elements. Most browsers will allow such `<a href="...">` elements to exist visually, but
the will cause no navigating events when clicks and keypresses inside them are caught by their inner
interactive elements.

```html
<a id="blueLink" href="blue.html">
  <div id="blue">blue</div>
  <a id="redLink" href="red.html">
    <div id="red">red</div>
  </a>
</a>

<script>
  document.querySelector("#blueLink").click(); //todo does this work?
  document.querySelector("#blue").click(); //todo does this work?
  document.querySelector("#redLink").click(); //todo does this work?
  document.querySelector("#red").click(); //todo does this work?
</script>
```
When the user clicks on "red", the browser navigate to the `red.html`.
//todo ??? Even though the composition is illegal, the browser will also navigate to `blue.html` when the user
clicks 'blue'. ??? 
However, do not [nest links](https://www.kizu.ru/nested-links/) in HTML. 
While it often works, it is explicitly wrong.
Use JS and add event an listener for `click` on a set of nested `<div>`s instead if you need.  

## `click` and `keypress` on an `<a href="...">` 

To navigate the user can click on the content inside the link with a pointer device. 
This will generate a `click` event that bubbles upwards. 
`click` events are composed by default, and will thus pass across shadowDom borders of custom elements.
But, `click` events *do not* pass by `<iframe>` document borders.

The `click` event's `target` is the innermost HTML *element* pointed to when clicking. [WHATWG](https://html.spec.whatwg.org/multipage/interaction.html#dom-click-dev);
In the first example the `target` would be:
 * the `<a id="one">` element (as the text node is only an HTML node, and not an element), and 
 * the `<div>` element inside the `<a id="two">` element. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/target) [WHATWG](https://dom.spec.whatwg.org/#dom-event-target)

`click` events can also be generated:
 * from JS script using either 
   * `HTMLElement.click()` [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click)
    [WHATWG](https://html.spec.whatwg.org/multipage/webappapis.html#fire-a-synthetic-mouse-event)
   * `HTMLElement.dispatchEvent(new MouseEvent("click", {bubbles: true, composed: true, cancelable: true}))`.[MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) [WHATWG](https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent)
 * using a shortcut specified with the `accesskey` attribute on an element 
   (for instance, `<a href="#down" accesskey="d">scroll down</a`> will trigger a `click` event
   when the user presses `alt`+ `d`.) 
    (todo does the accesskey shortcut first bubble as a keypress?? or is it translated into a click *before* it enters the browser's JS context??)
```html
<div id="blue">
    <a id="blueLink" href="blue.html">blue</a>
</div>
<a id="redLink" href="red.html">red</a>

<script>
  document.querySelector("#blueLink").addEventListener("click", (e) => {
    e.stopPropagation();
  });
  document.querySelector("#redLink").addEventListener("click", (e) => {
    e.preventDefault();
  });
  document.querySelector("#blue").addEventListener("click", (e) => {
    document.querySelector("div").style.backgroundColor = "yellow";
  });
</script> 
```
To identify which `click` and `keypress` events are navigating events, 
the browser must analyze all `click` events that has completed bubbling.
`click` events has completed bubbling when the event has either: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles) [WHATWG](https://dom.spec.whatwg.org/#dom-event-bubbles)
 * bubbled past the `window` object,
 * a `.bubbles` value of `false` (ie. `.stopPropagation()` has been called on it),
 * bubbled past the `document` object in an `<iframe>`, or
 * a `.composed` value of `false` and has bubbled past the next `shadowRoot` document of a custom element. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed) [WHATWG](https://dom.spec.whatwg.org/#dom-event-composed)

When a `click` event has completed bubbling, 
the browser will examine the event to see if the `click` event:
1. has `.defaultPrevented` is false, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/defaultPrevented) [WHATWG](https://dom.spec.whatwg.org/#dom-event-defaultprevented)
2. is from a left or middle mouse button click, ie. not a right context menu button click,
3. has no `shift` or `ctrl` key pressed, and
4. has a `target` who has an `<a href=" ">` `parentNode` that comes before a link blocking element (such as `<body>`)(before). [WHATWG](https://html.spec.whatwg.org/multipage/webappapis.html#event-firing)

If all these criteria are met, then the `click` event is considered a navigating event and will cause 
the browser to que a navigation task in the micro-task que. (or in the event loop?? todo Test this using messages).
This will cause the browser to load a new DOM.

### `Enter keypress` on an `<a href="...">`

When the user selects an element via the `accesskey` attribute, [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/accesskey) [WHATWG](https://html.spec.whatwg.org/multipage/interaction.html#the-accesskey-attribute)
the `keypress` event is automatically translated into a `click` event.   // Can not find any proof
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
If you wrap an `<a href>` element around an `<img>` element, and then add the `ismap` attribute [WHATWG](https://html.spec.whatwg.org/multipage/embedded-content.html#attr-img-ismap) to 
the `<img>`element (att! not the `<a href>` element), 
then the coordinates of the mouse cursor on the format of `?x,y` will be appended to the `href` of the link when the 
user clicks on the image with a pointing device.

```html
<a href="inYourDreams.html">
  <img src="http://maps.com/world.jps" width="450px" height="360px" ismap alt="the place to be">
</a>
```
In the example above, if the user clicks with his pointing device at the center of the linked image,
then the `href` in the navigating `click` event will be interpreted to be `inYourDreams.html?222,180`.

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
 
 * 
// * [w3.org: Interactive content](https://www.w3.org/TR/html5/dom.html#interactive-content)
