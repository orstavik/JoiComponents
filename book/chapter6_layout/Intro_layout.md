chapter 4: Mixin LayoutAttribute. AutoAttribute, with dynamic steps, that runs TreeOrder.

This mixin sets a series of steps on the element. The auto-layout -attribute is only updated when the 
step value changes. The steps are given as an array.
There is a special attribute auto-layout-freeze that can be used to cancel the update for the element.

The batch process runs at given intervals. rAF or setTimeout x ms. 
The AutoLayoutAttribute should run the batch process AFTER the styleCallback mixin for best performance, 
and therefore it is best to load the two mixins as one.

Should the mixin use getBoundingClientRect or which other method? Should the Layout be specified against 
the window or the nearest laayout parent?

need to react to layout changes too.
of a web component (from HTML and CSS too, not only JS)
But, the problem is that these reactions are 
1) can be handled in JS only. You cannot specify them as HTML attributes nor from CSS. 
And, this functionality is actually very CSSy. If the element is 200px wide, then apply this style is exactly what media queries do, except applied on the component. It is @media-query for web components.
You want these media queries to be controlled from both 
1) inside the element (here it makes not much difference if it is in JS only, or in from both JS, HTML and CSS) and
2) outside the element (and here it makes a big difference if it is from JS only, here you really want it to be controlled from CSS especially as it is so closely related to CSS media queries).
In fact, one way to look at CSS @media-queries is as layout reactions for the <body> element. 
The use case is:
1) how do I set up default layout reactions in a web component that
2) also can be overridden and controlled from outside CSS (and thus HTML and JS too).
that was . 
chapter 4: web component "layout" properties.
This would be a list of which layout specific properties of a web component that would be needed in CSS. Candidates are:
1. ew (element width), cf. vw (view width) 
2. eh (element height), cf. vh (view height)
3. pos (element position) ([left,top,right,bottom])
     pos.top == pos[1] etc.etc.
Once layout is calculated for an element, I think it makes no performance difference if one or all of these properties are retrieved. I therefor think that it is better to get them all. 
chapter 5: LayoutThrashing
what is the cost of finding and using the layout coordinates of an element? How can this cost be minimized? 
The basic answer to this question is: by asking for the coordinates for all the elements once, before they need it, and then reuse these results.
The problem with this is once a parent element alters the DOM, then the layout of the child is no longer correct. This can cause huge problems, as it might calculate things completely wrong. This seems like a worse option than layout thrashing.
The problem is, does the browser know well when the layout has been flagged as dirty? Or will layout thrashing occur frequently? For all parameters?
And, another problem. reactions to layout parameters must itself not alter the layout parameter. If it does, then we have a loop. 
Lets say we have an inline element. The outer dimensions of this element can changes all the time. To use element these parameters in situations like "width : 100ew + 10px" (1ew here interpreted as element width /100), would obviously cause an infinite loop. element-width and element-height and element-position-top for example should therefore only be used in the check of the if clause. It is a question if this "if(a,b,c)" should be called "@if(a,b,c)" to echo @media-query. But if we did that, then it would like @if(a){ b } else { c }. No, I think it is better to align with "calc(operation)".
no, not inline element. block element I mean.
element-width could be used to for example control the padding. But here we have %. So we don't really need it. We have width and height as %.
wait.. I think the if(..) should be like this.
--custom-prop: 100px if(element-width > 500px, 200px) if (element-width > 1000px, 400px);
And then, you can have more and conflicting ifs
--custom-prop: 100px if(element-heigth > 500px, 200px) if (element-width > 1000px, 400px);
wait, you would likely do this using ","
--custom-prop: 100px, if(element-heigth > 500px, 200px), if (element-width > 1000px, 400px);
And then choose the last output.
exactly how the web component uses the syntax of the CSS value is up to itself. But. if(cause, effect) should be 2, and not 3 clauses. if(false, ...) returns empty. The else can thus be a default value infront.
To make the if(a,b) and interpret the rules can be done independently of the layout properties, although it would be kinda useless if it did not also have any ability to query contextual CSS properties.
Css if-structures, aka css media queries. They relate to the whole window. This works, if not very well/badly, for a component that is part of an app thst you know the whole structure of. But, when you make reuseable web components, this knowledge goes out of the window. You can't know the outer layout of your web component. This might also work reflexively. Your web component might be used inside another reuseable web component. Thus, both for internal control and external settings, the existing css media query if clause is useless.
So, web components need a new if clause.
