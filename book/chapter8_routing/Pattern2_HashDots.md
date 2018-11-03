# Pattern: HashDot

**HashDot** is a hybrid format combining the URL convention with hashtags.
The purpose of HashDot is to describe and route links that:
 * are familiar and user-readable
 * have a form that represent their content
 * scale functionally to enable developers to build more powerful client-side applications
   with less complexity.

## A HashDot is a #-tag with .-arguments

A HashDot is at minimum a hashtag, ie. "#keyword". Often, this is enough. 
But, if you need to specify something about the hashtag, you can add a "Dot" to it.
The "dot" is a simple argument value prefixed with `.`. It very much resemble filetypes in filenames.
The value of Dots can be either a word, a number or a quote.

diagram 1. Illustration of a HashDot.

## HashDot sequences
Several HashDots can be listed side by side as a sequence, ie. "#shoes#men".
As hashtags in a tweet, this enables an author to point to several hashtags at the same time.

diagram 2. Illustration of a HashDot sequence.

## Matching HashDots

One HashDot sequence can be matched with another HashDot sequence.
In order for one sequence to match another sequence, 
the second, "right-side" sequence must be a subset of the first sequence.

diagram 3a. Illustration of one HashDot sequence being a subset of another HashDot sequence.
Left: #one.abc#two.d.e.f#three  Right: #two.d.e.f#three

diagram 3b. Not matching sequences.
Left: #one.abc#two.d.e.f#three  Right: #one
Left: #one.abc#two.d.e.f#three  Right: #one.abc#three
Left: #one.abc#two.d.e.f#three  Right: #one.abc#two
Left: #one.abc#two.d.e.f#three  Right: #three.g

## DoubleDot: HashDot variables
A HashDot variable is a HashDot argument that starts with a double-dot ':', and not a dot '.'.
HashDot variables are called "DoubleDot arguments", and regular HashDot value arguments that are
prefixed with '.' are called "SingleDot arguments".
DoubleDots look like SingleDots, except that they are prefixed with `:` and cannot be quotes.
When two HashDots are matched, 
an unassigned DoubleDot argument will match any SingleDot or DoubleDot on the opposite side.

diagram 4. Matching sequences with variables
Left: #one.abc#two.d.e.f#three  Right: #one:X  {:X => abc}
Left: #one:X#two.world  Right: #one.hello#two:Y  {X => hello, Y => world}
Left: #one.abc#two.d.e.f#three  Right: #one.abc#two:X:Y:Z  {:X => d, :Y => e, :Z => f}

## DoubleDoubleDot: HashDot group variables
A HashDot DoubleDoubleDot is a variable that can capture all the arguments on the opposite side.
The DoubleDoubleDot is prefixed with `::`.
When the DoubleDoubleDot argument is used, no other arguments can be added to the hashtag;
the DoubleDoubleDot must stand alone on the hashtag.

diagram 4:
Left: #one.abc#two.d.e.f#three  Right: #one::X  {X=> \[abc]}
Left: #one.abc#two.d.e.f#three  Right: #two::Y  {Y=> \[d, e, f]}
Left: #one.abc#two::Z#three     Right: #two.1.2.3  {Z=> \[1, 2, 3]}
Left: #one.abc#two::Z#three     Right: #two:A:B.3  {Z=> \[:A, :B, 3]}

## HashDot rules: <=>

A HashDot rule is a statement that says that one sequence of hashdots can be replaced by another.
The HashDot rule consists of two HashDot sequences (left and right) separated by the HashDot rule sign "<=>".
If a first HashDot sequence matches the left-hand side of a HashDot rule, 
then the matching HashDots in the first sequence can be replaced by the HashDots on the right-hand side of the rule
(with the given variable values).

diagram 5a:
First sequence: #one.abc#two.d.e.f#three  Rule: #one:X <=> #four:X.123  
Result: {X=> \[abc]} and #four:X#two.d.e.f#three 
Result (flattened): #four.abc#two.d.e.f#three 

HashDot rules work both ways.
By matching a HashDot sequence with the right-hand side of a rule, 
the matching sequence can be replaced by the left-hand side of the rule.

diagram 5b:
Left: #two.d.e.f#three#four.abc.123  Rule: #one:X <=> #three#four:X.123 
Result: {X=> \[abc]} and #two.d.e.f#one:X
Result (flattened): #two.d.e.f#one.abc

# References

 * dunno