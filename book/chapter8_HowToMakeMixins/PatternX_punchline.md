# Pattern: Punchline

A punchline is one or two lines of dense, minified code.
Punchlines are designed to be directly copied into the code, 
not used via function calls or class extensions.
Although rarely funny, a punchline should "pack a punch" and 
do more than you would expect of a regular line of code.

Punchlines are most commonly used for regex queries.
But the method of extending and reusing code by punchlining components 
can also be highly beneficial. 

punchline for making the method wait a specified duration
`for(let start = performance.now(); performance.now() < start + 2000;); //occupies the main thread for 2000ms` 

## Discussion: When to use a punchline, and when to use a mixin?

There are complexity issues when using both mixins and punchlines.
If you are familiar with the mixin concept and perhaps use several other mixins in your project
and around the same element, mixin might sound appealing at first.
But, there are also strong arguments for the punchline approach.

### Complexity 
At first sight, any punchline *looks too clever*. 
Using arcane symbols, logical operators in unconventional ways and minified variables,
it formally oozes I'm-too-smart-for-my own good, and thus *feels fragile*. 
All your instincts tell you to back off.
I feel you. And I feel the code the same way.

But. By itself a punchline is less complex than it seems.
By itself, a punchline is just a *single line* of code. Placed in a *single location*.            
To understand it and feel confident in it, 
you most likely need to translate its quirky symbols, logical operators and variables into conventional code.
But since it is just a *single line* in a *single place*, such translation is actually ok.
Think of such rewrite of a punchline as the equivalent of skimming the source of a similar mixin.

Thus. A punchline brings *all* the complexity of an import to the surface of your code.
On the other side, a mixin will hide its complexity behind a veneer of familiarity.
Which is better is not necessarily given.

### Context
The punchline is used inside the `connectedCallback()` of custom elements.
It is meant to intercept the flow of control *from* the `connectedCallback()` even *before*
that control is passed on to any of the other mixins (*before* `super.connectedCallback()`).

But, using a mixin this is hard to accomplish.
If one of the other mixins also breaks the isolation rules and 
*do* perform another action before passing the control to the `setupCallback()` mixin, 
the mixin approach cannot fully control this context and timing.

By using the punchline directly in the `connectedCallback()` and not via a mixin,
this context that setupCallback will be run at the *very* beginning can be guaranteed.

### Documentation 
The hallmark of too clever code is lack of documentation. 
But a punchline does not have to be undocumented.
On the contrary. Single line punchlines can be made with thoughtfull intent
and be backed by several hundred lines of documentation describing the problem it solves, 
its logic and pitfalls.
Yes, punchlines are minified. 
But no, minification does not always equal obfuscation.

### Modularity

A punchline cannot be updated in a single place.
If you need to update the punchline, you would have to alter the code of all the files using it.
This will always be a drawback for a punchline.
 
If you use build tools extensively, which I personally do not recommend nor like,
you can generate punchlines in JS using scripts. But I do not recommend it.

All these reasons point to the fact that an immediate setupCallback implementation is best
implemented with a punchline.

## Reference
 * todo have anyone else described how to write punchlines for others to use? guidelines here i can reference?

## Benefits of punchlines


## Problems with punchlines
too clever

## When to use a punchline and when to use mixins

 * Code is located in a single place? punchline.
 * Code is spread across more than one place? mixin
 
 