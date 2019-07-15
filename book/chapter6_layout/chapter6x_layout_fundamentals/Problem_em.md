# Problem: em

The shadowDOM creates a *CSS context for the slotted elements*. That the shadowDOM elements constitute a DOM context for the slotted elements in the flatDOM, can be considered a known concept for developers of web components at this point. But, how and when CSS properties and values from shadowDOM elements affect a slotted element can be a bit trickier to assess.

1. *Inherited* CSS properties will apply to slotted elements. If you set `font-family` in such a way that it will apply to a `<slot>` element, then it will apply to the slotted element too. This can be *mightily* confusing when applied in a SlotMatroska. And you should read more about this in [SlotStyleCreep](../../chapter3_slot_matroska/3_Problem_SlotStyleCreep.md).
 
2. *Inherited* CSS values such as `em` and `width %` and `height %` will also be affected when you alter the style around a slotted element. For `%` you often want this. For `em` you probably *don't* want it.

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
