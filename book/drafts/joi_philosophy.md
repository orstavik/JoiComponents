## The JOI mission

To work with JOI is:
 
 * **simple**. JOI require *no* CLI or other design time support framework. This means that you
   can use it directly in any pure text editor and online sandbox such as codepen or jsfiddle.
 
 * **clean**. Individual JOI resources have *no* bindings to each other. 
   JOI is no [octopus monster](https://en.wikipedia.org/wiki/Cthulhu), neither explicitly nor implicitly. 
   At the same time, JOI is complete. JOI provides *a solution to the whole problem*.
   JOI is *externally modular*: you can *truly* pick and choose. 
   JOI is not only *internally modular*, split up into codependent modules to keep its own development 
   going fast forward.

 * **easy**. When possible, JOI specifies the solution as a design pattern/cookbook recipe.
   Instead of providing our own way of doing things as JS scripts, 
   we solve problems and use-cases using only the standard, native resources when we can.
   The use cases are still there. The problems are still solved. They are just solved using the most
   familiar resource of all: the platform. The standard is JOI's only binding and dependency.
   
 * **FUD free**! Web frameworks are great. They give us black boxes full of magic and wonder. 
   But, have you ever wondered what *actually happens* inside your framework? Have you ever been
   uncertain about what the framework does? Have you ever doubted your own code because you don't know
   exactly how the framework will react? Have you feared your own or another developer's platform and 
   framework?
   
   JOIs mission is *not* to give you another black box of magic. 
   JOIs mission is to expose all the wonder, problems, use-cases, choices, decisions, patterns, and
   implementation behind modern web frameworks. 
   JOI wants to give you a cookbook for *how to work with a modern, web component framework*.
   JOI is first the text-book manual, second the framework code.
   JOI explains and justifies itself, so you no longer have to.

### What is framework FUD?

Using a framework or library can fill your app with uncertainty.
You don't know what the framework does (the solution). 
And you often don't even know why it does what it does (the problem).
And as a framework often work on such a high level of abstraction,
combining so many solutions, combined and bound to each other,
and choose from so many different possible problems, 
each framework's design appear to be more idiosyncratic than conforming to law.
Until all the frameworks idiosyncratic nuances are learned, 
any framework will produce masses of uncertainty.

The uncertainty of the framework will further cause doubts.
What is the framework between my app and the browser really doing?
What will the framework do when I do this?
And more to the point, that vague, nagging sensation: what is it that the framework might 
be doing that I do not understand that can cause unexpected problems for my app in the future?
What if the framework changes its structure in the next edition, will I have to remake my entire app?
Etc. etc.

And this general uncertainty about what your code actually will cause of consequences and
the nagging, all-pervasive, vague doubt that this causes will eventually produce a generalized anxiety: fear.
This fear limits the developer, it gives him inhibitions about his own ideas, his code, his own abilities and more.
As he learns more about his frameworks idiosyncratic behaviour, he also becomes conscious of his own abilities within 
that frame of mind, and anxious about stepping outside of that frame and start the learning process all over again.

### Why are web frameworks struggling with FUD?

Such FUD, or rather U>D>F, is of course related to all technological, complex constructions.
The HTML and JS based browsers are also creations that will give you FUD.
However, there are four particular aspects of current web frameworks that is worth taking note of:
1. solution before problem,
2. feature before documentation,
3. framework creep into design-time, and
4. framework FUD is optional (where as for example browser FUD is not).

Frameworks often *imply* the problem baked into their *explicit* solutions.
The main reason for this is that their users are trigger happy and want to 
run their code against the framework,
and not read tons of documentation about their design and problems.
The desire for the design and problem description only comes later, 
when the developer has already committed to the framework.

Frameworks also compete very heavily in a market preoccupied with new features.
This makes the impetus to release new versions and new features, rather than to make documentation.
Also, for the developers of framework, documentation is neither personally necessary 
nor as fun to make.
This creates lots of pressure towards new features, and less pressure towards documentation.
A good thing about modern frameworks is that this trend seems to be reversing.
More and more frameworks are using more and more resources on documentation.

A development that is *not* trending in the right direction is the spread of frameworks *into* 
the design-time sphere of the developer (ie. build tool chains).
To make the code look nicer, structure better, run smoother and run everywhere,
frameworks require the developer not only to customize his/her run-time environment in the
browser, but also his/her IDE and build chain.

This is a *big* problem. It greatly heightens the FUD fence around the developer, aka. the silos,
and makes not only the semantics of the code bound to a framework run-time, 
but also the grammar of the code bound to a framework design-time.
As the current state of the underlying platform might vary against the current state of the art
in development method and possibility, 
the short term, individualized gains from such design-time aides *might*
outweigh the long term, collective losses.
However, this gap needs to be big in order for such benefits to have weight.
With the advent of web components, my clear and stated opinion is that any conceivable 
benefit of design-time bindings is greatly outweighed by its drawbacks.
Put simply, with web components and ES6 you don't need build tools for development
and you should not use build tools that alter your basic production based code 
(ie. today this means the code that can run on Chrome, Safari, Firefox and Edge).

So, FUD from framework is *optional* to a much greater extent today than it has been for many many years.
You will still have the FUD of the browser. 
This means that frameworks need to justify any uncertainty and doubt they contribute to the
development process up front.
They need essentially to address the basis, the problems and the strategies along with the solution.
As few choices affecting the developer should be *implied*.
