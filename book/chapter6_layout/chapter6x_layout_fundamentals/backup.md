# Problem: em.. InheritedCSSValues you say?

The shadowDOM creates a *CSS context for the slotted elements*. This means that when you make a web component, you might also shape the CSS context for its children elements in unintended ways. This chapter addresses a few pitfalls in CSS contexts.

But first, a look back at [SlotStyleCreep](../../chapter3_slot_matroska/3_Problem_SlotStyleCreep.md). *Inherited* CSS properties will apply to slotted elements. If you set `font-family` in such a way that it will apply to a `<slot>` element, then it will apply to the slotted element too. This can be *mightily* confusing, especially when it is delegated in a SlotMatroska. In this chapter we will not again look at the problem of SlotStyleCreep, simply remind you that this problem exists. This means that when you specify an inherited CSS property on a shadowDOM element that is a parent of a `<slot>` element, then these inherited CSS properties will also be applied to the children of this `<slot>` element.
 
## WhatIs: InheritedCssValues

Some CSS values are context specific: `em` and `width %` and `height %`. These properties do not have the same value for all DOM elements, but their value will be determined based on other CSS properties (such as `font-size` or `width` or `height`) on the nearest, relevant parent element (such as the nearest parent element specifying `font-size` or the nearest `display: block` element).
 
## How to understand `em` and `font-size`?

Many native HTML elements such as `<h1>`, `<p>`, `<code>`, `<q>`, `<sub>`, etc. primarily controls the `font` of children elements. You can think of these elements as *font stylers*: they establish semantic values for font style *in HTML*, not CSS.

You might very well need to make similar web components. And when you do, you explicitly establish a root `font-size` and `1em` value for the descendant elements.

My advice is only to try to avoid mixing web components defining fonts with other web components defining layout or serving other purposes.

## How to approach `%` and `width` and `height`?

There is *one* rule of thumb that is more important than any other in HTML/CSS:

> Commonly, `width` is calculated top-bottom in CSS; `height` bottom-top during layout.

And there are *two* clarifications of this rule of thumbs that is more important than any other in HTML/CSS:

> `block` elements calculate their width top-bottom in CSS; `inline` elements calculate their width bottom-top during layout, but has a `max-width` set by their nearest `block` parent.

> You can calculate `height` top-bottom in CSS too. It's just common for elements not to do so, enabling the page to grow in height to fit the content on screens of different sizes. Any `height` value set in CSS will override the `auto` height value passed upwards in the layout model.

(This is a rule of thumb. HTML and CSS being what they are, there are of course lots of details not included here.)

This has some implications for making web components:

1. If you specify the host node of a web component as `block`, then you are defining the default `width` for slotted `block` elements and `max-width` for slotted `inline` elements. And, this also applies to the shadowDOM: if *any* parent elements of a `<slot>` element has `display: block` (or similar), this shadowDOM element will also restrict or expand the `width` of their slotted children. 

   A slotted element can of course override the default `width` value in the lightDOM and set their own width to be either bigger or smaller than what the default values that the shadowDOM establishes for them. But, this is not a tolerable solution. First, it will place an unnecessary burden on the user of the web component. Second, when the `block` width of a slotted element in a web component is altered, this also alters the `1%` width value for the slotted elements in the lightDOM. This makes it very hard to correct width manipulations in the lightDOM.

2. To specify the `height` around the `<slot>` of a web component has several complex issues. First, limiting the `height` makes it very hard to fit content of dynamic size into a screen area of dynamic size. Setting the `overflow` property to `visible`, `hidden`, or `scroll` likely will produce sub-par result.is set by default, so limiting the height only limits a) the border and b) the calculated height passed up to parent elements; it does only alter the `height` calculation of slotted elements who themselves set `height` and thus calculate their `height top-down. Obviously. Thus, setting height will not be passed *down* to the slotted element, but rather *up(!) to the parent element shaping its CSS context*. Omg.. The complexity. 

My advice is therefor that you can specify width around a slotted element, also in the shadowDOM. Try to keep the measurements in the shadowDOM relative to the size of the web component's host node when you can (obviously). And, measurements that are relative  height around a slotted element is 

> the layout callback should have *two* modes: top-down and bottom-up. Which runs top-down first, and then bottom-up. If you make a mind-map, you need the bottom-up mode, because you need to adjust the width of the element to fit the next display.

Many HTML elements specify these properties

CSS properties applied to the host node using the `:host` selector from inside the shadowDOM has no particular effect here. Inheritable CSS properties and non-inheritable CSS property that indirectly alter inherited CSS values such as `width %` affect subsequent nodes in the same way, regardless if they originally did arise from the lightDOM or shadowDOM of an element.

In this chapter we describe: how the css properties of  an element can be defined by its parent elements host node, but also the inner elements of the shadowDom.



When you make a web component or HelicopterParentChild pair of web components, they will be placed in a lightDom like this:
<div id="a">
<my-webcomp>
<div id="a">
<my-webcomp-parent>
<my-webcomp-child>
<div id="b" >
Now, this means that if <my-webcomp-parent or <my-webcomp-child alters any css properties or values that are inherited, these properties will also affect <div id="c".
This might be obvious in case of font-family for example. But, there are a couple of less obvious examples.
1. The % length value for <div id="c" can be specified by <my-webcomp-child and/or <my-webcomp-parent. Sometimes you only want the parent to set the width, and if so, then the child should make sure that it keeps the same width using css selectors such as
width:100%;
Margin:0;
Padding:0;
Border: none ;
Box-sizing: border-box;
The same also has to be applied to the parent and all the elements in its shadowDom that will affect the child length %.
2. If the <my-webcomp-child are stacked as layers, then these layers might mask the pointer-events of the <div id="c2". To avoid this, :host{ pointer-events: none and ::slotted(*) {pointer-events:auto should be added to both <my-webcomp-parent and <my-webcomp-child.
<div id="a">
 <my-webcomp-parent>
   <my-webcomp-child id="one">
     <div id="b1" >
   <my-webcomp-child id="two">
     <div id="b2" >
To max: replace the other demo tenplate with this one.
And c2 with b2.
