# UseCase: OuterStyle becomes InnerStructure

## One man's style is another man's structure

Often, what looks like a "stylistic" choice from the lightDOM, outside the web component is in fact
a "structural" choice inside the shadowDOM.

One example of such a "external style alters internal structure" is
[`list-style-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/list-style-position).
When you make a list, you might desire that the dot or number of the list be specified to the left of
the list itself. If the list is given a background color, then this background color would not
apply to the dot or number. At other times, you might desire the background to span below the numbers.
To achieve this effect, the CSS might alter the shadowDOM by adding HTML attributes, 
adding/removing/moving shadowDOM elements around, and/or imperatively choose which CSS properties to 
be set depending on the given value.

## staticHTML+complexCSS vs. dynamicHTML+simpleCSS

staticHTML is best when..

dynamicHTML is best when..
 
CSS properties that alter shadowDOM structure can mostly be implemented as pure CSS function on an 
existing, static, but often a little convoluted HTML structure. Ie. with a little CSS wizardry, you
can implement the `caption-side` CSS property without altering the shadowDOM. When both the interface
of the web component is fixed and speed of performance is desired, this is most often desired.

However, it does not take a large leap of faith to see that custom web components might desire changing
the DOM to implement visual structure. First of all, not all web components are performance sensitive.
Some web components might only facilitate custom styling to be set once during startup and might 
therefore desire "less complexity in its internal, shadowDOM HTML and CSS" over "speed of alterations".
Second, custom web components might require visual changes that cannot be implemented against a static
HTML template and CSS alone. HTML and CSS is not without its edge cases, and managing different 
`<slot>` elements or even dynamically adjusting `<slot>` elements can require structural DOM changes.

In the beginning they can make simple dynamic HTML with simpler CSS, and 
then later make this structure more efficient by static html and complex CSS.

## Native examples of OuterStyle becomes InnerStructure

HTML and CSS has several elements whose external style can translate into alterations of shadowDOM:
 * CSS properties that include an image via a `url(...)` will most often require that an `<img>` of
   sorts be added, removed or hidden/shown depending on the property.
 * `<table>`, `<caption>` and `caption-side` alters the 

## Can we make custom OuterStyle become InnerStructure?

This means that "changing a CSS style property" causes "a change in the DOM".
For web components, this means that "changing a CSS style property on the host element" causes 
"a change of structure in the shadowDOM".

There are no events that tells you when a CSS style property has changed. 
There is no que that can be called after CSS has finished processing, there is no StyleChangedObserver 
interface as there is a ResizeObserver.
There is no styleChangedCallback lifecycle callback in the custom element.
So, we need to make it.