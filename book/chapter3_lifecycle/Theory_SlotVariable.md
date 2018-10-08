# Theory: `<SLOT>` as an HTML variable

This chapter describes the problem of assigning nodes to `<SLOT>` elements.
This process is very elaborate and complex, and needlessly so in my opinion.
To understand why that is and how this process works, 
is best done by putting it up against what it could have been like:
variable resolution.

## What is variable resolution?

A **variable** points to some 'thing'. 
**Variable resolution** is the system identifying what that 'thing' is and giving it to you.
Variable resolution happens automatically, behind the scenes, every time you need to use that variable.

Variables can also be linked: one variable pointing to another variable pointing to another.
The link of variables end when a variable stops pointing to another variable 
(and points to another 'thing' or 'nothing').
When linked variables are resolved, the system will resolve each step in the chain recursively:
"If variable one points to another variable two, then the value of one is simply the value of two.
Furthermore, if variable two points to another variable three, then the value of one is simply the value of three.
Repeat this until the linked variables either points to a thing or nothing."

> **Variable resolution is to replace a variable with the `thing` it points to, recursively**.

The concept of variables and variable resolution is super simple. Because it *has to be* super simple.
Sure, there are issues such as casting and automatic type conversions.
But, variables are used everywhere, all the time. 
And so when you add complexity to the process of variable resolution, 
you add that complexity everywhere and all the time.
So, if you think you have a fair understanding of what a variable is and how it is resolved, 
then that is because you do. It is simple and clear. Because it must be for the language to be viable.

## `<SLOT>` as an HTML variable

For decades HTML has just been a data-format. To "program HTML" would have been a joke. Until now. 
When `<SLOT>` elements and shadowDOM suddenly appeared, and
HTML became a programming language. Of the declarative sort.
Today, you and I as ordinary HTML developers can 
'compose' (read: program) blocks of HTML (read: web components) that can be reused in different
contexts (read: HTML documents) to produce different results.
We can suddenly "program HTML for real".

In this new era of HTML programming, the `<SLOT>` element plays the role of the variable.
Like variables in other programming languages, a `<SLOT>` can point to other nodes in the DOM.
When "an HTML program runs" and the DOM is flattened, these other nodes gets assigned to and in essence
'moved into' the `<SLOT>`.
This very much resembles variable resolution, but also contain a key difference:
 * Normal variable resolution means "to switch out a variable with its assigned value".
 * Flattening slots means "to fill a `<SLOT>` element with its assigned nodes". 

To illustrate what this looks like, I will use an example from Prolog, 
another declarative programming language:
```
man(james).
man(charles).
woman(elizabeth).
parent(charles, james).
parent(elizabeth, james).
mother(M, C):- parent(P, C), woman(P), P = M.

? mother(X, james).
```
Now what would `X` look like? 

With normal variable resolution, `X` would equal `elizabeth`. The system might remember 
that you named your variable `X` in your query and so present you with an output looking something like:
`var X = elizabeth`. But in concept and practice when the program runs, `X` would be *replaced* by `elizabeth`.

However, if we look at `X` like an HTML `<SLOT>`, the flattening of `X` would return something like:
`slot X[slot M[slot P[elizabeth]]]`.
When a `<SLOT>` is flattened, it is not removed, it is filled.

The main reason a `<SLOT>` is filled and not replaced is because it can be filled with *multiple* values.
We can see this if we try another even simpler Prolog example:
```
parent(charles, james).
parent(elizabeth, james).

? parent(X, james).
```
We see that james has two parents, `charles` and `elizabeth`.
But, Prolog resolves its values normally. 
Therefore, Prolog only houses one value per variable.
So in Prolog, you would need to run this query twice to produce two values:
```
parent(charles, james).
parent(elizabeth, james).

? parent(X, james).     //charles
? parent(X, james).     //elizabeth
```
If a variable could be assigned *more than* one value at a time, like a `<SLOT>`,
then it could return `slot X[charles, elizabeth]`.

## References

 * 
