# Pattern: GoldenPage

GoldenPage pattern establishes margins around a piece of texts using the golden ratio and the "Canons of page construction". 

## A web component is not a paper page

There are several problems transferring the "Canons of page construction" directly to a web component:

1. The paper has a fixed width; the web component must *respond* to many different widths.

2. The paper has a fixed height; the web component should likely *adapt* its height to its content. 

3. Text printed on paper has a fixed set of font sizes and width. This means that characters per line can be calculated in advance. A web component might need to fit in many different font contexts *and* the font-size given to an element might also be changed dynamically to f.ex. make the web site *accessible*. 

A single paper page is not *responsive*, a universal web component for appropriate margins around a text column must be responsive.

## Rules for a responsive GoldenPage

The actual width of the GoldenPage element is given by the element context. 

1. From the "Canons of page construction" we apply two rules. The margin-left should be twice the width of the margin-right for a single page read from left to right. In addition, if the page is wide enough, then the text-column should be given 2/3 of the total width of the page. This makes margin-left = 2/9, text-colum = 6/9, margin-right = 1/9.

2. Using the golden ratio, we stipulate that the margin-top should be margin-left/1.618, ie. 61.8% of margin-left. The top-left, margin rectangle has the golden-ratio ratio. If not otherwise specified, the bottom-left, margin rectangle echoes top-left, margin rectangle.

3. Looking the width of a text-column should be between 40-70cpl. Depending on the topic, length of paragraphs, your reader demography and their expectations, and the font family and spacing, this would translate into an estimated column width of for example 40-70 `em` for english in times new roman with normal font spacing. The GoldenPage reveals two CSS variables `column-width-min` and `column-width-max` that you should provide with values such as `{ column-width-min: 40em; column-width-max: 60em; }`. The default values of these CSS variables are `40em` and `70em` if unset.

4. In modern web design, it is established practice that if the page becomes too narrow, cpl should be prioritized over margins. In practice, this means that if the column space runs:
    * below `column-width-min` both margin-left and margin-right is decreased to make the column wider and the text more easily readable. 
    * above `column-width-max` only margin-right will grow. 

5. The height of the GoldenPage can be fixed as either `fixed-ratio="portrait"` (default) or `fixed-ratio="landscape"`. When `fixed-ratio` is set, the dimensions of the GoldenPage *and* the text column will be the golden ratio, the margin-left = 2/9 width, margin-right = 1/9 width, and the dimensions of the top-left margin square be the golden-ratio. The bottom margin is the remainder.
 
## Problem: the text is too narrow or wide for the page

As is evident from many mobile web pages, space for text is prioritized over space for margins when a page becomes too narrow. This can be viewed in terms of characters per line (`cpl`). If a "page" becomes too narrow so that it will produce a text of less than say 30cpl, then margins should be reduced to achieve a min-cpl number.

Similarly, if the page is too wide for the given text, the width of the column becomes too wide. In such cases, the width of the column should be capped at a certain max-cpl number, say 90cpl.

To calculate cpl is not easy as it varies with:
1. font-family. Some fonts have different/natural width characters of varying width, some are monospaced. The mean width of the different font family and font-family implementation therefore varies.
2. language. Some languages such as Chinese use wider characters than English.
3. font-spacing.
4. font-size.

In JS it is possible to compute the mean cpl for a given text, but this will be very heavy. 

Thus, instead of adapting the min-text-width and max-text-width to cpl, min-text-width and max-text-width is specified against `em`. In typography, `m`-width originally referred to the width of the `M` character in a typeset. In CSS `em` is a known length unit for any element. Thus, `min-text-width` and `max-text-width` is specified in `em` as this gives a good enough estimate for when margin-space should be deprioritized/prioritized.

## Implementation

The `width` and `em` of the element is given from the elements context.

The `golden-height`:
 * 100% `width` * 1.618 
 * (or 100% `width` / 1.618 if the GoldenPage has a `landscape` attribute set).

To implement the padding/margin from the top, an empty block that only pads whitespace above the contained text is added over the text content. The empty padding block should have a (golden-)height = `width` of 100% * 1.618 * 1/9 = `17.98%` (or `6.87%` in `landscape`). This is implemented using an empty `<div>` with fixed aspect ratio:
`<div style="display: inline-block; width: 17.98%; padding-top: 100%; float: right; clear: left;">`

## Demo: GoldenPage

```html
<script >

</script>

```

golden-height in em = 
X em * 1.5 * 1.618.

In normal circumstances, the width of the column should be 6/9*100% width. However, the size of the text column should be minimum `min-text-width` `em` and maximum `max-text-width` `em`. This is implemented using CSS grid according to the following format:

```html
<div style="display: grid; column">
  <div>padding left</div>
  <div>text column</div>
  <div>padding right</div>
</div>
```

The entire body of the element thus look like so:

```html
<style>
#top {
  display: inline-block; 
  width: 17.98%; 
  padding-top: 100%; 
  float: right; 
  clear: left;
}
#grid {
  display: grid; 
  grid-template-columns: 40px auto 50px;
}
#left {
  /*display: grid; */
  /*grid-type: column;*/
}
#column {
  /*display: grid; */
  /*grid-type: column;*/
}
#right {
  /*display: grid; */
  /*grid-type: column;*/
}
</style>
<div id="top">
<div id="grid">
  <div id="left">padding left</div>                               
  <div id="column">text column</div>
  <div id="right">padding right</div>
</div>
```
## Old drafts

This

Furthermore, as the "Canons of page construction" presume a page close to the "golden-ratio", oriented either as landscape or portrait. The height of the GoldenPage element is not specified directly by the external context in HTML/CSS, but if we assume that the element should look like a golden-ratio page, we can calculate its golden-ratio height as:
 
1. golden-height in `portrait` mode = `width` * 1.618
2. golden-height in `landscape` mode = `width` / 1.618

The GoldenPage margins are then:

 * margin-left: 2/9 width
 * margin-right: 1/9 width
 * margin-top: 1/9 golden-height
 * margin-bottom: 2/9 golden-height

When framing a picture, it is common to have the same margin-top as margin-left. And, then only have a slightly larger margin at the bottom than top (say margin-bottom = margin-top*120%). But, using the golden-ratio-height in either portrait or landscape mode to obtains both a "nice" angles and dimension for the margin, a mini-golden-ratio-page of whitespace in the top-left corner.

## References

 * [Wikipedia: Canons of page construction](https://en.wikipedia.org/wiki/Canons_of_page_construction)
 * [w3schools: aspect ratio](https://www.w3schools.com/howto/howto_css_aspect_ratio.asp)