# Intro: Layout

> Make the theoretical parallel to coherence and cohesion?

## (in)consistency means something

Design is all about consistency. You use one of a select few fonts. You use one of a handful of colors from a color palette. You don't have one company logo. And (usually) you don't put one of Walt Disney's figures against a background painted by van Gogh.

Two pieces of text with the same font are parallel. A piece of text with a different font is on another level. Using font, we can distinguish a header from a paragraph. Headers play a different role in the text. They have different grammatical restrictions. They are freer from the intra-textual context than words in a paragraph, their words' semantic connotations getting their meaning from outside the text, afresh, anew, while still being put in the same place. They are not unlike words in a line in a poem. Text in paragraph are more intra-textually connotated. Their words belong to the text as a whole, and the words in the text are intended to fill them with meaning. You can define a new semantic meaning for a word in any text, and when you take this intra textually defined words into the heading, you create tension. You speak this meaning to the world, and not just the reader.

Thus, switches between fonts signal to the reader how the words should be read, and against which background their semantic meaning should be read. The normal font is meant to be read. It is the text and intra-textual context. The bigger and bolder the font, the more the meaning of the word should be associated with the extra-textual context. The words either define or communicate a new meaning to the cultural domain universal semantic context.

Switch font type, and you signal a different domain. Cursive font is emphasis. Although bold and cursive can both be used in this sense, depending on the genre and context of the web page. When the fonts are "the same", consistent, it means something. When fonts are "not the same", inconsistent, it means something.

And color is the same. Does text in the same color play on the page? Or is color only used to create emphasis, focus attention to the most meaningful "reading" or other interactive action? From genre to genre, from page to page, the page composer can use color to signify different things. But common to all is that it is the "shift in color" and the "sameness in color" and the "contrast of colors" (in addition to the human eye's intrinsic association of color such as "blood red" and "black'n'yellow like a wasp") that is meaningful. Consistency and inconsistency is mostly what matters.

### The grid model

Layout is also design. And layout too is all about consistency. If two paragraphs are positioned 24px from screen's left border, then you don't want the third paragraph suddenly be positioned 17px from the same border. And if you do so, it would mean something.

Layout is supposed to be "griddy". The eye expects to start reading the next line of text on the same vertical line as the preceding line, the eye jumps to the left. Same with images and headers. If this desire for order is "by nature or by nurture" does not matter here, what matters is that the reader will attribute consistency and breaks in vertical layout as meaningful. 

There is also a grammar in layout. When two elements are positioned against the same vertical line, it means something. It is like an "and" or "or" written in whitespace. Width and to a lesser degree height, also signal unity and coherence. The pieces of text belong together, they have something to say about each other. Breaking one or more of these borders signals a degree of distance. Independence. Two pieces of texts and/or images that are not aligned to the same vertical lines should be interpreted more independently. As new, fresh beginnings. Both shared alignment (layout consistency) and broken alignment (layout inconsistency) is useful. The user will connotate meaning to them both.

This system of "global lines and borders and margins/paddings", or just "global lines and tiles" for short, for the "grid model". The user expects that "one page" uses such a "grid model" to signal global coherence, and also varying degree and types of local cohesion. If you see two paragraphs that follow each other, aligned to the same vertical line, you probably expect that the information in the first paragraph should be read before the second, and that therefore there might be information in the first paragraph that the second paragraph will imply. This voice of cohesion and linearity is also influenced by other linguistic and extra linguistic conventions such as:
1. which genre do the page belong to?, 
2. is there a heading, image or extra padding in between?, 
3. are the paragraphs in the same font?
4. etc.etc.

Regardless, the grammar of layout is important. It speaks to the user. It will make the web page feel coherent, understandable, and pretty. For almost all web pages, this grid model is global. If you follow or break a line, a margin, a padding a border anywhere within the same document, the will sense it and try to interpret its meaning. The Grid model is king in the user's mind.

## The box model: CSS layout means complexity 

In CSS, consistency of color and fonts is pretty simple. Color and font properties can (mostly) inherit and cascade from the root of a document throughout. And when CSS inheritance is not enough, simple CSS classes or CSS variables fill in the gap. 

But, making layout consistent in CSS is hard. Very hard. Why? Because layout of DOM elements and nodes is qualitatively different from CSS colors and fonts. Fonts and colors are interpreted to each element individually, but the layout of DOM elements is interpreted "in context".
 
The context in which layout is interpreted is called the "box model". And this "box model" makes consistent positioning of elements in a page very hard, in many ways:

1. The layout of one element is calculated based on its "container context". This means that margins and paddings are calculated only between an elements and its parent, not based on global values. This in turn means that:

   1. When elements are nested inside each other, the margins and paddings of all the elements are summarized to become "one big" margin/padding. This means that when you need to position an element deep down in the DOM against the global, consistent grid of elements your user expects on the page as a whole, then you need to take into account all the margin, padding and border properties of all the ancestor elements.
   
   2. When elements are nested inside each other, you don't know the dimensions of the sibling elements.

2. The "container context" is dynamic. It is unknown from the declarative perspective of CSS. In the box you do layout, very little is known about the context. In CSS, you do not know the dimensions of this container, layout context. You don't know the layout choices made in other branches of the DOM. At the top level, when you are working against the window, dimensions are known. But, as soon as you get a little bit deeper in the DOM, bets are off.

3. Layout goes up and down. The height of any `block` is unknown; the width and height of any `inline-block` is unknown. `auto` rules.

## Solving layout in CSS

To solve the problem of layout, you need to specify and freeze the layout of your containers. Or at least some dimensions of your containers. Most commonly, this is done by freezing width of the elements in your DOM, and letting the height of some elements stretch out the page. Although the same can be accomplished with freezing height and letting the width grow.

However, when the CSS freezes the dimensions of the elements in the DOM, a programmatical-semantic relationship between the elements in the DOM is established in CSS. A styled-`<div>` with layout properties set, assumes a certain parent element. Without the layout of the parent element being styled a certain way, the `<div>` might behave very strangely.

This means that CSS layout cannot work without also assuming a static, fixed DOM. To set CSS layout is essentially to freeze the DOM to one particular make-up. (Later, this argument is used as a means to go back to element based layout such as `<table>`(!). I am not advocating for using only `<table>`, but I am advocating for making your own, new `<table>`-like web components for your particular layout model. The problem with this approach is only that CSS media queries and responsive designs sometimes need to alter the shadowDOM and not only switch between CSS styles. They always have to do this anyway, but with web components this becomes more readily apparent. Instead of you the developer feeling like a dummy in CSS and giving up because you just can't figure out why and how).   

## Show some "grid" in the "box model"

Enter the grids. Grids such as Bootstrap grid. Material grid. And many, many more. All of these grids serve one purpose, they try to align elements on the screen *globally* consistently, make consistent keylines, paddings and spaces. Their pyrpose is to give the composer of the main html and css documents the ability to place its content against the global grid and keylines, no matter where the element is boxed in the dom.

This means that margins and paddings exist on two levels. Globally, as part of the grid, and locally between minor elements in tiles of the grid.

To get a consistent layout, you should try to avoid setting margins and padding on column and row level elements, ie the main tiles in your grid. You should use a global structure to accomplish this. Only control the margins and paddings within-tile level.


How can we implement a global grid best? The established solution is to use a css framework. Like bootstrap or Google material or crow. The problem with these models is that they...

Using a HelicopterParentChild web component pattern solves this problem. First, a twelve-grid element is set up. Either globally or locally. Then, twelve-elements are placed anywhere. These twelve-elements are then given preferences, and these elements will then be coordinated as HelicopterParentChild.


## drafts

You always do layout *inside* a box. Sometimes, this box is the whole window. Sometimes, this box is a fixed rectangle. Sometimes, this box is a fixed width/expandable height rectangle (this is called display: block in css speak). Sometimes, this box is of expandable width (up to a point), and expandable height (called display: inline-block in css speak).
When you do layout, you must conform to one of these boundaries. You cannot *do layout* anywhere else. And, these contextual boundaries might change. If they stay within the same logic, say fixed width/expandable height, then you are probably ok. But if the *type of layout context changes*, you likely will have trouble. Css tries to cope with such changes. But it is very hard. And i personally do not think this should be attempted.
So, when you make a wrb component for layout, you make it for one type of container context. It is very hard to do it otherwise. If you need to manahe multiple layout contexts, make multiple versions of the web comp. If you need to make an element that is supposed to handle dynamic changes of this layout context, then you likely need to put in some serious efforts. But in any case, you most likely need to make the individual elements for the different types of context, so you start with multiple versions of the simple element. And then nest them together to become a bigger, more dynamic super layout component.

When you do layout, you are not only doing layout. You are also likely handling in page navigation such as scrolling, on the top level.

http://www.responsivegridsystem.com/
https://getbootstrap.com/docs/4.0/layout/grid/
https://materializecss.com/grid.html
https://blog.prototypr.io/9-best-grid-system-for-web-mobile-ui-265c68d30c09