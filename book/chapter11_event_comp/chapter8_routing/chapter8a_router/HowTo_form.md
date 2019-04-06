# HowTo: `<form action="...">`

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
   the *somethings* are `<input>`, `<button>`, `<textarea>` children of the `<form>`.
   
   Think of the `<form>` navigating event as a potato head toy.
   On the potato, the child can pin eyes and mouths and noses from a selection that comes with the toy 
   (cf. `<input>`, `<select>`).
   In addition, pieces of colored clay, cloth, rope and pins can be stitched to the potato as 
   different forms of hat, scarf and warts (cf. `<textarea>`).
   Depending on the flexibility of the "somethings" that accompany the potato,
   the child can make potentially unique potato heads every time.
   
```html
<form action="selectPotato.js" method="post">
  <select name="eyes">
  <option selected>Choose eye color</option>
  <option value="green">Green</option>
  <option value="grey">Grey</option>
</select><br>
  <input type="checkbox" name="warts" checked>
  <label for="warts">Warts</label><br>
  <input type="radio" name="scarf" value="1">Scarf<br>
  <textarea rows="1" cols="20" placeholder="Form of a hat"></textarea><br>
  <input type="submit" value="Create toy">
</form> 
```

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
navigating events, `<form>` elements emit its own navigating `submit` event. [MDN: Submit event](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/submit) [WHATWG: Form submission](https://html.spec.whatwg.org/#form-submission-algorithm) 
The `submit` event does not explicitly process the navigating event data, 
but it contains a `.target` pointer to the `<form>` element from where it originates.
This `target`, `<form>` element in turn contains:
1. an `.elements` property which contains the registry of all its 
   `<input>`, ``<button>`, `<textarea>` children.
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


## w3 References
1. https://html.spec.whatwg.org/#handler-onkeypress  //relocate on the w3
2. https://drafts.csswg.org/cssom-view/#extensions-to-the-mouseevent-interface  // mouse event on the drafts.csswg.org
3. https://svgwg.org/svg2-draft/struct.html#SVGElement  // svg technical documentation
4. https://svgwg.org/svg2-draft/struct.html#UseElementHrefAttribute // svg href
5. [discussion on PUT and DELETE as form attributes](https://stackoverflow.com/questions/5162960/should-put-and-delete-be-used-in-forms)
6. 
