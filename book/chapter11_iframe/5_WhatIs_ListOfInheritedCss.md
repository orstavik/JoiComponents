# WhatIs: ListOfInheritedCssProperties

CSS provides several CSS properties that are inherited by default. 
This essentially mean that if not otherwise specified, a CSS property will apply to each and every
descendant element of another element with a specified, inherited CSS property.

## List of all inherited CSS properties

```javascript
const inheritedCSSpropertiesMai2019 = [
//CSS Generated content
  "quotes",

//CSS Fragmentation
  "orphans",
  "widows",

//CSS Basic UI
  "cursor",
  "caret-color",            //only missing in Edge and IE

//CSS writing mode
  "direction",
  "writing-mode",
  "-webkit-writing-mode",   //prefix in Safari
  "text-combine-upright",   //experimental, widely supported
  "-webkit-text-combine",   //alias for text-combine-upright in Safari
  "text-orientation",       //experimental, only Chrome and Firefox

//CSS table
  "border-collapse",
  "border-spacing",
  "caption-side",
  "empty-cells",

//CSS box model
  "visibility",

//CSS color
  "color",
  "color-adjust",           //only Firefox, no Edge and IE
  "-webkit-color-adjust",   //Safari Chrome

//CSS text
  "hyphens",
  "letter-spacing",
  "overflow-wrap",
//"word-wrap",              //alias of overflow-wrap
  "paint-order",            //experimental, widely supported
  "tab-size",
  "text-align",
  "text-align-last",
//"text-decoration-color",  //MDN and SPEC lists as NOT inherited, but listed by others as inherited?
  "text-indent",
  "text-justify",
  "text-size-adjust",       //experimental, widely support
  "hanging-punctuation",    //experimental, only Safari
  "text-transform",
  "white-space",
  "word-break",
  "word-spacing",

//CSS Text Decoration
  "text-shadow",
  "text-underline-position",//standard, only Chrome and Edge

//CSS fonts
  "font",                   //the shorthand "font" covers the 7 categories below
//"font-family",
//"font-size",
//"font-stretch",
//"font-style",
//"font-variant",
//"font-weight",
//"line-height",
  "line-height-step",       //standard, only Chrome
  "font-kerning",           //standard, only Safari and Firefox
  "-webkit-font-kerning",   //-webkit- prefix in Chrome
  "font-synthesis",         //standard, only Safari and Firefox
  "font-language-override", //standard, only Firefox
  "font-optical-sizing",    //standard, only Firefox and Edge
  "font-size-adjust",       //standard, only Firefox and Chrome
  "font-feature-settings",  //standard, advanced feature
  "font-variation-settings",//standard, advanced feature

//CSS lists
  "list-style",             //the shorthand "list-style" covers the 3 categories below
//"list-style-image",
//"list-style-position",
//"list-style-type",        //Att! OL and UL tags break inheritance for list-style-type. In fact, its the whole purpose of OL and UL to provide another default (or shared) list-style-type CSS prop for LI.
];
```

Some notes:
1. `<OL>` and `<UL>` tags break inheritance for `list-style-type`. In fact, 
   the purpose of `<OL>` and `<UL>` is to provide another default (or shared) `list-style-type` for
   its children `<LI>`s.

## Test of inherited CSS properties

```html
<style>
  body {
    font-family: sans-serif;
    font-size: 15px;
    font-stretch: condensed;
    font-style: italic;
    font-variant: small-caps;
    font-weight: bold;
    line-height: 0.8em;
    color: red;
    list-style-position: inside;
    list-style-type: upper-roman;
    list-style-image: unset;
  }
  .one {
    font-family: serif;
    font-size: 20px;
    font-stretch: expanded;
    font-style: italic;
    font-variant: normal;
    font-weight: bold;
    line-height: 1.5em;
    color: blue;
    list-style-image: url("https://picsum.photos/id/58/20/20");
    list-style-position: outside;
  }
</style>

<li>Hello<br>sunshine!</li>
<li>Hello<br>sunshine!</li>
<ol>
  <li>Hello<br>sunshine!</li>
  <li>Hello<br>sunshine!</li>
  <li>Hello<br>sunshine!</li>
</ol>
```

Todo: make a full example of the inherited CSS properties.

## References

 * [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS)