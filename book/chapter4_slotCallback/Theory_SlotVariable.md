# Theory: `<SLOT>` as an HTML variable

## What is variable resolution?


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


## Problems on the horizon

Unfortunately, there are negative consequences from chained `<SLOT>` elements,
both for CSS encapsulation and the algorithm for flattening `<SLOT>`s.
When more `<SLOT>`s are linked and the process of
assignments become more complex, 
these consequences makes the conceptual structure of the `<SLOT>` harder
to keep in mind for the developer.

## References

 * 

## old drafts

## Why variable simplicity?

The concept of variables and variable resolution is super simple. 
And there are several reasons it is simple.

1. **Practical and technical.** 
Variables and variable resolution **needs to be** as simple as possible.
Variables are used everywhere in a computer program, and 
variable resolution is one of the most common operations in any running program.
Variable resolution therefore cannot contain a lot of excess edge-case processing
as this would spread these excesses everywhere in the run-time environment.
Variables and variable resolution needs to remain as simple as possible 
to keep the run-time environment lean and fast.

This is not to say that variable resolution algorithms are not troubled with excess
technical and principal issues. In soft typed languages such as JS need automatic type conversion
when passing a variable with a resolved value of a certain type into any function or expression.
But still, variable resolution strives toward utter simplicity, 
to keep the run-time environment as lean, manageable and scalable as possible.

2. **Mind ergonomics.** 
Variables are ubiquitous in most other programming algorithms.
An average JS function might contain 4-5 variables, spread across different scopes.
If these variables themselves contain edge-cases and custom rules for how they are resolved,
then you as a developer would also need to consider and "keep these edge-cases in mind".
The more complex your variables intrinsically are, the more complex all your algorithms inevitably becomes.

Complexity in the programmer's mind is the most precious resource of all.
Keeping variable resolution simple makes the programming environment simpler.
Too complex variables, and the programmers flee the environment to find bluer, clearer skies elsewhere.

## Why programmers expect replaceable variables?

### Reason 1: Familiarity from other programming languages

Replaceable variables are most often the *very first* construct a novice programmer learns.
Along with values and basic expressions, variables are quintessential to programming,
a basic necessity with which other more complex constructs such as functions, scopes and classes can be built.
Without variables, you are basically left with HTML pre web components.

Replaceable variables are also used in other programming languages.
JS use variables that it resolves by recursively finding and replacing it with its non-variable value.
CSS variables (ie. `var(--some-custom-css-property)`) are also resolved similarly.

Prolog grandmother example.


### Reason 2: Familiarity from natural languages

Variables are not confined to programming languages.
In English, pronouns and other grammatical structures also function as variables.
Here is an example:

"A man stands at the corner. He is holding his wife's hand. 
The two have a child with them. Who are they?"

If you are at all paying attention to what you read, 
your mind will give you at least one feasible answer to who 'they' are: 
"a man, woman and child".

Looking at the text, a crude variable analysis can be performed too:
'they' = 'the two' + child & 'the two' = 'he' + wife & 'he' = a man. 
Ergo: 'they' = 'a man, his wife, a child'

Sure. In English and natural language in general, 
textual variables are far more complex than this crude analysis depict.
Textual variables in natural languages has *a lot* more edge cases and
are resolved by using extensive cultural, situational, personal and social inferences.
You name it, and people use it to resolve some kind of variable textual reference.

But, some similarities still shine through. 
First. Like in programming languages, textual references like the one above are "resolved recursively".
To *stop* resolving 'they' at 'the two' + child would be unexpected, to say the least.
To *not* be able to backtrack and resolve the variables above across 2-3 sentences would also be unexpected.

Furthermore, there are limits to how many natural sentences we can remember in detail.
This in turn limits how long we can wait *after* encountering a textual variable and *until* we
resolve that variable. 
To use a pronoun to refer to a noun 5-10 sentences back would be rude, 
even if no other textual reference in between interfered with the intended reference.
This wetware, short term memory limitation *must* be adressed.

To work around this limitation, our natural language mind therefore needs to concurrently resolve
these textual variables *while we converse or read*.
If textual variables are not resolved while we read a book, 
then the exact structure of sentences across hundreds of pages must be remembered with photographic presicion.

Another, related limitation, is the textual variable vocubaluary.
We have roughly as many pronouns as we do finger and toes.
A text that refers to "it" all the time, quickly becomes childlike and/or unreadable.
Our mind therefore cannot preserve an infinite number of otherwise meaningless textual variables.

our mind must find a strategy to distinguish in themselves textual variables such as
pronouns. 

### Programming language variables as a mirror of how our short term memory works (best)

My hypothesis is that the human prerequisites that we see shape variables in programming languages, 
are the same prerequisites that long has shaped variables in natural languages. 
It is not primarily the limitation nor structure of the underlying computer hardware 
that gave us recursive, replaceable variables; 
variables in programming languages are the way they are because that is what works *best for our minds*.
We can then use the structures of how we as developers manage programming language variables to 
describe how we manage textual variables in natural language.

In conversation, our short term memory quickly fills up as new sentences are added.
If you tell me one single sentence, I might be able to parrot it back.
Tell me three sentences, and I might start to make mistakes.
Tell me five, and I will tell you the same thing with my own words.
Tell me ten, and I will tell you a different story.

To abstract meaning from textual references, we therefore cannot attempt to hold on to text in itself
too long.
Textual variables, such as pronouns, must therefore be *concurrently* processed if to be useful in 
texts of more than 5-10 sentences.
*And*, these concurrently resolved variables must be temporarily remembered somewhere, in some sort of
make-shift register.

Furthermore, the process of resolving unexpected references can be cognitively tough, as most have experienced. 
To only resolve references by back-tracking therefore would make the mind constantly on the back-foot.
Instead, the mind is better served by (precursively) anticipating and *pre-resolve* common textual 
variables such as key relevant pronouns.
In our example, most English speakers would likely already have formed an opinion about who
'they' are as soon as the man grabbed his wife's hand.
This concurrent, recursive and precursive resolution of textual variables all contribute in 
making it as simple and light-weight as possible for the mind to keep up in conversation.

The register of pronouns and textual variables are also kept as flat as possible, pointing primarily 
to the textual references values.
In our example, we don't view 'they' as a long chain of variables; 'they' is just a group of three people.
If we moved chains of textual references from the text to the variable register,
our cognitive limitations would simply break that register instead of the short term memory of spoken words.
Flatten textual variables immediately, and less work needs to be done in the future.
Intermediate textual variables can quickly be garbage collected.

Once flattened however, we can remember and manage more values than variables.
The values can be composed in mental imagery and models giving us a maps and metaphors
on which to append data. There are clear wetware limitations here too, but 
envisaging 'a man, woman and child standing on a corner' can free our mind up to talk about 
new textual references and define new 'he' and 'they'.



this register will .
This register can house a fairly rich landscape of objects, but 
when pronouns and other assignable textual references are limited to a set group.

This means that as new sentences are added, 

 maintain and reduce a register of such "active pronouns" or textual variables.
If no pronoun would never be forgotten, then active textual variables would explode.




                      natural languages perform similar steps to resolve this process as do programming languages.
Or rather, 


And the only means by which to keep the amount of linguistic detail from exploding,
a current register of state, a set of "active pronouns", must be kept 
in which running variables can be *replaced*.

Second. The pronouns above are *replaced*. To know that 'a man' is now 'one of them' is immediate:
you do not have to reason from 'they' to 'the two' to 'he' to 'a man' to know that.
In our mind, we keep track of 'they' as three persons, 'a man, woman and child' *while we read*.
In 'they', the intermediary pronoun 'the two' gets resolved and replaced.
Sure, while the text still lingers in our short term memory, 
we will be able to recount such intermediary steps:
we can re-member that "the two" was established before "the child" was introduced. 
But, if we fill our short term memory with other details, 
we are likely to forget the intermediary steps while still maintaining the current state of who they are.
Intermediary steps gets garbage-collected, so to speak, and 
this garbage collection does not interfere much with our memory of the current state of active pronouns.

Thus, variable resolution is not only familiar from programming languages.
Similar algorithms and forms of thinking also exists in our natural languages.
Although different from programming language variable resolution,
natural language variable resolution also work recursively and *replace* variable values with values,
while it still remains uncalled for.

Natural languages also gives us a que that our mind is relatively good at keeping track of things, 
keeping the current inventory of variable values up to date.
But, natural languages also gives us a que that our minds are not really concerned nor particularly
adept at remembering *how* these variables *got* their current values nor the earlier state of the inventory.
Our natural language variables are *living in the now*.

## Clash of expecations: resolution vs. transposition



#### Pronoun-guessing-games 

Stories with enveloped pronoun chains should show that:
1. readers are very adept at "while reading" keeping tabs at current group composition and pronoun resolution,
even though these pronouns are extensively envoloped.
2. readers would struggle to remember the middle steps and which intermediary variables were used,
after only a short while.


on "what pronouns"

To test this is a bit more problematic, but lets still try.

"Jane is a woman. She has a red car. 
James is a man. He has a blue car. 
Janet is also a woman. She has a green car.
Jaja Gaboor is also a woman. She has a purple car with yellow leather interior.
Her name is really spelled Zsa Zsa Gàbor."

Now cover the text above with your hand before you answer the question below. 
1. How many women are there?
2. How many cars do they have?
3. Which color are their cars?
4. Who owns which car?"

The easiest questions are 1 and 2. We remember them all as a group.
Question 3 is more difficult. The car colors can get blurry.
Question 4 is most difficult. Remembering the names of women is always tricky, at least if you are a guy.

What does this tell us? 
Quite a lot, actually.
Once Zsa Zsa Gàbor enters the stage, our mind will start struggling to remember the names and gender
of the other people involved. 
be given a lot It is too difficult for our mind to remember Jane, James and Janet ,
but we do remember that there were some persons there, and maybe their sex.

First of all, it tells us that it is simpler for us to recall the women and their cars as a group
rather than as individuals, even though we were only presented with them as individuals in the text.
This implies that we both:
 * mentally construct at least one group construct (an invisible "they") while we read the
above text,
 * that we do so without explicitly being prompted to do so, and
 * that we keep this 'they' resolved.
That we likely discard too detailed information (their name) if we don't expect to really need it.


We don't need to know their name to remember them as a 

And, most important, I think we all can recognize that "keeping track" of this "in between"
connection and thus being able to answer question 4 correctly, would be most worthy of applause among the lot.
Now, if you recognize that it would be simpler for the mind to keep track of the cars as a group
instead of as 

"Two men and two women are standing at a corner. The men are together. The women are together.
They are not married. Who are they?"

Faced with this question you likely start to ask yourself some questions. 
"What do you mean with 'they' here?
Did you mean that the two men were not married to each other, or that the two women are not, or 
did you mean that the men were not married to the women? 
'They' could mean three different 'things' in this text: 
a couple of men, a couple of women or two heterosexual couples."

If you just experienced this conundrum, or another variant of it, 
then you just felt the "recurse and replace" algorithm at work inside your own English language neurons.
The example above was intended to alert you of this algorithm by making the resolution
textually ambiguous and contextually problematic.
The pronoun 'they' was contextually not easy to resolve.
This leads the developer 


"He" is John. "She" is Camilla. "They" is "he" and "she". Now, ask yourself:
Is "they": "he which is john and she which is Camilla"? Or, is "they" simply "John and Camilla". 
We resolve the pronouns.

I think the dichotomy is transpose and resolve. Both are assigned. 
But when something is transposed, the original link structure is preserved. 
When something is resolved, the link structure is removed.
