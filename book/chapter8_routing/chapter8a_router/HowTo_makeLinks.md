# HowTo: make links

## The hypothetical "navigating" events

In this chapter we will invent a term: "navigating events".
A navigating event is a an event that can cause [the browser to browse (and load a new document)](https://html.spec.whatwg.org/multipage/browsing-the-web.html).
In practice, a navigating event can be only one of three native events: 
 * `click` [MDN](https://developer.mozilla.org/en-US/docs/Web/Events/click) / [WHATWG](https://html.spec.whatwg.org/multipage/webappapis.html#fire-a-synthetic-mouse-event) 
 * `keypress` [MDN](https://developer.mozilla.org/en-US/docs/Web/Events/keypress) / [WHATWG]()
 * `submit` [MDN](https://developer.mozilla.org/en-US/docs/Web/Events/submit) / [WHATWG](https://html.spec.whatwg.org/multipage/forms.html#dom-form-submit)

However, not all `click`, `keypress` and `submit` events cause the browser to navigate, and 
here we will describe how and when navigating events occur and what they look like.

> Att! There exists no such thing as a real "navigating event".
> "Navigating events" is just a made-up name used to describe a subset of real 
> `click`, `keypress` and `submit` events.

There are four different HTML/SVG elements (link elements) that can trigger navigating events:
 * `<a href="...">` [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a) / [WHATWG](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element) 
 * `<area href="...">` [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area) / [WHATWG](https://html.spec.whatwg.org/multipage/image-maps.html#the-area-element)
 * `<form>` [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) / [WHATWG](https://html.spec.whatwg.org/multipage/forms.html#the-form-element)
 * SVG `<a xlink:href="...">` [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xlink:href) 

```html
<a href="../img/logo.png">Our logo</a>

<img usemap="#beak" src="gouse.jpg" width="500px" height="auto"/>
 <map name="beak">
  <area shape="poly" coords="300,156,60" href="https://en.wikipedia.org/wiki/Beak"/>
</map>

<form action="toysList.html" method="post">
  <label>Name:</label>
  <input type="text" name="name">
  <input type="submit" value="Submit">
</form> 

<svg viewBox="0 0 1000 915"xmlns="http://www.w3.org/2000/svg" font-size="58">
  <rect x="10" y="10" width="300px" height="100px" fill="yellow" stroke="black"/> 
      <a xlink:href="../mountain.png" target="_top">
        <text x="30" y="80">What about the mountain picture?</text>
      </a>
 </svg>
```

The next four chapters list these link elements and describe how and when they trigger navigating events.


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
