# Rant: DeathToCss

> This "rant" is meant to be productive. It is not simply an outburst of frustration, to self soothe. This productive rant will try to motivate real, lasting, possible change. That *fix* a true problem. 

CSS *is* intrinsically an error of judgment. This chapter describes *what* CSS is, *why* it is flawed, and *how* to fix it.

## Why CSS? Separation of concerns

CSS and HTML splits style from content. All the text, tasks, planning, thinking, decisions, and other "concerns" that relate to style should in theory be possible to describe in a set of `.css` files. Similarly, all the "concerns" about a project's can be organized in a set of `.html` files. 

To complicate the picture a little bit, scripts can both server- and client-side, build- and run-time produce styles and content in a web app. However, from a theoretical perspective, the "separation of concerns" between style and content remain intact: the style the scripts produce are put into CSS rules, the content in HTML template.

The "separation of concerns" rests on an assumption that style and content can be split. Which is true. It can. If you have a project, a web app, you can take the structures describing its layout, color, font, borders etc. and place it in CSS structures, and at the same time take its logical structure and text content and place in HTML structures.

Furthermore, once you have split the content and style of a project into CSS and HTML, you can even develop them independently. Add `halo.css` to your HTML template, and that heavenly piece of HTML template is made to look like the son of God; add `horns.css`, and you are looking at the devil.

With style and content separated like this:
1. *different people* can work on style and CSS files vs. content and HTML,
2. *over time*, style can be developed and updated separately from content, and vice versa, and
3. *in the mind* of the developers, they can focus on the content in one sitting and style in another, without having to concern themselves with both at the same time.

This all sounds great! So, what's the problem exactly?

## Why not CSS? 1: we cannot separate style from content *universally*

The first problem is that we cannot split style from content *universally*. There are deep bindings between style and content. And we can see these dependencies pop up like mushrooms in the gap and overlap between style and content:

1. Let's say you fix a logical structure in an HTML template. To get a certain style to fit this logical structure, you need to do advanced CSS acrobatics and contortions "to make it fit". Sure, it might be possible, but it produces *massive, complex* CSS code bloat. Even for simple things. This CSS code bloat is not *only* a product of CSS cascading, CSS' predicative logic, or shortcomings in the CSS rule set; CSS code bloat is also, and maybe primarily, a product of the bindings between style and content that CSS as a premise considers besides the point.

2. Let's say you try alter CSS against a fixed HTML structure. The style and logical structure of your HTML was *adapted* to the style the page previously contained. Thus, some changes of style might be possible, some colors might be exchanged, borders added, boxes even moved around. Yes, you *can* change the style against the fixed content in 1 million ways. But. There are 999 million ways you *cannot* change the style of your web app *without* also updating the logical structure of HTML. Style can be altered against a fixed HTML *only within a specific, chosen set of parameters*, not universally.

   In the real world, "the customer" or "boss" or your sense of "estethics", "function", "purpose" or whatever rarely require you to change the content within those fixed parameters. In most instances you are required to change style in a way that imply changes of content. Thus, you end up breaking the separation of concerns and/or CSS acrobatic contortions resulting in a ball of complexity and code bloat that do the not separate your concerns, only magnify them.
   
3. HTML and content also often clash with the fixed structure: the new header is too long for the current design; there is no plan for a sub-header; you cannot put an image in that position; or how to add a fifth element to a four element wagon. The style end up restricting even minor adjustments of content.

When design and content are split into HTML and CSS structures, the developer *makes choices*. These choices are *not completely closed*, the developer *can make* changes to both style and content within them. But, these choices are *very restrictive*. "Separating your concerns" in "style vs. content" thus limits the development of both style and content in 999 out of 1000 possible dimensions.

The reason CSS has not been abandoned a long time ago is a) that *examples* can be produced that describe *how* CSS can be changed dramatically in *one* dimension, and b) that the cultural dogma that style and content *are* separate domains that *should* be handled by different people with different skills independently is so strong.

The reality is that these premises are false. The 1 in 1000 example does not proove the dogma that style and content are independent and do not contain deep bindings right. The reality is that this dichotomy leads to:
1. massive complexity and code bloat, often unnecessarily,
2. more time spent on collaboration than actually completing the task when work is divided in different HTML and CSS teams, and
3. that choices made early in a project either in the HTML or the CSS domain locks down and greatly hinder future development, and
4. added confusion in the mind of the developer when obviously relevant and required dimensions in the domain of either style and content are deemed irrelevant *and* technically obfuscated from their work in html and css respectively.

## Why not CSS? 2: The lie of declarative languages

HTML is a declarative programming language. Given a document with HTML, the browser first interprets the HTML commands into a DOM. As HTML is not super flexible, the end result is at first fairly predictable. 
                                                 
But, JS and server side scripts run against this interpreted structure. Pieces of HTML are embedded. DOM nodes and attributes are added and removed. And presto, the DOM is dynamic and no longer as predictable.

Then CSS enters. CSS is a also declarative programming language. But, there is a big difference in the context of interpretation for CSS and HTML. HTML is primarily interpreted only against an empty background and itself (at least if you exclude elements slotted into web components and embedded HTML fragments); CSS is interpreted against the dynamic DOM *and* itself. The cascading, overlapping rules of CSS both apply to each other *and* to the *dynamic* DOM. CSS is operates in a *much more* complex context than HTML. To declare CSS is in principle to write a program *against the changing output of another program*.

But. Why don't we see this problem? Why do we only feel it? One aspect of declarative programming languages such as CSS is that they can *make you think* about the state of the app as static (ie. the concept that linguists call "synchronic", timeless). They lull you into a false sense of simplicity. If the data model is purely static, this synchronic simplicity is great. But. This is not the case for CSS. CSS operates against a DOM that is dynamic, both in the sense that it might change dynamically run-time *and* in the sense that developers might change it during the life-cycle of a project. The "state" underlying CSS programs is "mutable and dirty", not "static and pure".

As developer experience grows, the sense of this discrepancy grows. The more experience a developer gets with dynamic DOMs, the less natural it becomes to view them as stateless. But, the declarative grammar of CSS still "talks" as if it is. CSS has a "declarative pull" towards seeing its context as static and pure. This pull is counter productive and produces unintended results.

But why do the belief in CSS persist? There are many myths about programming languages. And one frequent flyer is the myth of the simplicity of declarative programming.

I will not here make a full account of when, how and why declarative programming is hard. I will only declare that:
1. it is not so and 
2. force you to trust me on it. 
 * Only in the comments will I add a note: declarative programming languages has been around us for a loooong time, and people have widely chosen *not* to adopt them beyond simple data structures such as HTML.

CSS is a declarative programming language. And some aspects of declarative CSS programming should be considered simple: using a simple query selector to attach a property on a group of elements is straight forward (enough). Simple CSS inheritance of properties such as `color` can also be considered foreseeable in any context. 

But, the declarative rules of CSS quickly become tricky. Some CSS properties, and thus some CSS rules are affected by HTML semantics. For example, if you set `list-style-type` above an `<ul>` in the DOM, will the `<li>` elements still inherit the specified `list-style-type`? I don't exactly know. `list-style-type` is inherited, but I am not sure if the semantics of `<ol>` and `<ul>` elements break this chain of inheritance, or if they only do so in case the inherited `list-style-type` is incompatible. Also,  imagining all the possible targets of many CSS queries can be incredibly hard, especially against a dynamic DOM that includes other HTML fragments, either server-side or client-side.

To run a program against the dynamic output of another program *and* development process is extremely hard. CSS just gives you a false *sense* of simplicity. And there is one area where this false sense of simplicity becomes most apparent: CSS layout.

## CSS layout: the devil in things

By far the most complex feature of CSS is layout. CSS layout require the interplay between:
1. two different CSS layout dynamics, position and block model, 
2. different sources of length measurements,
3. several different elements in the DOM (not only parent and child, but also other ancestors and/or descendants and siblings),
4. and more. 

These dynamics are codependent: alter the block model or positioning of an element, and you can change *both* layout dynamics and measurements for *several* children, descendant and sibling elements in the DOM. These dynamics also not only flow down the DOM, but also *up the DOM*. An element height and width is commonly calculated as the sum or product of its children elements.

Programming CSS layout, is to sync *at least* the following dimensions:
1. the position system of the element, its inner elements, its sibling elements and the outer elements.
2. the sizing mode of the outer, inner, sibling and self elements.
3. the scaling of the length units. What is `1%` for this element? What is the current `em`?  What is the `viewport` context for the elements? How can and should I change and maintain the scaling context for the element?
4. The `box-sizing` context. How do margins and borders affect size?
5. And what else have I forgotten here? What else "can go wrong" when you declare the CSS layout? What else might be affected?

The layout of an element is thus flush with bindings to other elements. In CSS *and* HTML words are specified that require the *existense* of other HTML elements and CSS rules to make sense. There are lots of explicit and implicit semantic relationships between the elements.

These layout dimensions must not only be in sync at the beginning, but also *while the DOM mutates*. Add, remove, or move an element in the DOM, and you must ensure that this change does not affect the layout properties of many, many surrounding elements. DOM changes and CSS changes, must be in sync.

To assume that such relationships simply exists is false hope. This layout context is set up and maintained, both explicitly and implicitly. All these dimensions must be synced, by the developer, even when sync-ing them simply means to specify nothing, relying on the default, empty rule. 

There is no way to fix these underlying problems *with* CSS. You cannot separate the semantics of layout from the semantics of HTML elements. You cannot isolate CSS rules to a single layer of elements. You cannot isolate layout from other behavior such as event management. There is only one way to truly fix these problems. And that is *without* CSS. The semantics of multi-element layout must be moved back into the HTML element and merged with its other semantics. It cannot be avoided. And there is one way to actually do so: web components.

## Do layout web components

When you need a custom lay out of one or two or three or four levels of elements, make custom web component patterns. The best example of what this looks like is the good'old `<table>` element. "Omg, wtf, did you say `<table>`?!?! Is you answer to the problems of CSS layout `<table>`? Are you freakin(!) kiddin me?!"

No, I am not. But when I say `<table>`, I do not mean that you should use the actual `<table>` element in your web app. I mean that you should *make your own* `<table>`-like web components. That you should make pairs of web components that fulfill a purpose similar to `<table> <tr> <td>`, but in their own way. That you should focus on making web components whose purpose is layout, that handle and encapsulate all the CSS properties of layout and event management associated with for example scrolling into a set of semantically and logically bound pairs of web components. 

There will be thousands of them. Some super small, some super elaborate. And it *is* faster for you to make your own such elements
if you can't find other good ones to reuse than it is to try to *avoid* such encapsulation and mix the
low level CSS layout in your other HTML documents.

Now, you might think that it might be a good idea to have just *one* CSS grid in the main document.
After all, that is not so complicated. But. No. That one grid is likely connected to CSS media queries
and custom event interaction. That means that a set of event listeners, CSS styles and CSS media queries
and maybe some DOM elements, that can successfully be encapsulated in a web component is poured into 
the main document. And once that bowl of spaghetti is boiled, these conceptually isolated threads are 
much harder to get out.

`<table>` is not the only relevant role model for you layout web components. `<ul>`, `<ol>`, `<li>`
is another. `<select>` and `<option>` a third. `<form>` and `<input>` yet another. The list goes on.
Making such resuable elements *saves* time. And *removes* layout from the CSS in the main document.

## Content model and category

currently the content model (ie. inline elements can only nest inside itself other inline elements, 
not block elements) is based on the element type. In web components, there is no such model to specify
which other type of elements *can be* slotted into what `<slot>` element. To declaratively specify
a `<slot>` and/or `<slot>`-filter based on element type, is something that is lacking in the web 
component standard.

How and when to specify such element type "categories" and content models, that is something that needs
to be worked through. However, I believe this can be simply taken out. I also believe that ARIA roles
should consume the content model. And, I finally believe that ARIA roles should be setable via CSS.

## How to fix CSS?

This article only advocate for the abolishment of CSS layout *in the main HTML document*.  CSS layout, in the main html document, should be replaced with reusable web component pairs that solve one particular layout problem, for all relevant displays. CSS layout must still be used to make the resuable layout web components (low level). After I am done today, there may still be multiple CSS documents on the top-most lightDOM level which control `colors`, `fonts`, `border` and `padding`. But, neither beginner nor expert developers should manage *layout* in general CSS scripts, CSS layout should be *moved* into special web components that *only* solve a layout use case. This is were the CSS grid will shine. As the low level means by which "a thousand different HTML `<table>` elements arise. **All layout should be controlled by web components**.


## References

 * 

## Drafts

CSS `color` is (almost) technically context free (although it needs *active design*, someone with a good, trained eye needs to make them match). Font-size is as good as context free. But such "pure, single element-context" CSS declarations (read: properties) are the outliers. Most CSS declarations operate in a multi-element context. And the DOM, the data model, which CSS operate against *is* impure. It *dynamically* mutates all the time. CSS is a dream. For it to be a good dream, its rules should be *more* independent from each other. For it to be a good dream, its data model should be "purer, less dynamic". Program CSS layout, and you feel it. Look at all the history of failed attempts of finding the *right way* to declare layout across elements.


Because of the inherent complexities of the task CSS is trying to solve with controlling layout in the DOM, the smartest and brightest engineers and programmers behind CSS has *failed(!)* again and again in solving this problem. In the list of notoriety we can include CSS `float`, `flex`. The latest and greatest and trendiest CSS layout solution is CSS Grid, in *no doubt* the very best solution so far, but also in no doubt a solution that falls short as soon as the web will evolve to its next dimensions (don't forget, the `grid` is only 2D. Are you sure that a 2D web site will be "good enough" in 2 years time?)
 
