# Pattern: HashDotRouter

## DEMO time, go max!!!

ATT!! This demo only illustrate how to parse HashDots. It does not match them. 
I have no matching algorithm for only two HashDot lists.

Basically, it is just a unit test.

As a running function it looks like this:
```javascript
const test = "#shoes.42.black#menswear#search.'socks'";
const test1 = "#shoes::ALL#search:Q";
let res = HashDots.parse(test)[0].left.tree;
let res2 = HashDots.parse(test2)[0].left.tree;
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
Todo here there should be a reference to the unit test. I should make a unit-test component.
The unit tests will then explicitly 

For now, HashDots is strict and unforgiving. Attempting to parse these hashlocations will throw an Error.
```javascript
HashDots.parse("#no#missing..arguments");
HashDots.parse("#no#illegal.characters?%&¤,;-_");
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