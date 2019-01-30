
todo Should queries get their own symbols like:
  "#book ??" would ask for the rightmost resolution of #book, ie. HashDotMap.query("#book ??") instead of HashDotMap.transformAll("#book")
  "?? #book" would ask for the leftmost resolution of #book
  "#book ?" would ask for a single right resolution of #book
  "? #book" would ask for a single left resolution of #book

## The most important choice to make when making a programming language: internalize the query?

When making a programming language, the power of simply defining operators and native expression and base logic of the language
can quickly become intoxicating. For you as the developer of the language, it might be easy to remember this logic, as
you probably feel quite strong positive emotions towards them. But, for others, the multitude and variety of operators,
native expressions and other grammaticalized logic quickly becomes overloads both their interest and learning capabilities,
thus making them dislike the structure.

You also have two dimensions, the data structure and the functional structure. The data structure defines the space of
your programming language. The functional structure defines the causal logic in the temporal (and/or spatial) dimension
of your programming language.

When you make a programming language, you might desire to define custom grammatical structures for both the data structure,
and the causal structure. But, you should be aware to limit this desire. Try to make grammatical structures only for the
data structure OR the causal structure FIRST, and although you might specify rule-based behavior of all structures within the
domain, try to let as much of one dimension be specified in the program language where the language is used in the beginning,
to lessen the learning burden for the languages users.

In HashDots we therefore let the query/functions run against the HashDot data structures and rules be specified via
JS functions, and NOT grammaticalized as custom HashDots symbols such as ?? and ~= etc.

## HashDots iterator

takes a HashDot query as an input, and then walks the ruleset based on that query.
Each step of the walk is made up of two or more actions against the rules.
The first action is the specification of how the query can/must be matched against the rule.
This can be either an exact match (allowing variables to be bound), subset match, and superset match.

The second action is how the input and rule are combined to create an output.
When a query and a rule match, the HashDot iterator can either return:
1. the left side of the rule (.find())
2. the right side of the rule (.translate())
3. merge the right side of the rule into the input (.transform())
4. the raw match result

The HashDots iterator can also work both iteratively (default) and recursively.
When the iterator is in iterative mode, it will find matches checking against the next available rule.
In iterative mode, the HashDotsIterator is finite, it cannot create infinite loops.

When the iterator is in recursive mode, it will continue its work based on the produced result from the iterator,
starting from scratch on the ruleset.
In recursive mode, the HashDotsIterator is infinite. It *can* create infinite loops.

The HashDotsIterator can be made to go from leftToRight() and rightToLeft() (called .reverse()) for each rule,
and from topToBottom() and bottomToTop() in the ruleset (is most likely thought of as .reverse() too, todo).



 rules.reverse().query("input").translate()        //rules.reverse().translate().equals("input")
 rules.reverse().ruleIsSubsetOfQuery("input").transform()    //rules.reverse().transform().subset("input")
 rules.reverse().queryIsSubsetOfRule("input").find()         //rules.reverse().find().superset("input")

 reverse() -> make the rules go in opposite direction.

 find, finds the rules that fulfill the matching criteria
 translate, finds the opposite side of the rule that match the criteria
 transform, replaces the opposite side of the rule with the matching side of the rule in the criteria

 matching methods:
  equals: the input equals the rule a-side,
  subset: the input is a superset of the rule a-side
  superset: the input is a subset of the rule a-side

 .first()
 .tillTheEnd()
 Array.from()
 
 
 

  // #chp.1 ?< ...
  //
  //All the operations are described looking at the map from left to right.
  //But everything can be performed right to left, in reverse.

  //We have the matching first:
  // a) match exactly                             .matchAsEquals("#chp1")       => #chp.1
  // c) match the input as a subset of the rule   .matchAsSub("#chp1")          => #title#chp.1 & #chp.1
  // b) match the rule as a subset of the input   .matchAsSuper("#title#chp1")  => #title#chp.1 & #chp.1

  //                                              .matchAsEquals("#chp1", true)       => #chp.1
  //                                              .matchAsSub("#chp1", true)          => #title#chp.1 & #chp.1
  //                                              .matchAsSuper("#title#chp1", true)  => #title#chp.1 & #chp.1

  //The match returned is an:
  // x) an iterable result.
  // y) when we have the result, we can ask for the input, rule hit side, rule replace side (both original and flattened).
  // z) we can also ask for the input with the matching rule replaced within it as a subset.
  //    The match result must here internally contain the start and stop position and the variable map of the input where the match occurs.
  // w) when we want to run to completion, we simply make a loop that says,
  //    while there is a new result, use this result to make a new query from scratch until there are no more results available.
  //    This probably should not be part of the HashDotMap?? Just a pattern of how to use it??
  //    But how heavy is this thing?? Should I do as told and not consider performance until later?? yes, probably..
