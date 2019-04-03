# Theory: VariableExpectations

Lots of things are subjective. What you like for breakfast. Who you'd like to marry.
What tickles your bones. And what not. But, are programmers' expectations *only* subjective?
Or do programmers share some objective expectations that cannot be freely altered?

As described earlier, the `<slot>` element can transpose elements from the lightDOM into 
positions in the shadowDOM. They are shadowDOM placeholder elements. 
They point to elements in the lightDOM.
The `<slot>` element resembles a programming variable. 

But. It is not exactly a programming variable. There are subtle differences between "slotted" elements
and values a variable point to. Subtle differences that can and do become important when `<slot>` 
elements are chained, inspected (`.assignedNodes()`), styled (`::slotted()`) and dynamically altered.
And, as we will see, these differences can and become problematic. And so to better understand
these more in-depth issues of the HTML `<slot>` element, we will start with a discussion about what 
a programming variable is and how `<slot>` elements differ from how we might assume an HTML variable
would behave.

## What is variable resolution?

In programming languages, a **variable** points to a **value**. 
**Variable resolution** is the process that identifies *which* value a variable points to and then 
gets that value.

In high level programming languages, such as JS, variable resolution happens automatically
every time you use a variable. Place a variable reference in a JS expression, and the JS run-time
will replace the variable with the value or object it points to when it performs the calculation.

Variables can also be linked: variable A can point to variable B can point to variable C, etc.
When linked variables are resolved, the process will resolve each step in the chain recursively:
If variable A points to B, then the value of A is first B.
Then, if B is a variable and B points to C, then the value of A is now C.
Then, if C is not a variable, either a value or null, then the value of A is the value C.
Put simply: *While A is a variable, A is the value it points to.*

At its heart, variable resolution is a process that **replace** the variable itself with the
**non-variable value** (or null) that it recursively points to. 
This means that variables exists in the text of the code, also while the code processes its code blocks.
Variables exists in the *run-time block scope* (and above). But, before a high-level language such as 
JS will execute an expression, it will first convert all variables involved into their non-variable value.
Variables therefore do *not* exist in the *run-time expression scope*.

## Variables in natural languages

Natural languages also has variables. Many different variables actually. With grammatical
complexity and diversity that far outweighs programming language variables. But, to keep things light,
here I will only focus pronouns.

Pronouns, such as "he" and "us", are quite similar to programming language variable. "Pronoun" means
"in place of ('pro') a noun". This is essentially the "a variable is a value placeholder" definition,
if we naively considers nouns to equal values (which is kinda true for some nouns while not so true for
other nouns). For example: `A man walks down the street. He is wearing a black hat.` `He` is a pronoun.
This pronoun points to the noun phrase `A man`. `He` can be used in many different texts, pointing to 
different nouns depending on the context. Naively, `He` is a variable, and `a man` and other noun phrases
the value.

But, let's try to describe the process of "resolving pronouns". The two "black hat man" sentences above 
has 12 words. If you read 300 words per minute; reading a word takes 200ms; and reading the two sentences
above would take 2.4 seconds. Very roughly speaking. Now, we call the 2.4 seconds *while* you read the
sentences for the *read time* process. Also, imagine that a parallel process called *interpret time* 
resolves the pronouns the *read time* process has just made available, more or less concurrently on the
*already read text content* while the read process continues to move forward. In the *read time data*,
pronouns can exist more or less freely. The text can add new ones, build on old ones. But, *interpret 
time* always tries to resolve and replace the pronouns with their appropriate noun. The process that
interprets the read text tries to build a model, a DOM if you'd like;), in which all the pronouns are
replace with their noun or other specifier content. That essentially turns the nice linear text into
a web of interconnected bits of information. Now, for the fun part. I will now prove this to you. 
In your own head.

"In medias res" is a literary technique. "In medias res" means "into the middle of things" and 
is a technique to heighten the readers interest by beginning the story in mid stride. It is the bookish
equivalent of stepping onto a running treadmill or jumping off a speeding bus. And we can create this
effect using pronouns: 

`She walks slowly down the street. In her hand she holds a red dress.`
`She` is introduced in the story *as if* the reader could *resolve* her identity, `her` value.
To resolve the noun behind the pronoun `she` is of course impossible as we have just begun the story. 
This causes our *interpret time* process some confusion: *Interpret time* is not comfortable with
unresolved pronouns, and it tosses up a little red flag so that we pay a little bit extra attention to
quickly find out "who `she` is". 

But. We are not twelve years old. We have seen this trick many times before. Our *interpret time* 
process is battle-hardened and blasé. It can easily cope with *a* simple "in medias res" pronoun, 
this will not grab our attention. To grab our attention, our *interpret time* process needs a bit more 
complicated pronoun resolution conflicts:

`Mary was the shorter one. Jane was tall. James was taller, but too much time at the keyboard made him 
crouch like an old man. She did not like spending time with her boyfriend.` 
Here, there is also a red flag situation. A girl who does not like to spend time with her boyfriend.
Imagine that, unthinkable. But, the biggest problem for the *interpret process* is not the breach of
female stereotypes, but the unresolved pronoun `She`. Does `She` point to `Mary` or `Jane`? And is
`James` the `boyfriend`? And if `She` is `Mary` and `James` is the `boyfriend`, then that would make 
`Mary` `James'` girlfriend? Or is it `Jane` and `James` that's a couple?

This conflict of pronouns may intrigue or annoy you. Unresolved pronouns do, because they complicate 
building the reading DOM in your mind. We have no problem *reading* pronouns (reading time), we have a 
problem remembering too many loose ends, unresolved pronouns (interpret time). Due to our exposure to
naive "in media res" pronouns, we can turn "she" into a noun in our interpretation. We can even read 
stories with several "she" come nouns, although that would be tiresome for little added effect.
But, to leave too many pronouns unresolved, that will annoy. That will require us to apply more 
concentration and mental effort than we are comfortable with. 

As with programming language variables, natural language variables such as pronouns are *replaced* by 
their (more fixed, less variable) noun relative. In this continuously growing mental model of the story,
you will easily remember if the `Jane` and `James` were a couple. But, you will *not easily* recollect 
if `James` was referenced as `the boyfriend`, `her boyfriend`, `he` or `him` in the text were this 
connection was established. The mental model *interpret time* does not retain the pronouns used 
*reading time* to establish the references, it replaces and removes them.

Thus, both programming and natural languages have generic variables that *resolution replace* with
either specific values or at least more specific variables (such as nouns).
We expect to hear and read text that contain generic variables. But we expect to *replace* the
generic variables with their more specific counter parts as we build our interpretation model. 
This method of resolution by *replacing* generic variables with values/more specific variables is
likely genetically encoded in our brains, or at least strongly culturally cultivated across all our
languages. And this is objective, an expectation about how a variable should be processed both by us
and our systems that all programmers share, to only slightly varying degree. To break this anticipation
would be to go against not only programming language conventions, but also conventions from our natural
languages. 

## Variables in Prolog

Prolog is a declarative programming language. If you don't know Prolog, you are not missing out. 
It is like a powerful database query language built for max conceptual power, 
but with no regard to performance. Thus, if you have all the data accessible in memory, 
you can make fantastic data queries. But if the data is too big for that, or if you have to 
get data over a network, Prolog performs poorly. Sure, if you really like it, knock yourself out. 
But for most of us, Prolog is mostly a distraction.

However, being declarative, Prolog resembles HTML and CSS in many ways.
And so variables in Prolog is a good platform to understand the `<slot>` element.
With this in mind, we take a look at Prolog variables. And we start with an example:

```
man(james).
man(charles).
woman(elisabeth).
parent(charles, james).
parent(elisabeth, james).
mother(M, C):- parent(P, C), woman(P), P = M.

? mother(X, james).
```
In the example above, eight rules and a query `? mother(X, james)` is specified. 
The eight rule `mother(M, C):- parent(P, C), woman(P), P = M.` defines three variables:
`P`, `C` and `M`; the query one variable `X`. The question is, what does `X` look like?

If you read the example carefully, you will probably be able to assume that `X` = `elisabeth`.
You might also be able to guess what rule you needed to query `? father(Y, james).`.

Normal variable resolution would mean that `X` would be *replaced* by `elisabeth`. This means that
in Prolog, `? X = elisabeth, mother(elisabeth, james) == mother(X, james)` would yield `true`. And it
is.

## How `<slot>` conceptually differs from normal variables

Elements in the lightDOM are "transposed" to a `<slot>` in the shadowDOM, they are not "assigned".
The term "transpose" is meant to signal that `<slot>` is not a normal HTML variable, but an HTML placeholder
that will be "filled with" other HTML elements, and not "replaced by" other HTML elements when they
are interpreted in the next model (ie. the flattened DOM).

If "transpose" variable resolution were applied to Prolog variables:
`? X = elisabeth, mother(elisabeth, james) == mother(X, james)` would be interpreted as 
something like `? X = elisabeth, mother(elisabeth, james) == mother(X[elisabeth], james)`. 
The X in the last expression would no longer be replaced by `elisabeth` value, but instead 
*filled* with this value. Thus, `mother(elisabeth, james)` would no longer be the exact same as 
`mother(X(elisabeth), james)`. Such variable behavior would indeed be conceptually alien.

If the "transpose" variable resolution were applied to pronouns such as `he` and `she`, this 
would have the implication that we needed to remember by which pronoun a connection between nouns and
other phrases were made. In the first example above, it would be considered meaningful to remember
`A man` is `he` is `wearing a black hat`, and not just `A man` is `wearing a black hat`. 
Remembering this linguistic, *read time* detail feels unnecessary and borderline autistic.

These details might seem superfluous. And, they are irrelevant for naive use of `<slot>` elements.
But, more often than you would like, "transposition" becomes relevant: If the `<slot>` element itself
happened to be styled, likely by accident, the style will be visible in the flattened DOM as the 
`<slot>` element is retained and *not* replaced in the flattenedDOM. To retain the `<slot>` in the 
flattened DOM confuses styling, it does not aid it. The quality of "transposition" 
is also relevant when `<slot>` elements are inspected using `.assignedNodes({flatten: true})`,
a method with a misleading name. The structure of the filled `<slot>` elements does not represent the
structure in the flattened DOM and the nodes are transposed, not assigned. And, last but not least, 
`<slot>` fallback node behavior *follows* the natural replacement concept for its immediate `<slot>`,
but is *filled into* any chained `<slot>` element. We will (have to) return to all of these problems
later when we discuss how to work with chained `<slot>` elements.

The discussion of `<slot>` element will conclude with a proposal for a regular, true HTML variable
that by following normal variable resolution with more clarity can replace both `<slot>` and 
`<template>` elements as one. Realistic? Maybe not. Useful to better understand both `<slot>` and 
`<template>`? Yes. Yes indeed.

## References
 

 