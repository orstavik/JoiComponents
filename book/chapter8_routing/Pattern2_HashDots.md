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

## HashDot rules

## DEMO time, go max!!!

ATT!! This demo only illustrate how to parse HashDots. It does not match them. 
I have no matching algorithm for only two HashDot lists.

Basically, it is just a unit test.

As a running function it looks like this:
```javascript
const test = "#shoes.42.black#menswear#search.'socks'";
const test1 = "#shoes::ALL#search:Q";
let res = HashDots.parse(test).tree;
let res2 = HashDots.parse(test2).tree;
res === [
  {
    keyword: "shoes",
    arguments: ["42", "black"],
    argumentTypes: ["42", "black"],
  }, {
    keyword: "menswear",
    arguments: [],
  }, {
    keyword: "search",
    arguments: ["'socks'"],
  }
];
res2 === [
  {
    keyword: "shoes",
    arguments: ["ALL"],
    argumentTypes: ["::"],
  }, {
    keyword: "menswear",
    arguments: [],
  }, {
    keyword: "search",
    arguments: ["'socks'"],
  }
];
```
For now, HashDots is strict and unforgiving. Attempting to parse these hashlocations will throw an Error.
```javascript
HashDots.parse("#no #whitespace #inBetween");
HashDots.parse("#no##missing.keywords");
HashDots.parse("#no#missing..arguments");
HashDots.parse("#no#illegal.characters?%&!¤,;:-_");
```

## Implementation

The syntax of HashDots can be summarized in the following pseudo form:
```
HashDotSequence := <HashDot>+
HashDot := <HashTag>(<DotOrDoubleDot>)*
HashTag := [#]<Keyword>
DotOrDoubleDot := Dot|DoubleDot|DoubleDoubleDot
Dot := [.](<Keyword>|<"double quoted" string>|<'single quoted' string>)
DoubleDot := [:]<Keyword>
DoubleDoubleDot := [::]<Keyword>
Keyword := [\w]+
```

A full implementation of HashDot parser in JS looks like this:
todo update this..

```javascript
function HashDots.parse(hashString) {

  function tokenType(c) {
    if (c === "'" || c === '"') return "'";
    if (/[\d\w]/.test(c)) return "w";
    if (c === "#") return "#";
    if (c === ".") return ".";
    return "u";
  }

  const toks = /("|')((?:\\\1|(?:(?!\1).))*)\1|\.|#|[\d\w]+/g;
  const res = [];
  let one = undefined;
  let hashtag;

  for (let t = toks.exec(hashString); t !== null; t = toks.exec(hashString)) {
    let w = t[0];
    let c = w[0];
    let two = tokenType(c);
    if (!one) {
      one = two;
      continue;
    }
    if (one === "#") {
      if (two === "w") {
        hashtag = {keyword: w, arguments: [], argumentString: ""};
        res.push(hashtag);
      } else {
        throw new SyntaxError("A HashTag must start with a keyword.");
      }
    }
    if (one === ".") {
      if (two === "w" || two === "'") {
        hashtag.arguments.push(w);
        hashtag.argumentString += "." + w;
      } else {
        throw new SyntaxError(
          "A HashTag argument starting with . must be followed by a digitword or a \"/'string."
        );
      }
    }
    if (one !== "." && one !== "#") {
      throw new SyntaxError(
        "A HashDot sequence must begin with either a '#' or a '.'"
      );
    }
    one = undefined;
  }
  return res;
}
```

# References

 * [HTML spec on links](https://www.w3.org/TR/html4/struct/links.html)
 * [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
 * [Article on routing](http://krasimirtsonev.com/blog/article/deep-dive-into-client-side-routing-navigo-pushstate-hash)
 * [Video on routing strategies](https://codecraft.tv/courses/angular/routing/routing-strategies/)
 * [Demo of pushstate and popstate](https://geeklaunch.net/pushstate-and-popstate/)