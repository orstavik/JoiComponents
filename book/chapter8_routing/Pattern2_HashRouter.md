# Pattern: HashDotRouter

## Alternative 1: hash-and-slash

Many SPA that use page-internal-links today follow this recipe:
1. Convert path+argument data into a `/`-based format.
   The `/`-notation makes the links *look* normal, even though they are not.
2. Add `#` or `#!` infront of the `/`-based location.
   This `#` would not belong in a normal `/`-based location, and 
   this makes the composed **hash-and-slash** link look slightly different and thus suspicious.
3. Convert the `/`-based link back out into path+argument data.
   This often require the parser to be aware of semantic properties of the different segments
   in the links as some segments might be path names while other argument values.
   
The **hash-and-slash** approach has two major drawbacks.
First, it looks familiar, but different. Uncanny.
Second, double conversion. 
It requires conversion of key/value-pairs into a flat, unary `/`-delineated format,
*and* back again.
To add a deeper syntax would break even more with established convention,
thus the `/`-format should be kept unary and flat.
((How to convert key/value-pairs into `/`-paths is described later in the chapter)).

## Alternative 2: hash-dot

The hash-and-slash approach search for familiarity *inside* established convention for web app navigation.
But, it is possible to find familiarity *outside* this cultural domain too.
Today, the `#` symbol is primarily associated with hashtags in social media.
Hashtags is a means for *thematic* linking and navigation.
This external convention can be drawn upon to create new familiarity for the user, 
which would ease adoption and lessen suspicion.

When we apply the hashtag convention to internal navigation in an app,
several route notation premises are turned upside down:

1. Singularity vs. plurality
   * `/`-path segments combine to point to a single name. But many segment names only yield one location.
   You only get one outcome from multiple `/`-segments such as `/this/is/a/single.file`.
   * Individual `#`-tags also point to a single theme, but multiple `#`-tags points to multiple themes.
   A tweet can contain an array of `#`-tags such as `tweet! #thinkingOutsideTheBox #moreIsMerrier`.
   * App internal navigation using hashtags should therefore embrace plurality conceptually.
   An app internal link can contain many hashtags, and the route itself can be used to compose
   unique instances of the view.
   On the conversion side, allowing the router *not to* squeeze multiple entries into a singular output
   also reduces the processing effort.

2. Page vs. component
   * The archetype of a path segment is a folder or a file.
   * The archetype of a hashtag is a keyword.
   * In app internal navigation, using keywords to point to key components fits.
   This also corresponds nicely with the composition principle above: 
   A path is a composition of one or more components.

3. Flat vs. deep.
   * The morphology of segment folders is flat, a folder only has a name.
   However, the morphology of segment files is deep. The `.` in a filename divide 
   the name from the file type(s) and can be nested several levels deep (cf. `script.min.js.map.tar.gz`).
   * The morphology of hashtags is flat. 
   * When we merge the convention of hashtags into url, can we also merge the convention of `.` in 
   filenames into hashtags? Would `https://app.shoestore.com/#marathon.42` make sense? 
   My personal opinion is that it does.

This new, hybrid format we call **hash-dot** links.

### Implementation hash-dot format

```
hash-dot-link := ([#]<hash-dot>)+
hash-dot := [\w\d]+<dot-values>
dot-values := ([.]<dot-value>)*
dot-value := [\w\d]+
dot-value := ["][\"]*["]
```

This can be implemented in JS like so:
```javascript
let links = location.hash.split("#");
links.length > 1;
links.shift();
links = links.map(link => {
  dots = link.split(".");
  return {
    name: dots.shift(),
    values: dots
  };
});
//todo do lots of special case handling, ""-string parsing, 
//empty link values (#one##three)
//empty dot values (#one..value)
```

And in regex:
```
//todo
```

## WhatIs: Route map

Principally, a "route" is a translation of one path into another path.
"Routing" is beneficial as it support:

1. **shortcuts**. 
   Translation *from* a shorter, simpler, implied format 
   *to* a longer, complex, explicated format.
   Example: 
   `goto train station` 
     => 
   `start at home, left 90deg, go 500m, right 90deg, go 100m, left 60deg, go 300m, stop`

2. **simplification**
   Translation *from* a longer, complex, explicated format
   *to* a shorter, simpler, implied format.
   Example: 
   `right 90deg, go 50m, right 90deg, go 50m, right 90deg, go 50m`
     => 
   `right 180deg, go 50m`

A "route map" is a table of rules for such translations.
In the route map, the simple form is on the left and the complex on the right. 
The route map is bi-directional, you can go from the left side to the right, but also from right to left.
In this way, both shortcuts and simplifications can be fitted in the same map.
((It is no strict rule that says you always have to place the shortened rule on the left and 
the verbose rule on the right. This can be flipped up side down. 
But, in the beginning, this order is beneficial.))

```
RouteMap

simple <=> complex
```

When routes have arguments, rules are matched on signature.
The most basic rule of matching would be to add the number of arguments with the name.
All these arguments must be matched from left to right, and vice versa.

Example:
The rule: `one.A.B <=> two.A, three.B`
Has the signature: `one/2 <=> two/1, three/1`
And from left to right match `one.hello.world`, but not `one.hello` nor `one.hello.beautiful.world`.
And from right to left match `two.hello, three.world`, but not `two.hello.world, three`, etc.
When the examples match, `A = hello` and `B = world`.

To grab all the arguments of a hashtag, use A*. 
This is especially beneficial when routes are used to simply extend a simpler expression.

Example:
The rule: `one.A* <=> one.A*, three`
Has the signature: `one/n <=> one/n, three/0`
And from left to right match `one.hello.world`, `one.hello` and `one`.
And from right to left match `one.hello.world, three`, but not `one.hello, three.world`, etc.
When the examples match, `A* = hello.world`(1,4), `A* = hello`(2), and `A* = ""`(3).

In sum, the router (map) form a *pure function*. The route map is given a route in.
This route can be seen as a potential middle.
It will then try to simplify the route to make a new left version.
This is done recursively with the route map function working from right to left, 
working recursively from the beginning of its ruleset for every new simplified version it can produce.
At the same time, the route map will also produce an explicated new right side version.
This is done in the same way, working recursively from left to right from the top of the ruleset.

### Anti-pattern? route-to-actionable

Many client-side routers implement some form of declarative funcion above, although usually less generic.
However, many client-sider routers *also* go another step, 
namely to connect the output route (the explicated right side) with an *actionable* object 
such as a JS callback function, an object or a class.
The first step is a pure, reversible function of parsing and clarifying the route;
the second step of connecting the route to an *actionable* is on the contrary an irreversible 
interpretation of the route.

To mix the declarative, reversible, pure route translation and clarification with the 
imperative, irreversible interpretation of route-to-actionable with side-effects, is unnecessary.
It provides no performance nor ergonomic benefit for the developer.

It is my opinion that explicated routes should be connected actionable entities
either in a state manager, separate controller, or root view web component.
To mix the connection of routes to actionable *inside* the router only muddies the water between 
what is the route, route map, route resolution and the rest of the app.
Thus, in this book, routes and route maps are kept pure, ie. without connections to actionables. 

## Implementation: HashDotRouter route map

1. HashDotRouter receives a route map on the form of:
```
routeMap = {
  one.A.B: two.A#three.B;
  one.A*: one.A*#four;
  ...
}
```

2. The routemap is converted to two regex to template exchangers:
```
leftToRight = {
  one\.$1\.$2: two/${1}#three${2},
  one\$_1: one${$_1}#four,
  ...
}
rightToLeft = {
  two\.{$1}#three\.{$2}: one.${1}.${2},
  one{$_1}#four: one${_1},
  ...
}
```

1. The hash-dot router listens for `hashchange` event:
   1. produce mostLeft by recursively running rightToLeft on the window.location.hash.
      The recursion tries to match and replace for each rule, top to bottom.
      Whenever the rule matches, then the result is run in the same function recursively.
      The rule returns the last result when no rule in the ruleset matches the result.
      Each rule in the ruleset can only be matched once, if not otherwise specified.
      No rule can be matched twice if it contains the same signature on the left and right side.
   2. produce mostRight by recursively running leftToRight on the window.location.hash,
      similar method.
   3. The router caches its 3 different routes: left, middle, right.
   4. The window.location.hash is updated if needed, this will match the cached value, 
      thus not requiring any circular reference.
   5. The three routes (with the rightmost route) is passed passed out as a routechange event (or a callback). 

2. Upon receiving the hash

Often, the symbolic path is in a reader-friendly format, and 
the system path is in another system-near format.
However, it is important to see that the router system does two things.
First, it parses and translates purely symbolically a data object given in as string into 
another data object given as an object.
Then, many routers also connects this parsed data object with *actionable* callback functions or classes.

A hash-dot link is **a list** of **hash keywords** with **`.`-postfix arguments**.
Each keyword typically point to one component.

### How to interpret hash-dot routes

   
## Strategy: routing

4. Make the router simple, and move processing of navigation choices to where it belong:
   the state management system.
   The state manager can choose to overlap hashtags as values:
   `#product#shoes` => if first `#`-tag === `product`, then second `#`-tag => productCategory.
   Or `#product?shoes` => if `#`-tag === `product`, productCategory = first argument.

## Strategy 3: #myWay

When working with a small set of resources, lets say less than 20, 
these resources can be grouped together in a single folder and organized using file name only.
When working with a really large set of resources, lets say more than 100,
these resources quickly need some kind of database so that they can be retrieved and composed using queries.
But, when working with a medium sized data sets, lets say between 20 and 100 resources, 
the classic folder/"file system" is most often the best suitable and simple solution.

Folders help the developer organize his resources into smaller, manageable groups.
Folders also enable the developer to sort groups under other groups, 
thus making a meaningful hierarchical super structure for his resource set.
But, in addition, the folder convention of organizing resources also provide 
relative links as a simpler way to navigate folder organized resource sets.
**Relative linking is a morphological mean to navigate *within a folder based such resource set***.
Examples of relative links are `anotherFileInTheSameFolder.txt` or 
`../../another/folder/with/another/file.txt`.

Relevant links is not exclusive to urls. On the contrary, relative links is part of the URI convention, 
and thus established on the web and desktop and server alike.
The benefit of relative links is that they enable the developer to imply relationships between resources
thus invoking the meaningful hierarchical super-structure established by the folders.
Put metaphorically:
1. We structure files in folders in "a meaningful way".
2. These meaningful ways describe "where" a file belong, and gives a direction of how to get there.
   These descriptions are the links.
3. To use "absolute links", would be the same as going *back to start and then out* when we
   need to go to a file or folder.
4. But what if we already have gone to one file or folder, and wish to visit another file or folder in 
   the same neighbourhood, or a relative of that file, in the same building or in the next street?
   To travel all the way back to start and out again every time would be cumbersome?
5. Relative links gives us these other "meaningful ways" to travel from one place to another
   based on where you currently are. 
   As long as both locations are in the same map, and you know this map,
   the relative maps gives you a conceptual shortcut that enable you to imagine and plan
   longer journeys with multiple stops much more intuitively.

`#`-based navigation has no such folder-hierarchy nor relative linking morphology conventions.
Instead, `#`-based references are completely flat.
When used to organize and navigate a medium sized data set, 
the lack of grammatical support along the lines of folders and relative links becomes apparent.

To tackle this problem one often end up re-making a "folder and relative link"-type system.
Ad-hoc namespaces (cf. folder organization) are quickly established (names starting with "_" or "problem_"), 
or other conventional hierachical morphologies are employed (names separated by ".").
In addition, "routing algorithms" are erected that translate custom road descriptions to
actual, working resource pointers.

The questions become:
1. what kind of "relative link"-algorithms should one create under `#`-based navigation?
2. how should this algorithm be implemented?
3. where should this algorithm be implemented?

[1.] In client side navigation, path descriptions often resemble function references 
(component_name + component_value) more than file names. As components and arguments vary greatly, 
the combination of such calls rarely stay below 100, but becomes almost infinitely large.
The numbers of paths are larger than 100, even though the number of components can be less than 5,
because numerous different values can be assigned to each component.
Instead of looking to folders and `/`, I would more likely look toward `( .. , .. , .. )`,
`[ .. , .. ]`, `{ ..: .. ; ..: .. }` and `url/file.html?query=this&query=that` for inspiration.

Looking toward the database as a model, client side navigation can often be made simpler if
paths can be composed. Instead of point to a single coordinate, several coordinates should be able to 
be listed together as one. The URI is singular, the db query can ask for an array of entries.
Allowing for multiple, potentially unrelated locations to be listed along side each other
would relieve the system of making individual locations for such combinations.

[2.] These algorithms should remain simple and flat. The algorithms structure should not exceed the 
directly visible path description format. Word order and word semantics should not intermingle.
For example, all these structures are equally valid: 
 * `#product=shoes#gender=men`
 * `#shoes#men`
 * `#men#shoes` 

But, if it was specified in parsing of the route that `#men` always had to come after `#shoes` or 
that `#shoes` meant something different if it was positioned as first hash-location, not second,
then semantics and word order become mixed which increase complexity at the point of routing 
much more than necessary.

By keeping things flat, the navigation algorithms remain declarative at the level of the router,
not imperative. The sequence of the route still remains in the produced output, but 
other parts of the app should decide how to interpret and follow these directions.
An app might choose for example to visit the locations in a different, more efficient order, 
or it might wish to interpret and merge several locations as one.

A declerative structure produces super simple notation formats such as:
1. divide the #-location into several #-components by splitting it on `#`.
2. Split each #-component into name and arguments on `=`.
3. Split arguments into argument on `&`.
4. Split each argument into argument name and value on `?` or `:`.
for example.

It does not really matter all that much which symbols are used where, as long as the route format
remain simplistic declarative and that the symbols used are conventionally recognized in their position
by both users and developers.

But, one job *should* be added to the router: *symbolic links*.
The router should enable the conversion of symbolic links into actual, working links.
As #-based routes should enable multiple #-components, 
this conversion should enable turning a symbolic link into a composition of multiple actual links.
  
[3.] The algorithm in the route should be general, intrinsic to the router.
The user should change its parsing algorithm by changing router, not by configuring it.
The map of symbolic links should be passed into the map.
If the router is set up as a web component, this can be done as lightDOM children.
The routes can also be passed in as a JSON object.
The router should produce the interpreted, parsed route out as an object, 
passed on to its environment as a detail in a `routechange` event and/or as the argument to
a `routeChangedCallback()`.

`#`-tag based navigation can turn idiosyncratic quite quickly.
If so, new developers entering the project might therefore have to not only understand the implementation
of the internal navigation, but also learn the syntax of a custom #-based format.

I would argue that the router described above is likely to be intuitively recognized by other developers,
but care should be taken not to expand a `#`-based router functionality beyond strict routing.



# References

 * 
 
## Draft, should I put in this in this chapter??

> Parsing #-location as if it was a path location = to spoof the path location.
> This is discussed under MPA router.

Systems relying on both the path and the #-tag of URLs will likely need to implement a parser
like [path-to-regex](https://github.com/pillarjs/path-to-regexp) on the client.
But, system relying on #-tag will also need to implement relative linking in some instances where
regular path-based navigation do not.

 