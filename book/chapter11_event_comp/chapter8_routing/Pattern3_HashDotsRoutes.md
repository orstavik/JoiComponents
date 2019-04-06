# Pattern: HashDotsRouteMap

## Intro: RouteMap

//todo: Commonly, the router does three tasks: 
//1. parse the given path into a data object.
//2. Convert shortcuts into full paths based on a set of rules
//3. link the path with an actionable object.

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

simple = complex
```

When routes have arguments, rules are matched on signature.
The most basic rule of matching would be to add the number of arguments with the name.
All these arguments must be matched from left to right, and vice versa.

Example:
The rule: `one.A.B = two.A, three.B`
Has the signature: `one/2 = two/1, three/1`
And from left to right match `one.hello.world`, but not `one.hello` nor `one.hello.beautiful.world`.
And from right to left match `two.hello, three.world`, but not `two.hello.world, three`, etc.
When the examples match, `A = hello` and `B = world`.

To grab all the arguments of a hashtag, use A*. 
This is especially beneficial when routes are used to simply extend a simpler expression.

Example:
The rule: `one.A* = one.A*, three`
Has the signature: `one/n = one/n, three/0`
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

## HashDotsRouteMap

A HashDotsRouteMap is a map that can convert one HashDots path into another HashDots path.
You specify the HashDotsRouteMap as a declarative map with two sides:

1. the user-facing side on the left (usually simpler and shorter), and
2. the system-facing side on the right (usually more explicated and longer).
3. Arguments can only be on the form of `[\w]+[\*]?` (regex).

Below is an example of a HashDotsRouteMap in JS.
```javascript
routeMap = [
  "#one:A:B = #two:A#three:B",
  "#one::A = #one::A#four"
];
```
The HashDotsRouteMap is converted into *two* PathReplaceFunctions-sets:
 * leftToRight
 * rightToLeft

```javascript
const leftToRight = [
  {
    signature: ["one/2"],
    replace: [
      {
        keyword: "two",
        arguments: ["one/0"]
      }, 
      {
        keyword: "three",
        arguments: ["one/1"]
      }
    ]
  },
  {
    signature: ["one/n"],
    replace: [
      
      {
        keyword: "one",
        arguments: "one/n"
      }, 
      {
        keyword: "four",
        arguments: []
      }
    ]
  }
];

const rightToLeft = [
  {
    signature: ["two/1", "three/1"],
    replace : [
      {
        keyword: "one",
        arguments: ["two/0", "three/0"]
      }
    ]
  },
  {
    signature: ["one/n", "four/0"],
    replace : [
      {
        keyword: "one",
        arguments: "one/n"
      }
    ]
  }
];
```
The resolve the rightMost description of a given HashDots path, 
the HashDotsRouteMap will try to match the signatures in sequential order with the keys 
in the leftToRight PathReplaceFunctions-set with the signatures in the given path (in sequential order).
Once a set of signatures match, then the HashDotsRouteMap will clone the matching rule,
grab the argument values from the given path to populate the replace side of the rule and then
clone the given path and replace the matching hashtags with the composed matching hashtags in the rule.
Every time a rule matches, the function is called recursively matching all the rules.

The exact same procedure is run on the rightToLeft map in order to resolve 
the leftMost description of a HashDots path.

## alternative replace using regex

```javascript
routeMap = {
  "#one.A.B": "#two.A#three.B",
  "#one.A*": "#one.A*#four"
}
```
Can also be converted into a set of four regex replacers:
 * A and B from left to right (A multi-arguments and B single-arguments)
 * C and D from right to left (C multi-arguments and D single-arguments)

A is made by first identifying the multiarguments on the left hand side: `/\.[\w]+\*/g`.
The list of these arguments are then on the left side replaced with a generic query.

On the left side, the content is replaced 

```
Left side replace:
/\.[\w]+\*/g 
=>
((\.\"((?:\\\"|(?:(?!\").))*)\"|\.\'((?:\\\'|(?:(?!\').))*)\'|\.[\w]+)+)

Also on the left side escape # and `.`.


Right side replace:
/\.[\w]+\*/g 
=>
/((\.\"((?:\\\"|(?:(?!\").))*)\"|\.\'((?:\\\'|(?:(?!\').))*)\'|\.[\w]+)+)/g

``` 
On the right side, the content is replaced like 

From the left side, this can be done by finding all argument names in the left entry:
.  and then listing them sequentially.
Then, the same is done on the right side.

First, a list of fullArguments and partialArguments must be created.
This is done by finding all the arguments on 

## Unsolved problem 
How to handle fixed values in the routemap.
Lets say I want to add hashtag that also has a fixed value? How would I recognize that?
Maybe I should add a different symbol for variables such as "?"?
```javascript
routeMap = {
  "#one:A:B": "#two:A#three.123:B.fixedValue",
  "#one:*A": "#one:*A#four"
}
```


## the HashDotsRouter

1. The HashDotRouter can be given a HashDotsRouteMap at startup or at any later point run-time.

2. When given a new set HashDotsRouteMap, the HashDotsRouter will its HashDotsRouteMap into 
   two sets of leftwards and rightwards set of resolver functions.

3. The HashDotsRouter listens for `hashchange` event, and when for each `hashchange` event, it will
   1. check to see if the `hash` location is already known.
      A known hash-location matches either its existing leftMostPath, givenPath, or rightMostPath.
      If the location is known as either the givenPath or rightMostPath, 
      it will only update the window.location and return.
   2. If the path is unknown, the HashDotsRouter produce the leftMostPath and RightMostPath of the givenPath.
   3. If a new leftMostPath is created, the window.location.hash is updated. 
   4. If a new rightMostPath is created, 
      the HashDotsRouter dispatches a `routechange` event with the parsed rightMostPath as detail. 

### Anti-pattern: route => actionable?

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

### Problems:

1. lacking the `.` for numbers.

## HowTo: use HashDots routes

0. Combine composition of HashDots with HashDots shortcuts.
   Convert `#chapter2` into `#chapter2_1#chapter2_2#chapter2_3` and then
   `#intro.mixins_md#example.simpleMixin#references.2_1#intro.mixins_...`.
   This will enable you to organize medium-sized data sets much more comfortably. 

1. Look to the hashtag convention. Don't be afraid to list many keywords and few arguments.
   A rule of thumb is that a HashDots link in sum should have more keywords than arguments. 

2. Manage HashDots order in the state manager, not in the links.
   A sporting goods store might wish to keep `#menswear#shoes` as two separate hashtags.
   However, when given both tags, the state manager can elect not show both selections, 
   but merge the two categories (as the two categories have too many items).
   The store could then choose to process `#shoes` first, then `#menswear` 
   as it is the more specialized (fewer items) of the tags.
   Or the store might choose to process `#menswear` first, then `#shoes`,
   as they are listed in that order, or because the users browsing history indicate this order.
   Such interpretation of tags can either be done simple (sequential), user oriented
   (looking towards previous app state) or data oriented (looking to the state or persistent data content).

3. Try to find a balance between keywords and arguments.
   A user at the sporting goods store might search for shoes size 44. Or 44-45.
   The most user friendly format would be `#shoes.44-45`. Not `#shoes#44#45` nor `#shoes.44.45`

   
Often, the symbolic path is in a reader-friendly format, and 
the system path is in another system-near format.
However, it is important to see that the router system does two things.
First, it parses and translates purely symbolically a data object given in as string into 
another data object given as an object.
Then, many routers also connects this parsed data object with *actionable* callback functions or classes.

A hash-dot link is **a list** of **hash keywords** with **`.`-postfix arguments**.
Each keyword typically point to one component.




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

 