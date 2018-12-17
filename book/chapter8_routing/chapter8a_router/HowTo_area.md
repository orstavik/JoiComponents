# HowTo: `<area href="...">`

## `<area href>`: `usemap`, not `ismap`

When adding the `usemap` attribute [MDN: `usemap`](https://html.spec.whatwg.org/#attr-hyperlink-usemap) to an image, the image surface area can be filled with several different links.
These HTML links are not defined using the `<a>`-tag, but with a brand new link tag: `<area>`[MDN: `<area>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area) [WHATWG: `<area>`](https://html.spec.whatwg.org/multipage/image-maps.html#the-area-element).

The `<img>`=>`<map><area /></map>` structure is a bit verbose:
1. The image element must include a `usemap` attribute to specify the map, ie. `<img usemap='#myMap'>`.
2. A `<map name='myMap'>` [MDN: `<map>` ](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map) [WHATWG: `<map>`](https://html.spec.whatwg.org/multipage/image-maps.html#the-map-element) element is created, and filled with one or more `<area>` elements.
3. `<area>` elements must declare what space over the picture they describe using the
`shape` and `coords` attributes.
4. The `<area>` elements can include the link attributes `href`, `rel`, `download`, and `target`
same as `<a>` elements. 

```html
<img src="myMapPicture.jpg" usemap="#myMap" width="100" height="100" alt="mapPicture"/>

<map name="notSoPopularAfterAll">
  <area shape="circle" coords="20,20,20"
        id="three"
        rel="noopener"
        href="https://specification.com/see/what/happens/when/spec/is/based/on/use.case"
        target="_blank" alt="This is an example of what happens when the spec is made too close to the use case" accesskey="p"/>
</map>
```

`<area href="...">` links are triggered the same way as `<a href="...">` links.
So, when a user `click`s on an `<img usemap='#myMap'>` that is covered by an `<area>` in that `<map>`,
then the event target will be that `<area>` element and it will bubble from that location in the document. 
The `<img>` will not be part of that `composedPath`.

`<map>`-and-`<area>` is an old technology. Like `<table>` [MDN: table](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table), [WHATWG: table](https://html.spec.whatwg.org/multipage/tables.html#the-table-element).<br>
Today, web developers can make similar structures with CSS.
For example, empty `<a href="...">` blocks with absolute position and size 
can be added inside a container `<div>` with a background image. 
[todo](make a test that this pattern can actually be done) [codepen](https://codepen.io/Halochkin/pen/EGyJGM) //strange demo

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

## References 
// not sure that it is nesseccary to repeat the links. IMHO we need to add them only at the end and not in the text. This is better because the user will start using the links he needs only after reading the text, but not during the reading process. This means that he will first read the text and understand what it is about, and only after that he will begin to clarify the necessary details. And if the user starts using links before he finishes reading text, it will be more difficult for him to focus on the idea of the article.

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
